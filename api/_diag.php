<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

$hdr = getRequestHeaders();
$t0 = microtime(true);
$pdo = getPDO();
$dbMs = round((microtime(true) - $t0) * 1000);

$cols = [];
if ($pdo) {
    try {
        $cols = $pdo->query("SHOW COLUMNS FROM `User`")->fetchAll(PDO::FETCH_COLUMN);
    } catch (Throwable $e) {
        $cols = ['ERROR' => $e->getMessage()];
    }
}

$testTok = generateToken(['userId' => 'test-user', 'role' => 'SUPER_ADMIN', 'exp' => time() + 3600]);
$verifyResult = verifyToken($testTok);

jsonResponse(200, [
    'php' => PHP_VERSION,
    'sapi' => PHP_SAPI,
    'https' => $_SERVER['HTTPS'] ?? '(no seteado)',
    'headers_keys' => array_keys($hdr),
    'auth_channels' => [
        'getallheaders.Authorization'  => $hdr['authorization'] ?? null,
        'getallheaders.x-authorization'=> $hdr['x-authorization'] ?? null,
        'HTTP_AUTHORIZATION'           => $_SERVER['HTTP_AUTHORIZATION'] ?? null,
        'REDIRECT_HTTP_AUTHORIZATION'  => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
        'HTTP_X_AUTHORIZATION'         => $_SERVER['HTTP_X_AUTHORIZATION'] ?? null,
    ],
    'cookies' => array_keys($_COOKIE),
    'db_connected' => (bool)$pdo,
    'db_connect_ms' => $dbMs,
    'user_columns' => $cols,
    'token_roundtrip' => ($verifyResult !== false),
    'rl_files' => array_map('basename', glob(sys_get_temp_dir() . '/fee_login_rl_*.json') ?: []),
    'tmp_dir' => sys_get_temp_dir()
]);
