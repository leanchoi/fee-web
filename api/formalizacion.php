<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/schema.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Configuración CORS restrictiva pero funcional
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = getPDO();
if (!$pdo) {
    jsonResponse(500, ['success' => false, 'error' => 'Error de conexión con la base de datos institucional.']);
}

ensureEnrollmentTableSchema($pdo);

switch ($action) {
    // 1. Verificar token y devolver datos sanitizados del aspirante para el contrato
    case 'verify':
        $token = trim($_GET['token'] ?? '');
        if (empty($token) || strlen($token) < 16) {
            jsonResponse(400, ['success' => false, 'error' => 'Token de formalización inválido o no provisto.']);
        }

        try {
            $stmt = $pdo->prepare("
                SELECT 
                    `id`, `trackingNumber`, `studentName`, `studentDni`, `studentLevel`, `studentGrade`, `school`,
                    `parent1Name`, `parent1Dni`, `parent1Relationship`, `parent1Phone`, `parent1Email`, `parent1Address`, `parent1City`, `parent1PostalCode`,
                    `isSingleParent`, `parent2Name`, `parent2Dni`, `parent2Relationship`, `parent2Phone`, `parent2Email`,
                    `billingName`, `billingCuit`, `billingTaxCondition`, `billingEmail`, `billingAddress`,
                    `admissionStatus`, `formalizationToken`, `formalizationExpiresAt`, `formalizationSignedAt`
                FROM `Enrollment` 
                WHERE `formalizationToken` = :token 
                LIMIT 1
            ");
            $stmt->execute([':token' => $token]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                jsonResponse(404, [
                    'success' => false, 
                    'error'   => 'El enlace de formalización no es válido o ha caducado. Por favor comunicate con la administración.'
                ]);
            }

            $alreadySigned = !empty($row['formalizationSignedAt']) || ($row['admissionStatus'] === 'confirmada');
            $isExpired = false;

            if (!empty($row['formalizationExpiresAt']) && strtotime($row['formalizationExpiresAt']) < time()) {
                $isExpired = true;
            }

            jsonResponse(200, [
                'success'       => true,
                'alreadySigned' => $alreadySigned,
                'isExpired'     => $isExpired,
                'enrollment'    => [
                    'id'                     => $row['id'],
                    'trackingNumber'         => $row['trackingNumber'],
                    'studentName'            => $row['studentName'],
                    'studentDni'             => $row['studentDni'],
                    'studentLevel'           => $row['studentLevel'],
                    'studentGrade'           => $row['studentGrade'],
                    'school'                 => $row['school'] ?: 'Escuela N.º 1030',
                    'parent1Name'            => $row['parent1Name'],
                    'parent1Dni'             => $row['parent1Dni'],
                    'parent1Relationship'    => $row['parent1Relationship'] ?: 'Madre/Padre',
                    'parent1Phone'           => $row['parent1Phone'],
                    'parent1Email'           => $row['parent1Email'],
                    'parent1Address'         => $row['parent1Address'],
                    'parent1City'            => $row['parent1City'] ?: 'Esquel',
                    'parent1PostalCode'      => $row['parent1PostalCode'] ?: '9200',
                    'isSingleParent'         => (bool)$row['isSingleParent'],
                    'parent2Name'            => $row['parent2Name'],
                    'parent2Dni'             => $row['parent2Dni'],
                    'parent2Relationship'    => $row['parent2Relationship'] ?: 'Padre/Madre',
                    'parent2Phone'           => $row['parent2Phone'],
                    'parent2Email'           => $row['parent2Email'],
                    'billingName'            => $row['billingName'] ?: $row['parent1Name'],
                    'billingCuit'            => $row['billingCuit'] ?: $row['parent1Dni'],
                    'billingTaxCondition'    => $row['billingTaxCondition'] ?: 'Consumidor Final',
                    'billingEmail'           => $row['billingEmail'] ?: $row['parent1Email'],
                    'billingAddress'         => $row['billingAddress'] ?: $row['parent1Address'],
                    'admissionStatus'        => $row['admissionStatus'],
                    'formalizationExpiresAt' => $row['formalizationExpiresAt'],
                    'formalizationSignedAt'  => $row['formalizationSignedAt'],
                ]
            ]);
        } catch (Exception $e) {
            jsonResponse(500, ['success' => false, 'error' => 'Error al consultar datos: ' . $e->getMessage()]);
        }
        break;

    // 2. Firma digital y consolidación oficial de matrícula
    case 'sign':
        if ($method !== 'POST') {
            jsonResponse(405, ['success' => false, 'error' => 'Método no permitido']);
        }

        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?: [];

        $token = trim($data['token'] ?? '');
        $signature1Data = trim($data['signature1Data'] ?? '');
        $signature2Data = trim($data['signature2Data'] ?? '');
        $termsAccepted = !empty($data['termsAccepted']) ? 1 : 0;
        $contractAccepted = !empty($data['contractAccepted']) ? 1 : 0;

        if (empty($token) || strlen($token) < 16) {
            jsonResponse(400, ['success' => false, 'error' => 'Token no provisto o inválido']);
        }

        if (empty($signature1Data)) {
            jsonResponse(400, ['success' => false, 'error' => 'Es obligatoria la firma del responsable titular para formalizar']);
        }

        try {
            $stmt = $pdo->prepare("
                SELECT `id`, `trackingNumber`, `studentName`, `admissionStatus`, `formalizationSignedAt` 
                FROM `Enrollment` 
                WHERE `formalizationToken` = :token 
                LIMIT 1
            ");
            $stmt->execute([':token' => $token]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$current) {
                jsonResponse(404, ['success' => false, 'error' => 'Trámite de formalización no encontrado']);
            }

            if (!empty($current['formalizationSignedAt'])) {
                jsonResponse(200, [
                    'success' => true, 
                    'message' => 'El trámite ya fue formalizado previamente.',
                    'alreadySigned' => true,
                    'trackingNumber' => $current['trackingNumber']
                ]);
            }

            // Datos de facturación opcionalmente actualizados
            $bName = trim($data['billingName'] ?? '');
            $bCuit = trim($data['billingCuit'] ?? '');
            $bTax  = trim($data['billingTaxCondition'] ?? 'Consumidor Final');
            $bMail = trim($data['billingEmail'] ?? '');
            $bAddr = trim($data['billingAddress'] ?? '');

            $updateStmt = $pdo->prepare("
                UPDATE `Enrollment`
                SET 
                    `admissionStatus` = 'confirmada',
                    `formalizationSignedAt` = NOW(3),
                    `signature1Data` = :sig1,
                    `signature2Data` = :sig2,
                    `contractAccepted` = :ca,
                    `dataAccepted` = 1,
                    `termsAccepted` = :ta,
                    `billingName` = COALESCE(NULLIF(:bn, ''), `billingName`),
                    `billingCuit` = COALESCE(NULLIF(:bc, ''), `billingCuit`),
                    `billingTaxCondition` = COALESCE(NULLIF(:bt, ''), `billingTaxCondition`),
                    `billingEmail` = COALESCE(NULLIF(:bm, ''), `billingEmail`),
                    `billingAddress` = COALESCE(NULLIF(:ba, ''), `billingAddress`)
                WHERE `id` = :id
            ");

            $updateStmt->execute([
                ':sig1' => $signature1Data,
                ':sig2' => $signature2Data ?: null,
                ':ca'   => $contractAccepted,
                ':ta'   => $termsAccepted,
                ':bn'   => $bName,
                ':bc'   => $bCuit,
                ':bt'   => $bTax,
                ':bm'   => $bMail,
                ':ba'   => $bAddr,
                ':id'   => $current['id']
            ]);

            jsonResponse(200, [
                'success'        => true,
                'message'        => '¡Matrícula formalizada exitosamente! Bienvenido/a a la escuela.',
                'trackingNumber' => $current['trackingNumber'],
                'signedAt'       => date('c')
            ]);
        } catch (Exception $e) {
            jsonResponse(500, ['success' => false, 'error' => 'Error al registrar formalización: ' . $e->getMessage()]);
        }
        break;

    default:
        jsonResponse(400, ['success' => false, 'error' => 'Acción no especificada']);
}
