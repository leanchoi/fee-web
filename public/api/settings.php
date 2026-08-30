<?php
// ==============================================================================
// GESTIÓN DE CONFIGURACIONES Y ESTADOS DE CONVOCATORIA - FEE
// ==============================================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();

if (!$pdo) {
    // Failsafe cerrado si no hay DB
    http_response_code(200);
    echo json_encode([
        "mode" => "cerrado",
        "reinscripciones_status" => "cerrada",
        "preinscripciones_status" => "cerrada",
        "source" => "failsafe"
    ]);
    exit;
}

if ($method === 'GET') {
    try {
        // Asegurar token CSRF en cookie para formularios
        if (empty($_COOKIE['fee_csrf'])) {
            generateCsrfToken();
        }

        // Consultar Cohortes activas
        $stmtCohorts = $pdo->query("SELECT `year`, `type`, `status` FROM `Cohort` WHERE `status` IN ('abierta', 'cerrada', 'borrador')");
        $cohorts = $stmtCohorts ? $stmtCohorts->fetchAll() : [];

        $reinscripcionesCohort = 2027;
        $preinscripcionesCohort = 2027;
        $reinscripcionesStatus = 'abierta';
        $preinscripcionesStatus = 'cerrada';

        foreach ($cohorts as $c) {
            if ($c['type'] === 'reinscripcion') {
                $reinscripcionesCohort = (int)$c['year'];
                $reinscripcionesStatus = $c['status'];
            } elseif ($c['type'] === 'preinscripcion') {
                $preinscripcionesCohort = (int)$c['year'];
                $preinscripcionesStatus = $c['status'];
            }
        }

        // Determinar modo activo general
        $mode = 'cerrado';
        if ($reinscripcionesStatus === 'abierta') {
            $mode = 'reinscripciones';
        } elseif ($preinscripcionesStatus === 'abierta') {
            $mode = 'preinscripciones';
        }

        // Consultar configuraciones de texto
        $stmtSettings = $pdo->query("SELECT `settingKey`, `value` FROM `SystemSettings`");
        $rawSettings = $stmtSettings ? $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR) : [];

        // Consultar slots de entrevistas disponibles para preinscripciones 2027
        $stmtSlots = $pdo->prepare("
            SELECT `id`, `slotDate`, `startTime`, `endTime`, `capacity`, `booked`, (`capacity` - `booked`) AS `available`
            FROM `InterviewSlot`
            WHERE `cohortYear` = :cohort AND `isActive` = 1 AND (`capacity` - `booked`) > 0
            ORDER BY `slotDate` ASC, `startTime` ASC
        ");
        $stmtSlots->execute([':cohort' => $preinscripcionesCohort]);
        $availableSlots = $stmtSlots->fetchAll() ?: [];

        $response = [
            "success" => true,
            "mode" => $mode,
            "reinscripciones" => [
                "cohort" => $reinscripcionesCohort,
                "status" => $reinscripcionesStatus,
                "isOpen" => ($reinscripcionesStatus === 'abierta'),
                "closedMessage" => $rawSettings['reinscripciones_closed_message'] ?? 'El período de reinscripción está cerrado.'
            ],
            "preinscripciones" => [
                "cohort" => $preinscripcionesCohort,
                "status" => $preinscripcionesStatus,
                "isOpen" => ($preinscripcionesStatus === 'abierta'),
                "interviewNotice" => $rawSettings['preinscripciones_interview_notice'] ?? '',
                "closedMessage" => $rawSettings['preinscripciones_closed_message'] ?? 'El período de preinscripción está cerrado.',
                "availableSlots" => $availableSlots
            ],
            "timestamp" => time()
        ];

        $json = json_encode($response, JSON_UNESCAPED_UNICODE);
        $etag = '"' . md5($json) . '"';
        header('Cache-Control: public, max-age=30, stale-while-revalidate=120');
        header('ETag: ' . $etag);

        if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) {
            http_response_code(304);
            exit;
        }

        echo $json;
        exit;

    } catch (Exception $e) {
        http_response_code(200);
        echo json_encode(["mode" => "cerrado", "error" => $e->getMessage()]);
        exit;
    }
}

if ($method === 'POST') {
    // Verificación de autenticación y permisos
    $token = getBearerToken();
    $user = verifyToken($token);

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Sesión inválida o expirada"]);
        exit;
    }

    // Verificación CSRF obligatoria
    requireCsrfToken();

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Datos inválidos"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $action = $data['action'] ?? 'update_settings';
        $userRole = $user['role'] ?? 'EDITOR';
        $username = $user['name'] ?? ($user['username'] ?? 'admin');

        // 1. Toggles de Apertura/Cierre de Convocatorias (Solo SUPER_ADMIN)
        if (isset($data['reinscripciones_status']) || isset($data['preinscripciones_status'])) {
            if ($userRole !== 'SUPER_ADMIN') {
                throw new Exception("Solo un SUPER_ADMIN puede modificar el estado de apertura de las convocatorias.");
            }

            if (isset($data['reinscripciones_status'])) {
                $statusRe = in_array($data['reinscripciones_status'], ['abierta', 'cerrada', 'borrador', 'archivada']) ? $data['reinscripciones_status'] : 'cerrada';
                $stmt = $pdo->prepare("UPDATE `Cohort` SET `status` = :status WHERE `type` = 'reinscripcion' AND `year` = :year");
                $stmt->execute([':status' => $statusRe, ':year' => (int)($data['reinscripciones_cohort'] ?? 2027)]);
            }

            if (isset($data['preinscripciones_status'])) {
                $statusPre = in_array($data['preinscripciones_status'], ['abierta', 'cerrada', 'borrador', 'archivada']) ? $data['preinscripciones_status'] : 'cerrada';
                $stmt = $pdo->prepare("UPDATE `Cohort` SET `status` = :status WHERE `type` = 'preinscripcion' AND `year` = :year");
                $stmt->execute([':status' => $statusPre, ':year' => (int)($data['preinscripciones_cohort'] ?? 2027)]);
            }
        }

        // 2. Textos Institucionales y Avisos (SUPER_ADMIN o EDITOR)
        $textKeys = [
            'preinscripciones_interview_notice',
            'reinscripciones_closed_message',
            'preinscripciones_closed_message',
            'age_cutoff_date'
        ];

        foreach ($textKeys as $key) {
            if (isset($data[$key])) {
                $val = trim($data[$key]);

                // Obtener valor previo para auditoría
                $oldStmt = $pdo->prepare("SELECT `value` FROM `SystemSettings` WHERE `settingKey` = :key");
                $oldStmt->execute([':key' => $key]);
                $oldVal = $oldStmt->fetchColumn();

                $stmt = $pdo->prepare("
                    INSERT INTO `SystemSettings` (`settingKey`, `value`, `updatedBy`)
                    VALUES (:key, :val, :user)
                    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedBy` = VALUES(`updatedBy`)
                ");
                $stmt->execute([':key' => $key, ':val' => $val, ':user' => $username]);

                // Registrar auditoría
                $auditStmt = $pdo->prepare("
                    INSERT INTO `SystemSettingsAudit` (`settingKey`, `oldValue`, `newValue`, `changedBy`)
                    VALUES (:key, :oldVal, :newVal, :user)
                ");
                $auditStmt->execute([':key' => $key, ':oldVal' => $oldVal ?: '', ':newVal' => $val, ':user' => $username]);
            }
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Configuraciones actualizadas exitosamente."
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit;
}
