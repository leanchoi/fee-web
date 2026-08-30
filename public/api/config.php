<?php
// ==============================================================================
// CONFIGURACIÓN CENTRAL Y SEGURIDAD - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================

// Fijar Zona Horaria Oficial de Argentina (GMT-3)
date_default_timezone_set('America/Argentina/Buenos_Aires');

// Manejo estricto de CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'https://fundacionesquel.edu.ar',
    'https://www.fundacionesquel.edu.ar',
    'http://localhost:3000',
    'http://localhost:3001'
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Cargar configuración externa protegida si existe fuera del webroot
$externalConfigFile = '/home/' . get_current_user() . '/fee-config.php';
if (file_exists($externalConfigFile)) {
    require_once $externalConfigFile;
}

// 2. Parámetros por defecto protegidos
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'u769174130_escueladb');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'u769174130_admin_db');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: 'Arcoiris1986');

if (!defined('JWT_SECRET')) {
    $secret = getenv('JWT_SECRET') ?: 'f93c04968848d5eb29cbca82dbbbd76e4c76b911762c2f10b3724c96adbfcb36';
    define('JWT_SECRET', $secret);
}

if (!defined('GOOGLE_SHEET_WEBHOOK_URL')) {
    define('GOOGLE_SHEET_WEBHOOK_URL', 'https://script.google.com/macros/s/AKfycbzfxI_lQ910slPUVyc-scTPr96Jam8jQzHmFTWbCaa6guGpnVb5JUm4oN38h8PgkBsk/exec');
}

// Conexión PDO única y ultra-resiliente (con fallback multi-host y timezone -03:00)
function getPDO() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $hosts = [DB_HOST, 'localhost', '127.0.0.1'];
    $lastException = null;

    foreach (array_unique($hosts) as $host) {
        $dsn = "mysql:host=" . $host . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $pdo->exec("SET time_zone = '-03:00'");
            return $pdo;
        } catch (PDOException $e) {
            $lastException = $e;
        }
    }

    error_log("Database connection failed: " . ($lastException ? $lastException->getMessage() : 'unknown'));
    return null;
}

function getDatabaseConnection() {
    return getPDO();
}

// Compatibilidad retroactiva para endpoints existentes
function ensureUserTableSchema($pdo) {
    return true;
}
function ensureEnrollmentTableSchema($pdo) {
    return true;
}

// ==============================================================================
// GESTIÓN DE TOKENS CSRF (DOUBLE-SUBMIT COOKIE PATTERN)
// ==============================================================================
function generateCsrfToken() {
    $token = bin2hex(random_bytes(32));
    setcookie('fee_csrf', $token, [
        'expires' => time() + 86400,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => false, // Legible por JS en el cliente para adjuntar en cabecera
        'samesite' => 'Lax'
    ]);
    return $token;
}

function verifyCsrfToken() {
    $cookieToken = $_COOKIE['fee_csrf'] ?? '';
    $headers = getallheaders();
    $headerToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';

    if (empty($cookieToken) || empty($headerToken)) {
        return false;
    }
    return hash_equals($cookieToken, $headerToken);
}

function requireCsrfToken() {
    if (!verifyCsrfToken()) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Token de seguridad CSRF inválido o ausente."]);
        exit;
    }
}

// ==============================================================================
// AUTENTICACIÓN JWT
// ==============================================================================
function generateToken($payload) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $body = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header.$body", JWT_SECRET, true);
    $signature = base64_encode($signature);
    return "$header.$body.$signature";
}

function verifyToken($token) {
    if (!$token || strlen(JWT_SECRET) < 32) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($header, $body, $signature) = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (hash_equals($validSignature, $signature)) {
        $payload = json_decode(base64_decode($body), true);
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Token expirado
        }
        return $payload;
    }
    return false;
}

function verifyJwtToken($token) {
    return verifyToken($token);
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
    if (isset($_COOKIE['fee_token'])) {
        return $_COOKIE['fee_token'];
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

// Sincronización a Google Sheets
function syncToGoogleSheets($payload) {
    $url = defined('GOOGLE_SHEET_WEBHOOK_URL') ? GOOGLE_SHEET_WEBHOOK_URL : '';
    if (empty($url)) return false;

    $jsonData = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($jsonData)
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        error_log("Google Sheets sync error: " . curl_error($ch));
    }
    curl_close($ch);
    return $response;
}
