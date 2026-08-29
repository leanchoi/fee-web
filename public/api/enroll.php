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

// Extraer campos de Reinscripción 2027
$studentName  = htmlspecialchars(trim($data['studentName'] ?? ''), ENT_QUOTES, 'UTF-8');
$studentDni   = preg_replace('/[^0-9]/', '', (string)($data['studentDni'] ?? ''));
$school       = htmlspecialchars(trim($data['school'] ?? 'Escuela N.º 1030'), ENT_QUOTES, 'UTF-8');
$studentGrade = htmlspecialchars(trim($data['studentGrade'] ?? ''), ENT_QUOTES, 'UTF-8');
$studentLevel = htmlspecialchars(trim($data['studentLevel'] ?? ''), ENT_QUOTES, 'UTF-8');
$hasSiblings  = !empty($data['hasSiblings']) ? 1 : 0;
$siblingDetails = htmlspecialchars(trim($data['siblingDetails'] ?? ''), ENT_QUOTES, 'UTF-8');

// Responsable 1
$parent1Name         = htmlspecialchars(trim($data['parent1Name'] ?? ($data['tutorName'] ?? '')), ENT_QUOTES, 'UTF-8');
$parent1Dni          = preg_replace('/[^0-9]/', '', (string)($data['parent1Dni'] ?? ''));
$parent1Relationship = htmlspecialchars(trim($data['parent1Relationship'] ?? 'Madre/Padre/Tutor'), ENT_QUOTES, 'UTF-8');
$parent1Phone        = htmlspecialchars(trim($data['parent1Phone'] ?? ($data['tutorPhone'] ?? '')), ENT_QUOTES, 'UTF-8');
$parent1Email        = trim($data['parent1Email'] ?? ($data['tutorEmail'] ?? ''));
$parent1Address      = htmlspecialchars(trim($data['parent1Address'] ?? ''), ENT_QUOTES, 'UTF-8');
$parent1City         = htmlspecialchars(trim($data['parent1City'] ?? 'Esquel'), ENT_QUOTES, 'UTF-8');
$parent1PostalCode   = htmlspecialchars(trim($data['parent1PostalCode'] ?? '9200'), ENT_QUOTES, 'UTF-8');

// Responsable 2
$isSingleParent      = !empty($data['isSingleParent']) ? 1 : 0;
if ($isSingleParent) {
    // Si declaró ser único responsable, limpiar cualquier dato residual
    $parent2Name         = '';
    $parent2Dni          = '';
    $parent2Relationship = '';
    $parent2Phone        = '';
    $parent2Email        = '';
    $parent2Address      = '';
    $parent2City         = '';
    $parent2PostalCode   = '';
    $signature2Data      = null;
} else {
    $parent2Name         = htmlspecialchars(trim($data['parent2Name'] ?? ''), ENT_QUOTES, 'UTF-8');
    $parent2Dni          = preg_replace('/[^0-9]/', '', (string)($data['parent2Dni'] ?? ''));
    $parent2Relationship = htmlspecialchars(trim($data['parent2Relationship'] ?? ''), ENT_QUOTES, 'UTF-8');
    $parent2Phone        = htmlspecialchars(trim($data['parent2Phone'] ?? ''), ENT_QUOTES, 'UTF-8');
    $parent2Email        = trim($data['parent2Email'] ?? '');
    $parent2Address      = htmlspecialchars(trim($data['parent2Address'] ?? ''), ENT_QUOTES, 'UTF-8');
    $parent2City         = htmlspecialchars(trim($data['parent2City'] ?? ''), ENT_QUOTES, 'UTF-8');
    $parent2PostalCode   = htmlspecialchars(trim($data['parent2PostalCode'] ?? ''), ENT_QUOTES, 'UTF-8');
    $signature2Data      = $data['signature2Data'] ?? null;
}

// Facturación
$billingName         = htmlspecialchars(trim($data['billingName'] ?? $parent1Name), ENT_QUOTES, 'UTF-8');
$billingCuit         = preg_replace('/[^0-9]/', '', (string)($data['billingCuit'] ?? $parent1Dni));
$billingTaxCondition = htmlspecialchars(trim($data['billingTaxCondition'] ?? 'Consumidor Final'), ENT_QUOTES, 'UTF-8');
$billingEmail        = trim($data['billingEmail'] ?? $parent1Email);
$billingAddress      = htmlspecialchars(trim($data['billingAddress'] ?? $parent1Address), ENT_QUOTES, 'UTF-8');

// Firmas y aceptación
$contractAccepted    = !empty($data['contractAccepted']) ? 1 : 0;
$dataAccepted        = !empty($data['dataAccepted']) ? 1 : 0;
$termsAccepted       = !empty($data['termsAccepted']) ? 1 : 0;
$signature1Data      = $data['signature1Data'] ?? null;
$comments            = htmlspecialchars(trim($data['comments'] ?? ''), ENT_QUOTES, 'UTF-8');

