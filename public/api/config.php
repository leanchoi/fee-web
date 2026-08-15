<?php
// Configuración de Conexión MySQL - Fundación Educativa Esquel (Hostinger)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_hosts = ['localhost', '127.0.0.1', 'srv1199.hstgr.io'];
$db_name  = 'u769174130_escueladb';
$db_user  = 'u769174130_admin_db';
$db_pass  = 'Arcoiris1986';

$pdo = null;
$lastError = '';

foreach ($db_hosts as $host) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 2,
        ]);
        if ($pdo) {
            break;
        }
    } catch (PDOException $e) {
        $lastError = $e->getMessage();
    }
}

if (!$pdo) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error de conexión a la base de datos: " . $lastError]);
    exit;
}

// Clave secreta para tokens de sesión
define('JWT_SECRET', 'fee_esquel_secret_patagonia_2026_hostinger_key');

function generateToken($payload) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $body = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header.$body", JWT_SECRET, true);
    $signature = base64_encode($signature);
    return "$header.$body.$signature";
}

function verifyToken($token) {
    if (!$token) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($header, $body, $signature) = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (hash_equals($validSignature, $signature)) {
        return json_decode(base64_decode($body), true);
    }
    return false;
}

function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_COOKIE['admin_session'])) {
        return $_COOKIE['admin_session'];
    }
    return null;
}

function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
