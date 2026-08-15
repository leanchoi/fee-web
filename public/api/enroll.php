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

$tutorName    = trim($data['tutorName'] ?? '');
$tutorEmail   = trim($data['tutorEmail'] ?? '');
$tutorPhone   = trim($data['tutorPhone'] ?? '');
$studentName  = trim($data['studentName'] ?? '');
$studentLevel = trim($data['studentLevel'] ?? '');
$studentGrade = trim($data['studentGrade'] ?? '');
$comments     = trim($data['comments'] ?? '');

if (empty($tutorName) || empty($tutorEmail) || empty($tutorPhone) || empty($studentName) || empty($studentLevel) || empty($studentGrade)) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => "Por favor complete todos los campos obligatorios."]);
    exit;
}

if (!filter_var($tutorEmail, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => "El correo electrónico no es válido."]);
    exit;
}

$id = generateUUID();

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        INSERT INTO `Enrollment` (`id`, `tutorName`, `tutorEmail`, `tutorPhone`, `studentName`, `studentLevel`, `studentGrade`, `comments`, `status`, `createdAt`)
        VALUES (:id, :tutorName, :tutorEmail, :tutorPhone, :studentName, :studentLevel, :studentGrade, :comments, 'PENDING', NOW(3))
    ");

    $stmt->execute([
        ':id'           => $id,
        ':tutorName'    => $tutorName,
        ':tutorEmail'   => $tutorEmail,
        ':tutorPhone'   => $tutorPhone,
        ':studentName'  => $studentName,
        ':studentLevel' => $studentLevel,
        ':studentGrade' => $studentGrade,
        ':comments'     => $comments
    ]);

    echo json_encode(["success" => true, "id" => $id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Error al guardar la preinscripción: " . $e->getMessage()]);
}