$enrollmentType = htmlspecialchars(trim($data['type'] ?? ''), ENT_QUOTES, 'UTF-8');
if (empty($enrollmentType)) {
    $enrollmentType = (!empty($data['signature1Data']) || !empty($studentDni)) ? 'reinscripcion_2027' : 'preinscripcion_general';
}

if ($enrollmentType === 'reinscripcion_2027') {
    if (empty($studentName) || empty($studentDni) || empty($studentGrade) || empty($parent1Name) || empty($parent1Dni) || empty($parent1Email) || empty($parent1Phone)) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "Por favor complete todos los campos obligatorios del estudiante y responsable principal."]);
        exit;
    }

    // Validar DNI (7 u 8 dígitos)
    if (strlen($studentDni) < 7 || strlen($studentDni) > 8) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "El DNI del estudiante debe tener 7 u 8 dígitos numéricos válidos."]);
        exit;
    }
    if (strlen($parent1Dni) < 7 || strlen($parent1Dni) > 8) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "El DNI del Responsable 1 debe tener 7 u 8 dígitos numéricos válidos."]);
        exit;
    }
    if (!$isSingleParent && !empty($parent2Dni) && (strlen($parent2Dni) < 7 || strlen($parent2Dni) > 8)) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "El DNI del Responsable 2 debe tener 7 u 8 dígitos numéricos válidos."]);
        exit;
    }

    // Validar CUIT (8 u 11 dígitos)
    if (strlen($billingCuit) !== 8 && strlen($billingCuit) !== 11) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "El CUIT / DNI de facturación debe contener 8 u 11 dígitos numéricos."]);
        exit;
    }

    // Validar Domicilio no sea únicamente numérico
    if (!empty($parent1Address) && preg_match('/^[\d\s\-\+\(\)\.\,\/]+$/', $parent1Address)) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "El domicilio debe incluir calle y número (no puede ser un número de teléfono)."]);
        exit;
    }
} else {
    // Preinscripción general (Aspirantes nuevos)
    if (empty($studentName) || empty($parent1Name) || empty($parent1Email) || empty($parent1Phone)) {
        http_response_code(422);
        echo json_encode(["success" => false, "error" => "Por favor complete los campos obligatorios (Nombre del aspirante, Tutor, Email y Teléfono)."]);
        exit;
    }
}

if (!filter_var($parent1Email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => "El correo electrónico del contacto no es válido."]);
    exit;
}

$id = generateUUID();
$trackingNumber = ($enrollmentType === 'reinscripcion_2027' ? 'FEE-2027-' : 'PRE-') . strtoupper(substr(md5(uniqid()), 0, 5));
$now = date('Y-m-d H:i:s');

$record = [
    'id'                  => $id,
    'type'                => $enrollmentType,
    'trackingNumber'      => $trackingNumber,
    'studentName'         => $studentName,
    'studentDni'          => $studentDni,
    'school'              => $school,
    'studentLevel'        => $studentLevel,
    'studentGrade'        => $studentGrade,
    'hasSiblings'         => $hasSiblings,
    'siblingDetails'      => $siblingDetails,
    'parent1Name'         => $parent1Name,
    'tutorName'           => $parent1Name,
    'parent1Dni'          => $parent1Dni,
    'parent1Relationship' => $parent1Relationship,
    'parent1Phone'        => $parent1Phone,
    'tutorPhone'          => $parent1Phone,
    'parent1Email'        => $parent1Email,
    'tutorEmail'          => $parent1Email,
    'parent1Address'      => $parent1Address,
    'parent1City'         => $parent1City,
    'parent1PostalCode'   => $parent1PostalCode,
    'isSingleParent'      => $isSingleParent,
    'parent2Name'         => $parent2Name,
    'parent2Dni'          => $parent2Dni,
    'parent2Relationship' => $parent2Relationship,
    'parent2Phone'        => $parent2Phone,
    'parent2Email'        => $parent2Email,
    'parent2Address'      => $parent2Address,
    'parent2City'         => $parent2City,
    'parent2PostalCode'   => $parent2PostalCode,
    'billingName'         => $billingName,
    'billingCuit'         => $billingCuit,
    'billingTaxCondition' => $billingTaxCondition,
    'billingEmail'        => $billingEmail,
    'billingAddress'      => $billingAddress,
    'contractAccepted'    => $contractAccepted,
    'dataAccepted'        => $dataAccepted,
    'termsAccepted'       => $termsAccepted,
    'signature1Data'      => $signature1Data,
    'signature2Data'      => $signature2Data,
    'comments'            => $comments,
    'status'              => 'PENDING',
    'contractVersion'     => '2027.v1',
    'createdAt'           => $now,
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
    'type'           => 'reinscripcion_2027',
    'id'             => $id,
    'trackingNumber' => $trackingNumber,
    'studentName'    => $studentName,
    'studentDni'     => $studentDni,
    'school'         => $school,
    'studentGrade'   => $studentGrade,
    'parent1Name'    => $parent1Name,
    'parent1Phone'   => $parent1Phone,
    'parent1Email'   => $parent1Email,
    'parent2Name'    => $isSingleParent ? 'Único Responsable' : $parent2Name,
    'billingName'    => $billingName,
    'billingCuit'    => $billingCuit,
    'contractVersion'=> '2027.v1',
    'createdAt'      => $now
];
syncToGoogleSheets($googlePayload);

