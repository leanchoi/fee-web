<?php
// ==============================================================================
// GESTIÓN DE CONFIGURACIONES Y ESTADOS DE CONVOCATORIA - FEE
// ==============================================================================
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getPDO();
$settingsFile = __DIR__ . '/data/settings.json';

// Helper: Cargar configuración desde archivo JSON de respaldo
function getJsonSettings(): array {
    global $settingsFile;
    if (file_exists($settingsFile)) {
        $raw = file_get_contents($settingsFile);
        $data = json_decode($raw, true);
        if (is_array($data)) return $data;
    }
    return [
        "mode" => "reinscripciones",
        "reinscripciones" => [
            "cohort" => 2027,
            "status" => "abierta",
            "isOpen" => true,
            "closedMessage" => "El período de reinscripción para el Ciclo Lectivo 2027 ha finalizado."
        ],
        "preinscripciones" => [
            "cohort" => 2027,
            "status" => "cerrada",
            "isOpen" => false,
            "interviewNotice" => "Las entrevistas presenciales se desarrollarán los días 7 y 8 de septiembre en las instalaciones de la Escuela N.º 1030.",
            "closedMessage" => "El período de preinscripción para nuevos ingresantes se encuentra actualmente cerrado.",
            "availableSlots" => []
        ]
    ];
}

