<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
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

// 1. Acceso Maestro
$isMasterUser = ($email === 'admin' || $email === 'admin@fundacioneducativaesquel.com.ar' || $email === 'admin@esquel.edu.ar');
$isMasterPass = ($password === 'admin123' || $password === 'esquel2026' || $password === 'Arcoiris1986' || $password === 'Munecodenieve2026');

if ($isMasterUser && $isMasterPass) {
    $payload = [
        'userId'      => 'master',
        'role'        => 'SUPER_ADMIN',
        'name'        => 'Super Administrador',
        'permissions' => 'blog,contacts,enrollments,users',
        'exp'         => time() + (60 * 60 * 24 * 7) // 7 días
    ];
    $token = generateToken($payload);
    
    // Set cookie
    setcookie('admin_session', $token, [
        'expires'  => time() + (60 * 60 * 24 * 7),
        'path'     => '/',
        'httponly' => false, // accesible para que el dashboard Next.js lo lea si lo necesita
        'samesite' => 'Lax'
    ]);

    echo json_encode([
        "success" => true,
        "token"   => $token,
        "user"    => $payload
    ]);
    exit;
}

// 2. Consulta en la tabla User de MySQL
try {
    $stmt = $pdo->prepare("SELECT * FROM `User` WHERE LOWER(email) = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos"]);
        exit;
    }

    // Verificar hash o texto plano si fue recién creada
    $passwordValid = password_verify($password, $user['password']) || ($password === $user['password']);
    if (!$passwordValid) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Contraseña incorrecta"]);
        exit;
    }

    $payload = [
        'userId'      => $user['id'],
        'role'        => $user['role'],
        'name'        => $user['name'] ?: $user['email'],
        'email'       => $user['email'],
        'permissions' => $user['permissions'],
        'exp'         => time() + (60 * 60 * 24 * 7)
    ];
    $token = generateToken($payload);

    setcookie('admin_session', $token, [
        'expires'  => time() + (60 * 60 * 24 * 7),
        'path'     => '/',
        'httponly' => false,
        'samesite' => 'Lax'
    ]);

    echo json_encode([
        "success" => true,
        "token"   => $token,
        "user"    => $payload
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error de servidor al autenticar"]);
}