// 5. Guardar en MySQL
try {
    $pdo = getPDO();
    if ($pdo) {
        ensureEnrollmentTableSchema($pdo);
        $stmt = $pdo->prepare("
            INSERT INTO `Enrollment` (
                `id`, `type`, `trackingNumber`, `studentName`, `studentDni`, `school`, `studentLevel`, `studentGrade`,
                `hasSiblings`, `siblingDetails`, `parent1Name`, `parent1Dni`, `parent1Relationship`, `parent1Phone`,
                `parent1Email`, `parent1Address`, `parent1City`, `parent1PostalCode`, `isSingleParent`, `parent2Name`,
                `parent2Dni`, `parent2Relationship`, `parent2Phone`, `parent2Email`, `parent2Address`, `parent2City`,
                `parent2PostalCode`, `billingName`, `billingCuit`, `billingTaxCondition`, `billingEmail`, `billingAddress`,
                `contractAccepted`, `dataAccepted`, `termsAccepted`, `signature1Data`, `signature2Data`,
                `tutorName`, `tutorEmail`, `tutorPhone`, `comments`, `status`, `contractVersion`, `createdAt`
            )
            VALUES (
                :id, :type, :trackingNumber, :studentName, :studentDni, :school, :studentLevel, :studentGrade,
                :hasSiblings, :siblingDetails, :parent1Name, :parent1Dni, :parent1Relationship, :parent1Phone,
                :parent1Email, :parent1Address, :parent1City, :parent1PostalCode, :isSingleParent, :parent2Name,
                :parent2Dni, :parent2Relationship, :parent2Phone, :parent2Email, :parent2Address, :parent2City,
                :parent2PostalCode, :billingName, :billingCuit, :billingTaxCondition, :billingEmail, :billingAddress,
                :contractAccepted, :dataAccepted, :termsAccepted, :signature1Data, :signature2Data,
                :tutorName, :tutorEmail, :tutorPhone, :comments, 'PENDING', '2027.v1', NOW(3)
            )
        ");
        $stmt->execute([
            ':id'                  => $id,
            ':type'                => $enrollmentType,
            ':trackingNumber'      => $trackingNumber,
            ':studentName'         => $studentName,
            ':studentDni'          => $studentDni,
            ':school'              => $school,
            ':studentLevel'        => $studentLevel,
            ':studentGrade'        => $studentGrade,
            ':hasSiblings'         => $hasSiblings,
            ':siblingDetails'      => $siblingDetails,
            ':parent1Name'         => $parent1Name,
            ':parent1Dni'          => $parent1Dni,
            ':parent1Relationship' => $parent1Relationship,
            ':parent1Phone'        => $parent1Phone,
            ':parent1Email'        => $parent1Email,
            ':parent1Address'      => $parent1Address,
            ':parent1City'         => $parent1City,
            ':parent1PostalCode'   => $parent1PostalCode,
            ':isSingleParent'      => $isSingleParent,
            ':parent2Name'         => $parent2Name,
            ':parent2Dni'          => $parent2Dni,
            ':parent2Relationship' => $parent2Relationship,
            ':parent2Phone'        => $parent2Phone,
            ':parent2Email'        => $parent2Email,
            ':parent2Address'      => $parent2Address,
            ':parent2City'         => $parent2City,
            ':parent2PostalCode'   => $parent2PostalCode,
            ':billingName'         => $billingName,
            ':billingCuit'         => $billingCuit,
            ':billingTaxCondition' => $billingTaxCondition,
            ':billingEmail'        => $billingEmail,
            ':billingAddress'      => $billingAddress,
            ':contractAccepted'    => $contractAccepted,
            ':dataAccepted'        => $dataAccepted,
            ':termsAccepted'       => $termsAccepted,
            ':signature1Data'      => $signature1Data,
            ':signature2Data'      => $signature2Data,
            ':tutorName'           => $parent1Name,
            ':tutorEmail'          => $parent1Email,
            ':tutorPhone'          => $parent1Phone,
            ':comments'            => $comments
        ]);
    }
} catch (Exception $e) {
    error_log("Enrollment DB save notice: " . $e->getMessage());
}

echo json_encode([
    "success"        => true,
    "id"             => $id,
    "trackingNumber" => $trackingNumber,
    "message"        => "Su solicitud de reinscripción para el ciclo lectivo 2027 fue recibida correctamente. La presentación del formulario no implica la confirmación automática de la vacante. La Fundación verificará el cumplimiento de los requisitos administrativos y arancelarios y comunicará posteriormente la confirmación de la reinscripción."
]);
?>
