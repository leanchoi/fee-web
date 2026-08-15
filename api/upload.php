<?php
// ==============================================================================
// SUBIDA SEGURA DE ARCHIVOS MULTIMEDIA - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

$token = getBearerToken();
$session = verifyToken($token);

if (!$session) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "No autorizado. Inicie sesión para subir archivos."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $uploadErr = $_FILES['file']['error'] ?? 'Sin archivo';
    echo json_encode(["success" => false, "error" => "No se recibió ningún archivo válido para subir ($uploadErr)"]);
    exit;
}

$file = $_FILES['file'];
$maxSize = 10 * 1024 * 1024; // 10 MB

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "El archivo supera el tamaño máximo permitido de 10MB"]);
    exit;
}

// Validar tipos de archivo permitidos (imágenes y videos)
$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    'video/mp4'  => 'mp4',
    'video/webm' => 'webm'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($allowedMimes[$mimeType])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Tipo de archivo no permitido ($mimeType). Solo imágenes y videos."]);
    exit;
}

$ext = $allowedMimes[$mimeType];

// Directorio de subidas (asegurar existencia)
$uploadDir = dirname(__DIR__) . '/uploads';
if (!is_dir($uploadDir)) {
    @mkdir($uploadDir, 0755, true);
}

// Crear .htaccess en uploads para prevenir ejecución de scripts
$htaccessPath = $uploadDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps .cgi .pl\nphp_flag engine off\nOptions -Indexes\n");
}

$randomName = 'fee_media_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
$targetPath = $uploadDir . '/' . $randomName;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $publicUrl = '/uploads/' . $randomName;
    echo json_encode([
        "success" => true,
        "url"     => $publicUrl,
        "name"    => $file['name'],
        "size"    => $file['size']
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error interno al guardar el archivo en el servidor"]);
}
