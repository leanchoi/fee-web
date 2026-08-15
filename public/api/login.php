<?php
// ==============================================================================
// AUTENTICACIÓN SEGURA - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

// 1. Control básico de Rate Limiting por IP para prevención de fuerza bruta
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = sys_get_temp_dir() . '/fee_login_rl_' . md5($clientIp) . '.json';

$attemptData = ['attempts' => 0, 'first_attempt' => time()];
if (file_exists($rateLimitFile)) {
    $rawRl = @file_get_contents($rateLimitFile);
    if ($rawRl) {
        $parsedRl = json_decode($rawRl, true);
        if (is_array($parsedRl)) {
            $attemptData = $parsedRl;
        }
    }
}

// Reiniciar ventana de 15 minutos
if (time() - $attemptData['first_attempt'] > 900) {
    $attemptData = ['attempts' => 0, 'first_attempt' => time()];
}

if ($attemptData['attempts'] >= 6) {
    http_response_code(429);
    echo json_encode(["success" => false, "error" => "Demasiados intentos fallidos. Por favor intente en 15 minutos."]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$email    = strtolower(trim($data['email'] ?? ''));
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "El usuario y contraseña son requeridos"]);
    exit;
}

// 2. Consulta y aprovisionamiento seguro en la base de datos MySQL
try {
    $pdo = getPDO();
    if (!$pdo) {
        throw new Exception("No database connection available");
    }

    // Asegurar que el usuario Administrador Oficial exista con contraseña hasheada
    $checkAdmin = $pdo->query("SELECT COUNT(*) FROM `User` WHERE LOWER(email) = 'admin@fundacionesquel.edu.ar' OR LOWER(email) = 'admin'")->fetchColumn();
    if ($checkAdmin == 0) {
        $adminId = generateUUID();
        $adminHash = password_hash('FEE_Esquel_2026$Patagonia', PASSWORD_DEFAULT);
        $stmtInsert = $pdo->prepare("
            INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `permissions`, `createdAt`, `updatedAt`)
            VALUES (:id, 'admin@fundacionesquel.edu.ar', :password, 'Administrador FEE', 'SUPER_ADMIN', 'blog,contacts,enrollments,users', NOW(3), NOW(3))
        ");
        $stmtInsert->execute([
            ':id'       => $adminId,
            ':password' => $adminHash
        ]);
    }

    // Buscar el usuario por email o alias 'admin'
    $stmt = $pdo->prepare("
        SELECT * FROM `User` 
        WHERE LOWER(email) = :email 
           OR (:email = 'admin' AND LOWER(email) = 'admin@fundacionesquel.edu.ar')
        LIMIT 1
    ");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    $authSuccess = false;
    if ($user) {
        if (password_verify($password, $user['password'])) {
            $authSuccess = true;
        }
    }

    if (!$authSuccess) {
        $attemptData['attempts']++;
        @file_put_contents($rateLimitFile, json_encode($attemptData));

        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Credenciales inválidas"]);
        exit;
    }

    // Limpiar contador tras login exitoso
    if (file_exists($rateLimitFile)) {
        @unlink($rateLimitFile);
    }

    $payload = [
        'userId'      => $user['id'],
        'role'        => $user['role'] ?? 'SUPER_ADMIN',
        'name'        => $user['name'] ?: $user['email'],
        'email'       => $user['email'],
        'permissions' => $user['permissions'] ?? 'blog,contacts,enrollments,users',
        'exp'         => time() + (60 * 60 * 12) // 12 horas
    ];
    $token = generateToken($payload);

    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
    setcookie('admin_session', $token, [
        'expires'  => time() + (60 * 60 * 12),
        'path'     => '/',
        'httponly' => true,
        'secure'   => $isSecure,
        'samesite' => 'Lax'
    ]);

    echo json_encode([
        "success" => true,
        "token"   => $token,
        "user"    => $payload
    ]);
} catch (Exception $e) {
    error_log("Login server error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error interno del servidor al procesar la autenticación"]);
}
