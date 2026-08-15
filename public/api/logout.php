<?php
// ==============================================================================
// CIERRE DE SESIÓN SEGURO - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443;

// 1. Expirar cookie de sesión mediante setcookie
setcookie('admin_session', '', [
    'expires'  => time() - 86400,
    'path'     => '/',
    'httponly' => true,
    'secure'   => $isSecure,
    'samesite' => 'Lax'
]);

// 2. Encabezado directo de eliminación
header("Set-Cookie: admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax", false);

echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada correctamente"
]);
