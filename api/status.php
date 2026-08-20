<?php
// ==============================================================================
// DIAGNÓSTICO Y ESTADO DEL SISTEMA - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

$diagnostics = [
    "php_version" => PHP_VERSION,
    "timestamp"   => date('Y-m-d H:i:s'),
    "mysql"       => [
        "connected" => false,
        "host_used" => null,
        "error"     => null,
        "tables"    => [],
        "user_count"=> 0,
        "users"     => []
    ],
    "storage"     => [
        "data_dir_writable" => is_writable(__DIR__ . '/data'),
        "users_json_exists" => file_exists(__DIR__ . '/data/users.json'),
        "gallery_json_exists" => file_exists(__DIR__ . '/data/gallery.json'),
    ]
];

$hosts = [DB_HOST, 'localhost', '127.0.0.1'];
foreach (array_unique($hosts) as $host) {
    $dsn = "mysql:host=" . $host . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        ensureUserTableSchema($pdo);
        $diagnostics["mysql"]["connected"] = true;
        $diagnostics["mysql"]["host_used"] = $host;

        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN) ?: [];
        $diagnostics["mysql"]["tables"] = $tables;

        if (in_array('User', $tables, true)) {
            $users = $pdo->query("SELECT `id`, `username`, `email`, `name`, `role`, `mustChangePassword` FROM `User`")->fetchAll() ?: [];
            $diagnostics["mysql"]["user_count"] = count($users);
            $diagnostics["mysql"]["users"] = $users;
        }
        break;
    } catch (PDOException $e) {
        $diagnostics["mysql"]["error"] = $e->getMessage();
    }
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
