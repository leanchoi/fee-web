<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

$n = 0;
foreach (glob(sys_get_temp_dir() . '/fee_login_rl_*.json') ?: [] as $f) {
    if (@unlink($f)) $n++;
}
foreach (glob(__DIR__ . '/logs/rl/*.json') ?: [] as $f) {
    if (@unlink($f)) $n++;
}

jsonResponse(200, [
    'success' => true,
    'message' => "Archivos de rate limit eliminados: $n"
]);