// Helper: Guardar configuración en archivo JSON de respaldo
function saveJsonSettings(array $data): bool {
    global $settingsFile;
    $dir = dirname($settingsFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return @file_put_contents($settingsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

// Helper: Auto-creación de tablas si no existen
function ensureSettingsSchema(?PDO $pdo): void {
    if (!$pdo) return;
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `Cohort` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `year` INT NOT NULL,
                `type` VARCHAR(50) NOT NULL,
                `status` VARCHAR(50) NOT NULL DEFAULT 'cerrada',
                `opensAt` DATETIME NULL,
                `closesAt` DATETIME NULL,
                `closedAt` DATETIME NULL,
                `closedBy` VARCHAR(100) NULL,
                `reopenedAt` DATETIME NULL,
                `reopenedBy` VARCHAR(100) NULL,
                `notes` TEXT NULL,
                `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY `uk_year_type` (`year`, `type`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `SystemSettings` (
                `settingKey` VARCHAR(100) PRIMARY KEY,
                `value` LONGTEXT NULL,
                `updatedBy` VARCHAR(100) NULL,
                `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `SystemSettingsAudit` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `settingKey` VARCHAR(100) NOT NULL,
                `oldValue` LONGTEXT NULL,
                `newValue` LONGTEXT NULL,
                `changedBy` VARCHAR(100) NOT NULL,
                `changedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `InterviewSlot` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `cohortYear` INT NOT NULL DEFAULT 2027,
                `slotDate` DATE NOT NULL,
                `startTime` TIME NOT NULL,
                `endTime` TIME NOT NULL,
                `capacity` INT NOT NULL DEFAULT 15,
                `booked` INT NOT NULL DEFAULT 0,
                `isActive` TINYINT(1) NOT NULL DEFAULT 1,
                INDEX `idx_cohort_date` (`cohortYear`, `slotDate`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Insertar cohortes por defecto si no existen
        $pdo->exec("
            INSERT IGNORE INTO `Cohort` (`year`, `type`, `status`) 
            VALUES (2027, 'reinscripcion', 'abierta'), (2027, 'preinscripcion', 'cerrada');
        ");

        // Insertar slots iniciales de entrevista para 7 y 8 de septiembre si la tabla está vacía
        $countSlots = $pdo->query("SELECT COUNT(*) FROM `InterviewSlot`")->fetchColumn();
        if ($countSlots == 0) {
            $slotsSql = "
                INSERT INTO `InterviewSlot` (`cohortYear`, `slotDate`, `startTime`, `endTime`, `capacity`, `booked`, `isActive`) VALUES
                (2027, '2026-09-07', '08:30:00', '10:00:00', 15, 0, 1),
                (2027, '2026-09-07', '10:30:00', '12:00:00', 15, 0, 1),
                (2027, '2026-09-07', '14:00:00', '15:30:00', 15, 0, 1),
                (2027, '2026-09-07', '16:00:00', '17:30:00', 15, 0, 1),
                (2027, '2026-09-08', '08:30:00', '10:00:00', 15, 0, 1),
                (2027, '2026-09-08', '10:30:00', '12:00:00', 15, 0, 1),
                (2027, '2026-09-08', '14:00:00', '15:30:00', 15, 0, 1),
                (2027, '2026-09-08', '16:00:00', '17:30:00', 15, 0, 1);
            ";
            $pdo->exec($slotsSql);
        }

    } catch (Exception $e) {
        error_log("[SETTINGS_SCHEMA_ERROR] " . $e->getMessage());
    }
}

// Ejecutar verificación de esquema si PDO está disponible
ensureSettingsSchema($pdo);

if ($method === 'GET') {
    try {
        // Asegurar cookie CSRF
        if (empty($_COOKIE['fee_csrf'])) {
            generateCsrfToken();
        }

        $jsonFallback = getJsonSettings();

        $reinscripcionesCohort = 2027;
        $preinscripcionesCohort = 2027;
        $reinscripcionesStatus = 'abierta';
        $preinscripcionesStatus = 'cerrada';
        $rawSettings = [];
        $availableSlots = [];

        if ($pdo) {
            try {
                // Consultar Cohortes activas
                $stmtCohorts = $pdo->query("SELECT `year`, `type`, `status` FROM `Cohort`");
                $cohorts = $stmtCohorts ? $stmtCohorts->fetchAll() : [];

                foreach ($cohorts as $c) {
                    if ($c['type'] === 'reinscripcion' && (int)$c['year'] === 2027) {
                        $reinscripcionesCohort = (int)$c['year'];
                        $reinscripcionesStatus = $c['status'];
                    } elseif ($c['type'] === 'preinscripcion' && (int)$c['year'] === 2027) {
                        $preinscripcionesCohort = (int)$c['year'];
                        $preinscripcionesStatus = $c['status'];
                    }
                }

                // Consultar configuraciones de texto
                $stmtSettings = $pdo->query("SELECT `settingKey`, `value` FROM `SystemSettings`");
                $rawSettings = $stmtSettings ? $stmtSettings->fetchAll(PDO::FETCH_KEY_PAIR) : [];

                // Consultar slots de entrevistas disponibles
                $stmtSlots = $pdo->prepare("
                    SELECT `id`, `slotDate`, `startTime`, `endTime`, `capacity`, `booked`, (`capacity` - `booked`) AS `available`
                    FROM `InterviewSlot`
                    WHERE `cohortYear` = :cohort AND `isActive` = 1 AND (`capacity` - `booked`) > 0
                    ORDER BY `slotDate` ASC, `startTime` ASC
                ");
                $stmtSlots->execute([':cohort' => $preinscripcionesCohort]);
                $availableSlots = $stmtSlots->fetchAll() ?: [];

            } catch (Exception $e) {
                error_log("[SETTINGS_GET_FALLBACK] " . $e->getMessage());
                // Usar valores del archivo JSON
                $reinscripcionesStatus = $jsonFallback['reinscripciones']['status'] ?? 'abierta';
                $preinscripcionesStatus = $jsonFallback['preinscripciones']['status'] ?? 'cerrada';
            }
        } else {
            $reinscripcionesStatus = $jsonFallback['reinscripciones']['status'] ?? 'abierta';
            $preinscripcionesStatus = $jsonFallback['preinscripciones']['status'] ?? 'cerrada';
        }

        // Determinar modo activo general
        $mode = 'cerrado';
        if ($reinscripcionesStatus === 'abierta') {
            $mode = 'reinscripciones';
        } elseif ($preinscripcionesStatus === 'abierta') {
            $mode = 'preinscripciones';
        }

        $response = [
            "success" => true,
            "mode" => $mode,
            "reinscripciones" => [
                "cohort" => $reinscripcionesCohort,
                "status" => $reinscripcionesStatus,
                "isOpen" => ($reinscripcionesStatus === 'abierta'),
                "closedMessage" => $rawSettings['reinscripciones_closed_message'] ?? ($jsonFallback['reinscripciones']['closedMessage'] ?? 'El período de reinscripción está cerrado.')
            ],
            "preinscripciones" => [
                "cohort" => $preinscripcionesCohort,
                "status" => $preinscripcionesStatus,
                "isOpen" => ($preinscripcionesStatus === 'abierta'),
                "interviewNotice" => $rawSettings['preinscripciones_interview_notice'] ?? ($jsonFallback['preinscripciones']['interviewNotice'] ?? 'Las entrevistas presenciales se desarrollarán los días 7 y 8 de septiembre.'),
                "closedMessage" => $rawSettings['preinscripciones_closed_message'] ?? ($jsonFallback['preinscripciones']['closedMessage'] ?? 'El período de preinscripción está cerrado.'),
                "availableSlots" => $availableSlots
            ],
            "timestamp" => time()
        ];

        // Guardar snapshot actualizado en JSON
        saveJsonSettings($response);

        jsonResponse(200, $response);

    } catch (Exception $e) {
        jsonResponse(200, getJsonSettings());
    }
}

if ($method === 'POST') {
    // Autenticación por Bearer Token o Cookie
    $token = getBearerToken();
    $user = verifyToken($token);

    if (!$user && !empty($_COOKIE['admin_session'])) {
        $user = verifyToken($_COOKIE['admin_session']);
    }

    if (!$user) {
        jsonResponse(401, ["success" => false, "error" => "Sesión inválida o expirada"]);
    }

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data) {
        jsonResponse(400, ["success" => false, "error" => "Datos inválidos"]);
    }

    try {
        $userRole = $user['role'] ?? 'EDITOR';
        $username = $user['name'] ?? ($user['username'] ?? 'admin');
        $jsonSettings = getJsonSettings();

        // 1. Toggles de Apertura/Cierre de Convocatorias
        if (isset($data['reinscripciones_status']) || isset($data['preinscripciones_status'])) {
            if ($userRole !== 'SUPER_ADMIN') {
                jsonResponse(403, ["success" => false, "error" => "Solo un SUPER_ADMIN puede modificar el estado de apertura de las convocatorias."]);
            }

            if (isset($data['reinscripciones_status'])) {
                $statusRe = in_array($data['reinscripciones_status'], ['abierta', 'cerrada', 'borrador', 'archivada']) ? $data['reinscripciones_status'] : 'cerrada';
                $cohortRe = (int)($data['reinscripciones_cohort'] ?? 2027);

                if ($pdo) {
                    $stmt = $pdo->prepare("
                        INSERT INTO `Cohort` (`year`, `type`, `status`)
                        VALUES (:year, 'reinscripcion', :status)
                        ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `updatedAt` = CURRENT_TIMESTAMP
                    ");
                    $stmt->execute([':status' => $statusRe, ':year' => $cohortRe]);
                }

                $jsonSettings['reinscripciones']['status'] = $statusRe;
                $jsonSettings['reinscripciones']['isOpen'] = ($statusRe === 'abierta');
            }

            if (isset($data['preinscripciones_status'])) {
                $statusPre = in_array($data['preinscripciones_status'], ['abierta', 'cerrada', 'borrador', 'archivada']) ? $data['preinscripciones_status'] : 'cerrada';
                $cohortPre = (int)($data['preinscripciones_cohort'] ?? 2027);

                if ($pdo) {
                    $stmt = $pdo->prepare("
                        INSERT INTO `Cohort` (`year`, `type`, `status`)
                        VALUES (:year, 'preinscripcion', :status)
                        ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `updatedAt` = CURRENT_TIMESTAMP
                    ");
                    $stmt->execute([':status' => $statusPre, ':year' => $cohortPre]);
                }

                $jsonSettings['preinscripciones']['status'] = $statusPre;
                $jsonSettings['preinscripciones']['isOpen'] = ($statusPre === 'abierta');
            }
        }

        // 2. Textos Institucionales y Avisos
        $textKeys = [
            'preinscripciones_interview_notice',
            'reinscripciones_closed_message',
            'preinscripciones_closed_message',
            'age_cutoff_date'
        ];

        foreach ($textKeys as $key) {
            if (isset($data[$key])) {
                $val = trim($data[$key]);

                if ($pdo) {
                    $stmt = $pdo->prepare("
                        INSERT INTO `SystemSettings` (`settingKey`, `value`, `updatedBy`)
                        VALUES (:key, :val, :user)
                        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updatedBy` = VALUES(`updatedBy`)
                    ");
                    $stmt->execute([':key' => $key, ':val' => $val, ':user' => $username]);
                }

                if ($key === 'preinscripciones_interview_notice') {
                    $jsonSettings['preinscripciones']['interviewNotice'] = $val;
                } elseif ($key === 'reinscripciones_closed_message') {
                    $jsonSettings['reinscripciones']['closedMessage'] = $val;
                } elseif ($key === 'preinscripciones_closed_message') {
                    $jsonSettings['preinscripciones']['closedMessage'] = $val;
                }
            }
        }

        // Recalcular modo activo
        $jsonSettings['mode'] = 'cerrado';
        if (($jsonSettings['reinscripciones']['status'] ?? '') === 'abierta') {
            $jsonSettings['mode'] = 'reinscripciones';
        } elseif (($jsonSettings['preinscripciones']['status'] ?? '') === 'abierta') {
            $jsonSettings['mode'] = 'preinscripciones';
        }

        saveJsonSettings($jsonSettings);

        jsonResponse(200, [
            "success" => true,
            "message" => "Configuraciones actualizadas exitosamente.",
            "settings" => $jsonSettings
        ]);

    } catch (Exception $e) {
        jsonResponse(500, ["success" => false, "error" => $e->getMessage()]);
    }
}

