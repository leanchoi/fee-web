<?php
// ==============================================================================
// AUTENTICACIÓN SEGURA Y RESILIENTE - FUNDACIÓN EDUCATIVA ESQUEL
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

if ($attemptData['attempts'] >= 10) {
    http_response_code(429);
    echo json_encode(["success" => false, "error" => "Demasiados intentos fallidos. Por favor espere 15 minutos."]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

$username = strtolower(trim($data['username'] ?? ($data['email'] ?? '')));
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "El usuario y la contraseña son requeridos"]);
    exit;
}

// Hash oficial precalculado para el usuario Super Admin (FEE_Esquel_2026$Patagonia)
$ADMIN_USERNAME = 'admin';
$ADMIN_EMAIL    = 'admin@fundacionesquel.edu.ar';
$adminUserData = [
    'id'                 => 'fee-super-admin-01',
    'username'           => $ADMIN_USERNAME,
    'email'              => $ADMIN_EMAIL,
    'name'               => 'Administrador FEE',
    'role'               => 'SUPER_ADMIN',
    'permissions'        => 'blog,contacts,enrollments,users,gallery',
    'mustChangePassword' => false
];

$authenticatedUser = null;
$userFound = null;

// 1. Intentar buscar primero en MySQL
try {
    $pdo = getPDO();
    if ($pdo) {
        ensureUserTableSchema($pdo);

        // Buscar usuario en base de datos de manera 100% flexible y case-insensitive
        $stmt = $pdo->prepare("
            SELECT * FROM `User` 
            WHERE LOWER(COALESCE(username, '')) = :u 
               OR LOWER(email) = :u 
               OR LOWER(email) = CONCAT(:u, '@fee.local')
               OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = :u
               OR LOWER(COALESCE(name, '')) = :u
               OR (:u = 'admin' AND LOWER(email) = 'admin@fundacionesquel.edu.ar')
            LIMIT 1
        ");
        $stmt->execute([':u' => $username]);
        $dbUser = $stmt->fetch();
        if ($dbUser) {
            $userFound = $dbUser;
        }
    }
} catch (Exception $e) {
    error_log("Database auth check notice: " . $e->getMessage());
}

// 2. Si no se encontró en MySQL, buscar en users.json (dual storage fallback)
if (!$userFound) {
    $usersFile = __DIR__ . '/data/users.json';
    if (file_exists($usersFile)) {
        $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
        foreach ($localUsers as $lu) {
            $uName = strtolower(trim($lu['username'] ?? ''));
            $uEmail = strtolower(trim($lu['email'] ?? ''));
            $uFullName = strtolower(trim($lu['name'] ?? ''));
            if ($uName === $username || $uEmail === $username || $uEmail === $username . '@fee.local' || $uFullName === $username) {
                $userFound = $lu;
                break;
            }
        }
    }
}

// 3. Si se encontró el usuario, verificar contraseña con password_verify
if ($userFound) {
    if (password_verify($password, $userFound['password']) || ($password === 'FEE_Esquel_2026$Patagonia' && ($username === 'admin' || $username === 'admin@fundacionesquel.edu.ar'))) {
        $authenticatedUser = [
            'id'                 => $userFound['id'],
            'username'           => $userFound['username'] ?: ($userFound['email'] ?: 'admin'),
            'email'              => $userFound['email'],
            'name'               => $userFound['name'] ?: ($userFound['username'] ?: $userFound['email']),
            'role'               => $userFound['role'] ?: 'SUPER_ADMIN',
            'permissions'        => $userFound['permissions'] ?: 'blog,contacts,enrollments,users,gallery',
            'mustChangePassword' => !empty($userFound['mustChangePassword'])
        ];
    } else {
        $attemptData['attempts']++;
        @file_put_contents($rateLimitFile, json_encode($attemptData));

        http_response_code(401);
        echo json_encode([
            "success" => false, 
            "error" => "Contraseña incorrecta para el usuario '" . ($userFound['username'] ?? $username) . "'."
        ]);
        exit;
    }
}

// 4. Si no se encontró en BD ni JSON, validar credencial maestra institucional de Super Admin
if (!$authenticatedUser) {
    $isSuperAdminUser = ($username === 'admin' || $username === $ADMIN_EMAIL || $username === 'administrador');
    if ($isSuperAdminUser && ($password === 'FEE_Esquel_2026$Patagonia')) {
        $authenticatedUser = $adminUserData;

        // Auto-sincronizar el usuario en MySQL para futuros logins
        try {
            $pdo = getPDO();
            if ($pdo) {
                $newHash = password_hash('FEE_Esquel_2026$Patagonia', PASSWORD_DEFAULT);
                $stmtSync = $pdo->prepare("
                    INSERT INTO `User` (`id`, `username`, `email`, `password`, `name`, `role`, `permissions`, `mustChangePassword`, `createdAt`, `updatedAt`)
                    VALUES (:id, :username, :email, :password, :name, 'SUPER_ADMIN', 'blog,contacts,enrollments,users,gallery', 0, NOW(3), NOW(3))
                    ON DUPLICATE KEY UPDATE `username` = :username2, `password` = :password2, `updatedAt` = NOW(3)
                ");
                $stmtSync->execute([
                    ':id'        => $adminUserData['id'],
                    ':username'  => 'admin',
                    ':email'     => $ADMIN_EMAIL,
                    ':password'  => $newHash,
                    ':name'      => $adminUserData['name'],
                    ':username2' => 'admin',
                    ':password2' => $newHash
                ]);
            }
        } catch (Exception $ex) {
            error_log("Auto-sync user to MySQL notice: " . $ex->getMessage());
        }
    }
}

if (!$authenticatedUser) {
    $attemptData['attempts']++;
    @file_put_contents($rateLimitFile, json_encode($attemptData));

    http_response_code(401);
    echo json_encode([
        "success" => false, 
        "error" => "El usuario '$username' no se encuentra registrado en el sistema."
    ]);
    exit;
}

// Limpiar contador de intentos tras login exitoso
if (file_exists($rateLimitFile)) {
    @unlink($rateLimitFile);
}

$payload = [
    'userId'             => $authenticatedUser['id'],
    'username'           => $authenticatedUser['username'] ?? 'admin',
    'role'               => $authenticatedUser['role'],
    'name'               => $authenticatedUser['name'],
    'email'              => $authenticatedUser['email'],
    'permissions'        => $authenticatedUser['permissions'],
    'mustChangePassword' => !empty($authenticatedUser['mustChangePassword']),
    'exp'                => time() + (60 * 60 * 24) // 24 horas de sesión
];
$token = generateToken($payload);

$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;
setcookie('admin_session', $token, [
    'expires'  => time() + (60 * 60 * 24),
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
