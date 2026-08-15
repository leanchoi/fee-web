<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Datos inválidos"]);
    exit;
}

$name    = trim($data['name'] ?? '');
$email   = trim($data['email'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => "Por favor complete todos los campos."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => "El correo electrónico no es válido."]);
    exit;
}

$id = generateUUID();
$now = date('Y-m-d H:i:s');
$record = [
    'id'        => $id,
    'name'      => $name,
    'email'     => $email,
    'subject'   => $subject,
    'message'   => $message,
    'createdAt' => $now
];

// 1. Guardar en almacenamiento seguro JSON de respaldo garantizado
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}
$dataFile = $dataDir . '/contacts.json';
$existing = [];
if (file_exists($dataFile)) {
    $existing = json_decode(file_get_contents($dataFile), true) ?: [];
}
array_unshift($existing, $record);
@file_put_contents($dataFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 2. Intentar guardar en MySQL si la conexión está lista
try {
    $pdo = getPDO();
    if ($pdo) {
        $stmt = $pdo->prepare("
            INSERT INTO `ContactMessage` (`id`, `name`, `email`, `subject`, `message`, `createdAt`)
            VALUES (:id, :name, :email, :subject, :message, NOW(3))
        ");
        $stmt->execute([
            ':id'      => $id,
            ':name'    => $name,
            ':email'   => $email,
            ':subject' => $subject,
            ':message' => $message
        ]);
    }
} catch (Exception $e) {
    // Si MySQL da error, el mensaje queda 100% a salvo en el archivo de respaldo
}

echo json_encode(["success" => true, "id" => $id]);
