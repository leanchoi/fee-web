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

// Helpers locales para persistencia en JSON
function readLocalJson(string $path): array {
    if (!file_exists($path)) return [];
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function writeLocalJson(string $path, array $data): bool {
    $dir = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return @file_put_contents($path, $json, LOCK_EX) !== false;
}

$pdo = getPDO();
if ($pdo) {
    ensureEnrollmentTableSchema($pdo);
}

$dataDir = __DIR__ . '/data';

switch ($action) {
    // 1. Verificar token y devolver datos sanitizados del aspirante para el contrato
    case 'verify':
        $token = trim($_GET['token'] ?? '');
        if (empty($token) || strlen($token) < 16) {
            jsonResponse(400, ['success' => false, 'error' => 'Token de formalización inválido o no provisto.']);
        }

        $row = null;

        // A. Intentar por MySQL
        if ($pdo) {
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
            } catch (Exception $e) {
                error_log('[FORMALIZACION] Error consulta MySQL: ' . $e->getMessage());
            }
        }

        // B. Fallback / Complemento con JSON local
        if (!$row) {
            foreach ([$dataDir . '/preinscripciones.json', $dataDir . '/enrollments.json'] as $jsonPath) {
                if (file_exists($jsonPath)) {
                    $items = readLocalJson($jsonPath);
                    foreach ($items as $item) {
                        if (!empty($item['formalizationToken']) && hash_equals($item['formalizationToken'], $token)) {
                            $row = $item;
                            break 2;
                        }
                    }
                }
            }
        }

        if (!$row) {
            jsonResponse(404, [
                'success' => false, 
                'error'   => 'El enlace de formalización no es válido o ha caducado. Por favor comunicate con la administración.'
            ]);
        }

        $alreadySigned = !empty($row['formalizationSignedAt']) || (($row['admissionStatus'] ?? '') === 'confirmada');
        $isExpired = false;

        if (!empty($row['formalizationExpiresAt']) && strtotime($row['formalizationExpiresAt']) < time()) {
            $isExpired = true;
        }

        jsonResponse(200, [
            'success'       => true,
            'alreadySigned' => $alreadySigned,
            'isExpired'     => $isExpired,
            'enrollment'    => [
                'id'                     => $row['id'] ?? '',
                'trackingNumber'         => $row['trackingNumber'] ?? '',
                'studentName'            => $row['studentName'] ?? '',
                'studentDni'             => $row['studentDni'] ?? '',
                'studentLevel'           => $row['studentLevel'] ?? '',
                'studentGrade'           => $row['studentGrade'] ?? '',
                'school'                 => $row['school'] ?? 'Escuela N.º 1030',
                'parent1Name'            => $row['parent1Name'] ?? ($row['tutorName'] ?? 'Madre/Padre'),
                'parent1Dni'             => $row['parent1Dni'] ?? '',
                'parent1Relationship'    => $row['parent1Relationship'] ?? 'Madre/Padre',
                'parent1Phone'           => $row['parent1Phone'] ?? ($row['tutorPhone'] ?? ''),
                'parent1Email'           => $row['parent1Email'] ?? ($row['tutorEmail'] ?? ''),
                'parent1Address'         => $row['parent1Address'] ?? '',
                'parent1City'            => $row['parent1City'] ?? 'Esquel',
                'parent1PostalCode'      => $row['parent1PostalCode'] ?? '9200',
                'isSingleParent'         => !empty($row['isSingleParent']),
                'parent2Name'            => $row['parent2Name'] ?? '',
                'parent2Dni'             => $row['parent2Dni'] ?? '',
                'parent2Relationship'    => $row['parent2Relationship'] ?? 'Padre/Madre',
                'parent2Phone'           => $row['parent2Phone'] ?? '',
                'parent2Email'           => $row['parent2Email'] ?? '',
                'billingName'            => $row['billingName'] ?? ($row['parent1Name'] ?? ''),
                'billingCuit'            => $row['billingCuit'] ?? ($row['parent1Dni'] ?? ''),
                'billingTaxCondition'    => $row['billingTaxCondition'] ?? 'Consumidor Final',
                'billingEmail'           => $row['billingEmail'] ?? ($row['parent1Email'] ?? ''),
                'billingAddress'         => $row['billingAddress'] ?? ($row['parent1Address'] ?? ''),
                'admissionStatus'        => $row['admissionStatus'] ?? 'aprobada_pendiente_firma',
                'formalizationExpiresAt' => $row['formalizationExpiresAt'] ?? null,
                'formalizationSignedAt'  => $row['formalizationSignedAt'] ?? null,
            ]
        ]);
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

        $current = null;
        $matchedFile = null;

        // A. Buscar en MySQL
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("
                    SELECT `id`, `trackingNumber`, `studentName`, `admissionStatus`, `formalizationSignedAt` 
                    FROM `Enrollment` 
                    WHERE `formalizationToken` = :token 
                    LIMIT 1
                ");
                $stmt->execute([':token' => $token]);
                $current = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (Exception $e) {}
        }

        // B. Buscar en JSON
        if (!$current) {
            foreach ([$dataDir . '/preinscripciones.json', $dataDir . '/enrollments.json'] as $jsonPath) {
                if (file_exists($jsonPath)) {
                    $items = readLocalJson($jsonPath);
                    foreach ($items as $item) {
                        if (!empty($item['formalizationToken']) && hash_equals($item['formalizationToken'], $token)) {
                            $current = $item;
                            $matchedFile = $jsonPath;
                            break 2;
                        }
                    }
                }
            }
        }

        if (!$current) {
            jsonResponse(404, ['success' => false, 'error' => 'Trámite de formalización no encontrado']);
        }

        if (!empty($current['formalizationSignedAt']) || (($current['admissionStatus'] ?? '') === 'confirmada')) {
            jsonResponse(200, [
                'success' => true, 
                'message' => 'El trámite ya fue formalizado previamente.',
                'alreadySigned' => true,
                'trackingNumber' => $current['trackingNumber'] ?? ''
            ]);
        }

        $nowIso = date('c');

        // Datos de facturación
        $bName = trim($data['billingName'] ?? '');
        $bCuit = trim($data['billingCuit'] ?? '');
        $bTax  = trim($data['billingTaxCondition'] ?? 'Consumidor Final');
        $bMail = trim($data['billingEmail'] ?? '');
        $bAddr = trim($data['billingAddress'] ?? '');

        // 1. Actualizar MySQL si existe
        if ($pdo && !empty($current['id'])) {
            try {
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
            } catch (Exception $e) {
                error_log('[FORMALIZACION] Error guardando firma en MySQL: ' . $e->getMessage());
            }
        }

        // 2. Actualizar JSON local siempre
        foreach ([$dataDir . '/preinscripciones.json', $dataDir . '/enrollments.json'] as $jsonPath) {
            if (file_exists($jsonPath)) {
                $items = readLocalJson($jsonPath);
                $changed = false;
                foreach ($items as &$item) {
                    $isMatch = (!empty($item['formalizationToken']) && hash_equals($item['formalizationToken'], $token))
                            || (!empty($current['id']) && ($item['id'] ?? '') === $current['id']);
                    if ($isMatch) {
                        $item['admissionStatus'] = 'confirmada';
                        $item['formalizationSignedAt'] = $nowIso;
                        $item['signature1Data'] = $signature1Data;
                        if ($signature2Data) $item['signature2Data'] = $signature2Data;
                        $item['contractAccepted'] = $contractAccepted;
                        $item['termsAccepted'] = $termsAccepted;
                        if ($bName) $item['billingName'] = $bName;
                        if ($bCuit) $item['billingCuit'] = $bCuit;
                        if ($bTax)  $item['billingTaxCondition'] = $bTax;
                        if ($bMail) $item['billingEmail'] = $bMail;
                        if ($bAddr) $item['billingAddress'] = $bAddr;
                        $changed = true;
                    }
                }
                unset($item);
                if ($changed) {
                    writeLocalJson($jsonPath, $items);
                }
            }
        }

        jsonResponse(200, [
            'success'        => true,
            'message'        => '¡Matrícula formalizada exitosamente! Bienvenido/a a la escuela.',
            'trackingNumber' => $current['trackingNumber'] ?? '',
            'signedAt'       => $nowIso
        ]);
        break;

    default:
        jsonResponse(400, ['success' => false, 'error' => 'Acción no especificada']);
}
