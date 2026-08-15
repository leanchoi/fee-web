<?php
// ==============================================================================
// FORMULARIO DE INSCRIPCIÓN SEGURO - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

// 1. Anti-spam Rate Limiting por IP
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = sys_get_temp_dir() . '/fee_enroll_rl_' . md5($clientIp) . '.json';

$attemptData = ['count' => 0, 'start' => time()];
if (file_exists($rateLimitFile)) {
    $rawRl = @file_get_contents($rateLimitFile);
    if ($rawRl) {
        $parsedRl = json_decode($rawRl, true);
        if (is_array($parsedRl)) $attemptData = $parsedRl;
    }
}

if (time() - $attemptData['start'] > 60) {
    $attemptData = ['count' => 0, 'start' => time()];
}

if ($attemptData['count'] >= 10) {
    http_response_code(429);
    echo json_encode(["success" => false, "error" => "Demasiadas solicitudes. Por favor espere un momento."]);
    exit;
}

$attemptData['count']++;
@file_put_contents($rateLimitFile, json_encode($attemptData));

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Datos inválidos"]);
    exit;
}

// 2. Honeypot check para bots automatizados
if (!empty($data['website_url']) || !empty($data['bot_check'])) {
    // Responder con éxito falso para no alertar a los spammers
    echo json_encode(["success" => true, "id" => "fake-" . time()]);
    exit;
}

$tutorName    = htmlspecialchars(trim($data['tutorName'] ?? ''), ENT_QUOTES, 'UTF-8');
$tutorEmail   = trim($data['tutorEmail'] ?? '');
$tutorPhone   = htmlspecialchars(trim($data['tutorPhone'] ?? ''), ENT_QUOTES, 'UTF-8');
$studentName  = htmlspecialchars(trim($data['studentName'] ?? ''), ENT_QUOTES, 'UTF-8');
$studentLevel = htmlspecialchars(trim($data['studentLevel'] ?? ''), ENT_QUOTES, 'UTF-8');
$studentGrade = htmlspecialchars(trim($data['studentGrade'] ?? ''), ENT_QUOTES, 'UTF-8');
$comments     = htmlspecialchars(trim($data['comments'] ?? ''), ENT_QUOTES, 'UTF-8');

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
$now = date('Y-m-d H:i:s');
$record = [
    'id'           => $id,
    'tutorName'    => $tutorName,
    'tutorEmail'   => $tutorEmail,
    'tutorPhone'   => $tutorPhone,
    'studentName'  => $studentName,
    'studentLevel' => $studentLevel,
    'studentGrade' => $studentGrade,
    'comments'     => $comments,
    'status'       => 'PENDING',
    'createdAt'    => $now
];

// 3. Guardar en almacenamiento protegido con flock y límite de tamaño
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0750, true);
}
$dataFile = $dataDir . '/enrollments.json';
$fp = @fopen($dataFile, 'c+');
if ($fp) {
    if (flock($fp, LOCK_EX)) {
        $filesize = filesize($dataFile);
        $existing = [];
        if ($filesize > 0) {
            $content = fread($fp, $filesize);
            $existing = json_decode($content, true) ?: [];
        }
        array_unshift($existing, $record);
        if (count($existing) > 1000) {
            $existing = array_slice($existing, 0, 1000);
        }
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// 4. Sincronizar en tiempo real con Google Sheets
$googlePayload = [
    'type'         => 'enrollment',
    'id'           => $id,
    'tutorName'    => $tutorName,
    'tutorEmail'   => $tutorEmail,
    'tutorPhone'   => $tutorPhone,
    'studentName'  => $studentName,
    'studentLevel' => $studentLevel,
    'studentGrade' => $studentGrade,
    'comments'     => $comments
];
syncToGoogleSheets($googlePayload);

// 5. Guardar en MySQL
try {
    $pdo = getPDO();
    if ($pdo) {
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
    }
} catch (Exception $e) {
    error_log("Enrollment DB insert error: " . $e->getMessage());
}

echo json_encode(["success" => true, "id" => $id]);
