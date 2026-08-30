<?php
// ==============================================================================
// MIGRACIÓN DDL TRANSACCIONAL & SEGURA - FUNDACIÓN EDUCATIVA ESQUEL
// ==============================================================================
// Solo ejecutable vía CLI o por usuario autenticado con rol SUPER_ADMIN
// ==============================================================================
require_once __DIR__ . '/config.php';

$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    $token = $_COOKIE['fee_token'] ?? '';
    $user = verifyJwtToken($token);
    if (!$user || ($user['role'] ?? '') !== 'SUPER_ADMIN') {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Acceso restringido a SUPER_ADMIN"]);
        exit;
    }
}

header('Content-Type: application/json; charset=UTF-8');

try {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        throw new Exception("No se pudo conectar a la base de datos MySQL.");
    }

    // Lock a nivel DB para evitar ejecuciones concurrentes
    $lockStmt = $pdo->query("SELECT GET_LOCK('fee_migrate', 10)");
    if (!$lockStmt || $lockStmt->fetchColumn() != 1) {
        throw new Exception("Otro proceso de migración está en ejecución.");
    }

    $log = [];

    // Helper idempotente agnóstico MySQL / MariaDB
    function columnExists(PDO $db, string $table, string $col): bool {
        $st = $db->prepare("
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        ");
        $st->execute([$table, $col]);
        return (bool) $st->fetchColumn();
    }

    function indexExists(PDO $db, string $table, string $idx): bool {
        $st = $db->prepare("
            SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
        ");
        $st->execute([$table, $idx]);
        return (bool) $st->fetchColumn();
    }

    // 1. Tabla SchemaMigrations
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `SchemaMigrations` (
            `version` VARCHAR(50) PRIMARY KEY,
            `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            `appliedBy` VARCHAR(100) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    $log[] = "Tabla SchemaMigrations verificada.";

    // 2. Tabla Cohort
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `Cohort` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `year` INT NOT NULL,
            `type` ENUM('reinscripcion', 'preinscripcion') NOT NULL,
            `status` ENUM('borrador', 'abierta', 'cerrada', 'archivada') NOT NULL DEFAULT 'borrador',
            `opensAt` DATETIME NULL,
            `closesAt` DATETIME NULL,
            `closedAt` DATETIME(3) NULL,
            `closedBy` VARCHAR(100) NULL,
            `reopenedAt` DATETIME(3) NULL,
            `reopenedBy` VARCHAR(100) NULL,
            `notes` TEXT NULL,
            UNIQUE KEY `uq_year_type` (`year`, `type`),
            INDEX `idx_cohort_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    $log[] = "Tabla Cohort verificada.";

    // Sembrar cohortes por defecto si no existen
    $pdo->exec("
        INSERT IGNORE INTO `Cohort` (`year`, `type`, `status`, `notes`) VALUES
        (2027, 'reinscripcion', 'abierta', 'Reinscripción Ciclo Lectivo 2027'),
        (2027, 'preinscripcion', 'cerrada', 'Preinscripción Ingresantes 2027')
    ");

    // 3. Tabla InterviewSlot (Agenda de turnos del 7 y 8 de septiembre)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `InterviewSlot` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `cohortYear` INT NOT NULL DEFAULT 2027,
            `schoolId` VARCHAR(10) NOT NULL DEFAULT '1030',
            `slotDate` DATE NOT NULL,
            `startTime` TIME NOT NULL,
            `endTime` TIME NOT NULL,
            `capacity` SMALLINT NOT NULL DEFAULT 8,
            `booked` SMALLINT NOT NULL DEFAULT 0,
            `isActive` TINYINT(1) NOT NULL DEFAULT 1,
            UNIQUE KEY `uq_slot` (`cohortYear`, `schoolId`, `slotDate`, `startTime`),
            INDEX `idx_slot_lookup` (`cohortYear`, `slotDate`, `isActive`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    $log[] = "Tabla InterviewSlot verificada.";

    // Sembrar slots por defecto para 7 y 8 de Septiembre 2026 en Escuela 1030
    $dates = ['2026-09-07', '2026-09-08'];
    $times = [
        ['09:00:00', '10:00:00'],
        ['10:00:00', '11:00:00'],
        ['11:00:00', '12:00:00'],
        ['14:30:00', '15:15:00'],
        ['15:15:00', '16:00:00']
    ];

    foreach ($dates as $d) {
        foreach ($times as $t) {
            $stmtSlot = $pdo->prepare("
                INSERT IGNORE INTO `InterviewSlot` (`cohortYear`, `schoolId`, `slotDate`, `startTime`, `endTime`, `capacity`, `booked`, `isActive`)
                VALUES (2027, '1030', :slotDate, :startTime, :endTime, 8, 0, 1)
            ");
            $stmtSlot->execute([':slotDate' => $d, ':startTime' => $t[0], ':endTime' => $t[1]]);
        }
    }
    $log[] = "Slots de entrevistas sembrados para 7 y 8 de Septiembre.";

    // 4. Tabla SystemSettings y SystemSettingsAudit
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `SystemSettings` (
            `settingKey` VARCHAR(100) PRIMARY KEY,
            `value` LONGTEXT NOT NULL,
            `type` ENUM('string', 'boolean', 'json', 'number') DEFAULT 'string',
            `description` VARCHAR(255) NULL,
            `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
            `updatedBy` VARCHAR(100) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `SystemSettingsAudit` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `settingKey` VARCHAR(100) NOT NULL,
            `oldValue` LONGTEXT NULL,
            `newValue` LONGTEXT NOT NULL,
            `changedBy` VARCHAR(100) NULL,
            `changedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            INDEX `idx_setting_audit` (`settingKey`, `changedAt`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    $log[] = "Tablas SystemSettings y SystemSettingsAudit verificadas.";

    // Sembrar settings por defecto
    $defaultSettings = [
        ['reinscripciones_active_cohort', '2027', 'number', 'Ciclo lectivo activo para reinscripciones'],
        ['preinscripciones_active_cohort', '2027', 'number', 'Ciclo lectivo activo para preinscripciones'],
        ['preinscripciones_interview_notice', 'Se solicita que quienes hayan realizado la preinscripción concurran a la Escuela N.º 1030 los días 7 y 8 de septiembre de 9:00 a 12:00 hs y de 14:30 a 16:00 hs para acordar los días y horarios de entrevista en el Nivel Inicial, la ponderación de inglés de 3° a 6° grado y la charla informativa de 1° y 2° grado.', 'string', 'Texto de citación presencial obligatoria'],
        ['reinscripciones_closed_message', 'El período oficial de Reinscripción para el Ciclo Lectivo 2027 ha concluido. Por consultas administrativas o casos pendientes, comuníquese con la administración escolar.', 'string', 'Mensaje de reinscripción cerrada'],
        ['preinscripciones_closed_message', 'El período de Preinscripción para Ingresantes 2027 no se encuentra activo actualmente. Próximamente se informarán nuevas fechas de apertura.', 'string', 'Mensaje de preinscripción cerrada'],
        ['age_cutoff_date', '06-30', 'string', 'Fecha de corte para cálculo de edad escolar (MM-DD)']
    ];

    foreach ($defaultSettings as $s) {
        $stmtSet = $pdo->prepare("
            INSERT INTO `SystemSettings` (`settingKey`, `value`, `type`, `description`, `updatedBy`)
            VALUES (:key, :val, :type, :desc, 'system')
            ON DUPLICATE KEY UPDATE `description` = VALUES(`description`)
        ");
        $stmtSet->execute([':key' => $s[0], ':val' => $s[1], ':type' => $s[2], ':desc' => $s[3]]);
    }

    // 5. Tabla CohortSnapshot & CohortCloseLog
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `CohortSnapshot` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `cohortYear` INT NOT NULL,
            `type` ENUM('reinscripcion', 'preinscripcion') NOT NULL,
            `payload` LONGTEXT NOT NULL,
            `checksum` CHAR(64) NOT NULL,
            `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            `createdBy` VARCHAR(100) NULL,
            INDEX `idx_snapshot_cohort` (`cohortYear`, `type`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `CohortCloseLog` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `cohortYear` INT NOT NULL,
            `type` ENUM('reinscripcion', 'preinscripcion') NOT NULL,
            `affectedCount` INT NOT NULL DEFAULT 0,
            `affectedIds` LONGTEXT NULL,
            `closedBy` VARCHAR(100) NOT NULL,
            `closedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
            `reopenedAt` DATETIME(3) NULL,
            `reopenedBy` VARCHAR(100) NULL,
            INDEX `idx_closelog_cohort` (`cohortYear`, `type`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6. Migraciones sobre la tabla Enrollment (Agrupadas en un único ALTER)
    $table = 'Enrollment';
    $alterClauses = [];

    // Validar columnas faltantes
    if (!columnExists($pdo, $table, 'cohortYear')) {
        $alterClauses[] = "ADD COLUMN `cohortYear` INT NOT NULL DEFAULT 2027 AFTER `type`";
    }
    if (!columnExists($pdo, $table, 'status')) {
        $alterClauses[] = "ADD COLUMN `status` ENUM('vigente', 'reemplazado', 'anulado') NOT NULL DEFAULT 'vigente' AFTER `cohortYear`";
    }
    if (!columnExists($pdo, $table, 'submissionUuid')) {
        $alterClauses[] = "ADD COLUMN `submissionUuid` CHAR(36) NULL AFTER `status`";
    }
    if (!columnExists($pdo, $table, 'isArchived')) {
        $alterClauses[] = "ADD COLUMN `isArchived` TINYINT(1) DEFAULT 0 AFTER `submissionUuid`";
    }
    if (!columnExists($pdo, $table, 'studentGender')) {
        $alterClauses[] = "ADD COLUMN `studentGender` VARCHAR(20) NULL AFTER `studentDni`";
    }
    if (!columnExists($pdo, $table, 'studentBirthDate')) {
        $alterClauses[] = "ADD COLUMN `studentBirthDate` DATE NULL AFTER `studentGender`";
    }
    if (!columnExists($pdo, $table, 'studentNationality')) {
        $alterClauses[] = "ADD COLUMN `studentNationality` VARCHAR(60) NULL AFTER `studentBirthDate`";
    }
    if (!columnExists($pdo, $table, 'studentBirthPlace')) {
        $alterClauses[] = "ADD COLUMN `studentBirthPlace` VARCHAR(100) NULL AFTER `studentNationality`";
    }
    if (!columnExists($pdo, $table, 'currentSchool')) {
        $alterClauses[] = "ADD COLUMN `currentSchool` VARCHAR(191) NULL AFTER `studentGrade`";
    }
    if (!columnExists($pdo, $table, 'currentSchoolType')) {
        $alterClauses[] = "ADD COLUMN `currentSchoolType` ENUM('publica', 'privada', 'otra') DEFAULT 'publica' AFTER `currentSchool`";
    }
    if (!columnExists($pdo, $table, 'hasDebtClearance')) {
        $alterClauses[] = "ADD COLUMN `hasDebtClearance` TINYINT(1) DEFAULT 0 AFTER `currentSchoolType`";
    }
    if (!columnExists($pdo, $table, 'hasRepeated')) {
        $alterClauses[] = "ADD COLUMN `hasRepeated` TINYINT(1) DEFAULT 0 AFTER `hasDebtClearance`";
    }
    if (!columnExists($pdo, $table, 'repeatedGrade')) {
        $alterClauses[] = "ADD COLUMN `repeatedGrade` VARCHAR(60) NULL AFTER `hasRepeated`";
    }
    if (!columnExists($pdo, $table, 'pendingSubjects')) {
        $alterClauses[] = "ADD COLUMN `pendingSubjects` TEXT NULL AFTER `repeatedGrade`";
    }
    if (!columnExists($pdo, $table, 'isStaffChild')) {
        $alterClauses[] = "ADD COLUMN `isStaffChild` TINYINT(1) DEFAULT 0 AFTER `hasSiblings`";
    }
    if (!columnExists($pdo, $table, 'staffMemberName')) {
        $alterClauses[] = "ADD COLUMN `staffMemberName` VARCHAR(191) NULL AFTER `isStaffChild`";
    }
    if (!columnExists($pdo, $table, 'staffMemberDni')) {
        $alterClauses[] = "ADD COLUMN `staffMemberDni` VARCHAR(20) NULL AFTER `staffMemberName`";
    }
    if (!columnExists($pdo, $table, 'hasSiblingInSchool')) {
        $alterClauses[] = "ADD COLUMN `hasSiblingInSchool` TINYINT(1) DEFAULT 0 AFTER `staffMemberDni`";
    }
    if (!columnExists($pdo, $table, 'siblingDni')) {
        $alterClauses[] = "ADD COLUMN `siblingDni` VARCHAR(20) NULL AFTER `hasSiblingInSchool`";
    }
    if (!columnExists($pdo, $table, 'siblingCurrentGrade')) {
        $alterClauses[] = "ADD COLUMN `siblingCurrentGrade` VARCHAR(191) NULL AFTER `siblingDni`";
    }
    if (!columnExists($pdo, $table, 'englishAccreditationType')) {
        $alterClauses[] = "ADD COLUMN `englishAccreditationType` ENUM('ninguno', 'instituto', 'escuela_bilingue', 'particular', 'otro') DEFAULT 'ninguno'";
    }
    if (!columnExists($pdo, $table, 'englishInstituteName')) {
        $alterClauses[] = "ADD COLUMN `englishInstituteName` VARCHAR(191) NULL";
    }
    if (!columnExists($pdo, $table, 'englishLevelAchieved')) {
        $alterClauses[] = "ADD COLUMN `englishLevelAchieved` VARCHAR(100) NULL";
    }
    if (!columnExists($pdo, $table, 'parent1Occupation')) {
        $alterClauses[] = "ADD COLUMN `parent1Occupation` VARCHAR(191) NULL AFTER `parent1Relationship`";
    }
    if (!columnExists($pdo, $table, 'parent2Occupation')) {
        $alterClauses[] = "ADD COLUMN `parent2Occupation` VARCHAR(191) NULL AFTER `parent2Relationship`";
    }
    if (!columnExists($pdo, $table, 'emergencyContactName')) {
        $alterClauses[] = "ADD COLUMN `emergencyContactName` VARCHAR(191) NULL";
    }
    if (!columnExists($pdo, $table, 'emergencyContactPhone')) {
        $alterClauses[] = "ADD COLUMN `emergencyContactPhone` VARCHAR(50) NULL";
    }
    if (!columnExists($pdo, $table, 'legalCustodyInfo')) {
        $alterClauses[] = "ADD COLUMN `legalCustodyInfo` TEXT NULL";
    }
    if (!columnExists($pdo, $table, 'authorizedPickups')) {
        $alterClauses[] = "ADD COLUMN `authorizedPickups` TEXT NULL";
    }
    if (!columnExists($pdo, $table, 'healthDisabilities')) {
        $alterClauses[] = "ADD COLUMN `healthDisabilities` TEXT NULL";
    }
    if (!columnExists($pdo, $table, 'healthAllergiesMedication')) {
        $alterClauses[] = "ADD COLUMN `healthAllergiesMedication` TEXT NULL";
    }
    if (!columnExists($pdo, $table, 'interviewSlotId')) {
        $alterClauses[] = "ADD COLUMN `interviewSlotId` INT NULL";
    }
    if (!columnExists($pdo, $table, 'termsVersion')) {
        $alterClauses[] = "ADD COLUMN `termsVersion` VARCHAR(20) DEFAULT '2027.1'";
    }
    if (!columnExists($pdo, $table, 'admissionStatus')) {
        $alterClauses[] = "ADD COLUMN `admissionStatus` ENUM('recibida', 'entrevista_agendada', 'entrevista_realizada', 'admitida', 'lista_espera', 'no_admitida', 'desistida') NOT NULL DEFAULT 'recibida'";
    }
    if (!columnExists($pdo, $table, 'priorityVerified')) {
        $alterClauses[] = "ADD COLUMN `priorityVerified` TINYINT(1) NOT NULL DEFAULT 0";
    }
    if (!columnExists($pdo, $table, 'admissionNotes')) {
        $alterClauses[] = "ADD COLUMN `admissionNotes` TEXT NULL";
    }
    if (!columnExists($pdo, $table, 'decidedBy')) {
        $alterClauses[] = "ADD COLUMN `decidedBy` VARCHAR(100) NULL";
    }
    if (!columnExists($pdo, $table, 'decidedAt')) {
        $alterClauses[] = "ADD COLUMN `decidedAt` DATETIME(3) NULL";
    }

    // Columna generada activeKey
    if (!columnExists($pdo, $table, 'activeKey')) {
        $alterClauses[] = "ADD COLUMN `activeKey` VARCHAR(120) GENERATED ALWAYS AS (IF(`status` = 'vigente', CONCAT(`studentDni`, '|', `cohortYear`, '|', `type`), NULL)) STORED";
    }

    if (!empty($alterClauses)) {
        $alterSql = "ALTER TABLE `{$table}` " . implode(", ", $alterClauses);
        $pdo->exec($alterSql);
        $log[] = "ALTER TABLE Enrollment ejecutado con éxito (" . count($alterClauses) . " columnas agregadas).";
    } else {
        $log[] = "Todas las columnas de Enrollment ya se encontraban al día.";
    }

    // Índices sobre Enrollment
    $indexClauses = [];
    if (!indexExists($pdo, $table, 'idx_cohort_type_created')) {
        $indexClauses[] = "ADD INDEX `idx_cohort_type_created` (`cohortYear`, `type`, `createdAt` DESC)";
    }
    if (!indexExists($pdo, $table, 'idx_admission_status')) {
        $indexClauses[] = "ADD INDEX `idx_admission_status` (`cohortYear`, `admissionStatus`)";
    }
    if (!indexExists($pdo, $table, 'idx_interview_slot')) {
        $indexClauses[] = "ADD INDEX `idx_interview_slot` (`interviewSlotId`)";
    }
    if (!indexExists($pdo, $table, 'idx_parent1_dni')) {
        $indexClauses[] = "ADD INDEX `idx_parent1_dni` (`parent1Dni`)";
    }
    if (!indexExists($pdo, $table, 'uq_active_enrollment') && columnExists($pdo, $table, 'activeKey')) {
        $indexClauses[] = "ADD UNIQUE KEY `uq_active_enrollment` (`activeKey`)";
    }
    if (!indexExists($pdo, $table, 'uq_submission_uuid') && columnExists($pdo, $table, 'submissionUuid')) {
        $indexClauses[] = "ADD UNIQUE KEY `uq_submission_uuid` (`submissionUuid`)";
    }

    if (!empty($indexClauses)) {
        $indexSql = "ALTER TABLE `{$table}` " . implode(", ", $indexClauses);
        @$pdo->exec($indexSql);
        $log[] = "Índices optimizados aplicados sobre Enrollment.";
    }

    // 7. Liberar el lock DB
    $pdo->query("SELECT RELEASE_LOCK('fee_migrate')");

    // 8. Registrar migración aplicada
    $pdo->exec("INSERT IGNORE INTO `SchemaMigrations` (`version`, `appliedBy`) VALUES ('v2.0.0_admissions_engine', 'system')");

    echo json_encode([
        "success" => true,
        "version" => "v2.0.0_admissions_engine",
        "log" => $log
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($pdo)) {
        @$pdo->query("SELECT RELEASE_LOCK('fee_migrate')");
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
