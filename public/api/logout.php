<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

clearSessionCookie();
jsonResponse(200, ['success' => true, 'message' => 'Sesión cerrada correctamente']);
