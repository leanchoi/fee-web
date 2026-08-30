<?php
declare(strict_types=1);

/**
 * ============================================================================
 * ESQUEMA CANÓNICO DE `Enrollment` — FEE
 * ----------------------------------------------------------------------------
 * Reemplaza el stub `function ensureEnrollmentTableSchema($pdo) { return true; }`
 * que hoy vive en config.php y que NO HACE NADA.
 *
 * Reglas inviolables de este archivo:
 *   1. Toda columna que no sea clave primaria es NULL DEFAULT NULL.
 *      Bajo STRICT_TRANS_TABLES es lo único que garantiza que un INSERT
 *      parcial (preinscripción sin campos de contrato, o al revés) no aborte.
 *   2. Nada de `ADD COLUMN IF NOT EXISTS`: es sintaxis MariaDB y revienta en
 *      MySQL 8. Se consulta information_schema y se arma un ALTER único.
 *   3. Las firmas van en LONGTEXT. En VARCHAR el INSERT falla por longitud
 *      bajo modo estricto y el error se pierde en el catch.
 * ============================================================================
 */

/**
 * Definición completa: nombre de columna => definición DDL.
 * El orden importa solo para legibilidad; las columnas se agregan al final.
 */
function enrollmentSchemaDefinition(): array
{
    return [
        // ── Identidad y clasificación ───────────────────────────────────────
        'submissionUuid'            => "VARCHAR(36) NULL DEFAULT NULL",
        'trackingNumber'            => "VARCHAR(40) NULL DEFAULT NULL",
        'type'                      => "VARCHAR(40) NULL DEFAULT NULL",
        // formKind es EL discriminador. Dos valores, sin substrings ambiguos.
        'formKind'                  => "ENUM('reinscripcion','preinscripcion') NULL DEFAULT NULL",
        'cohortYear'                => "INT NULL DEFAULT NULL",
        'status'                    => "VARCHAR(20) NULL DEFAULT 'vigente'",
        'isArchived'                => "TINYINT(1) NULL DEFAULT 0",
        'validationRulesVersion'    => "VARCHAR(30) NULL DEFAULT NULL",

        // ── Estudiante / aspirante (común) ──────────────────────────────────
        'studentName'               => "VARCHAR(191) NULL DEFAULT NULL",
        'studentDni'                => "VARCHAR(20) NULL DEFAULT NULL",
        'studentGender'             => "VARCHAR(20) NULL DEFAULT NULL",
        'studentBirthDate'          => "DATE NULL DEFAULT NULL",
        'studentNationality'        => "VARCHAR(60) NULL DEFAULT NULL",
        'studentBirthPlace'         => "VARCHAR(100) NULL DEFAULT NULL",
        'school'                    => "VARCHAR(100) NULL DEFAULT NULL",
        'studentLevel'              => "VARCHAR(50) NULL DEFAULT NULL",
        'studentGrade'              => "VARCHAR(100) NULL DEFAULT NULL",

        // ── Preinscripción: trayectoria escolar ─────────────────────────────
        'currentSchool'             => "VARCHAR(191) NULL DEFAULT NULL",
        'currentSchoolType'         => "VARCHAR(20) NULL DEFAULT NULL",
        'hasDebtClearance'          => "TINYINT(1) NULL DEFAULT NULL",
        'hasRepeated'               => "TINYINT(1) NULL DEFAULT NULL",
        'repeatedGrade'             => "VARCHAR(60) NULL DEFAULT NULL",
        'pendingSubjects'           => "TEXT NULL DEFAULT NULL",

        // ── Preinscripción: prioridades institucionales ─────────────────────
        'isStaffChild'              => "TINYINT(1) NULL DEFAULT NULL",
        'staffMemberName'           => "VARCHAR(191) NULL DEFAULT NULL",
        'staffMemberDni'            => "VARCHAR(20) NULL DEFAULT NULL",
        'hasSiblingInSchool'        => "TINYINT(1) NULL DEFAULT NULL",
        'siblingDni'                => "VARCHAR(20) NULL DEFAULT NULL",
        'siblingCurrentGrade'       => "VARCHAR(191) NULL DEFAULT NULL",
        'priorityVerified'          => "TINYINT(1) NULL DEFAULT 0",

        // ── Preinscripción: inglés ──────────────────────────────────────────
        'englishAccreditationType'  => "VARCHAR(30) NULL DEFAULT NULL",
        'englishInstituteName'      => "VARCHAR(191) NULL DEFAULT NULL",
        'englishLevelAchieved'      => "VARCHAR(100) NULL DEFAULT NULL",

        // ── Preinscripción: entrevista y admisión ───────────────────────────
        'interviewSlotId'           => "INT NULL DEFAULT NULL",
        'admissionStatus'           => "VARCHAR(30) NULL DEFAULT NULL",
        'admissionNotes'            => "TEXT NULL DEFAULT NULL",
        'decidedBy'                 => "VARCHAR(100) NULL DEFAULT NULL",
        'decidedAt'                 => "DATETIME(3) NULL DEFAULT NULL",

        // ── Reinscripción: hermanos ─────────────────────────────────────────
        'hasSiblings'               => "TINYINT(1) NULL DEFAULT NULL",
        'siblingDetails'            => "TEXT NULL DEFAULT NULL",

        // ── Progenitores / tutores (común) ──────────────────────────────────
        'parent1Name'               => "VARCHAR(191) NULL DEFAULT NULL",
        'parent1Dni'                => "VARCHAR(20) NULL DEFAULT NULL",
        'parent1Relationship'       => "VARCHAR(100) NULL DEFAULT NULL",
        'parent1Phone'              => "VARCHAR(50) NULL DEFAULT NULL",
        'parent1Email'              => "VARCHAR(191) NULL DEFAULT NULL",
        'parent1Address'            => "VARCHAR(255) NULL DEFAULT NULL",
        'parent1City'               => "VARCHAR(100) NULL DEFAULT NULL",
        'parent1PostalCode'         => "VARCHAR(50) NULL DEFAULT NULL",
        'parent1Occupation'         => "VARCHAR(191) NULL DEFAULT NULL",
        'isSingleParent'            => "TINYINT(1) NULL DEFAULT NULL",
        'parent2Name'               => "VARCHAR(191) NULL DEFAULT NULL",
        'parent2Dni'                => "VARCHAR(20) NULL DEFAULT NULL",
        'parent2Relationship'       => "VARCHAR(100) NULL DEFAULT NULL",
        'parent2Phone'              => "VARCHAR(50) NULL DEFAULT NULL",
        'parent2Email'              => "VARCHAR(191) NULL DEFAULT NULL",
        'parent2Address'            => "VARCHAR(255) NULL DEFAULT NULL",
        'parent2City'               => "VARCHAR(100) NULL DEFAULT NULL",
        'parent2PostalCode'         => "VARCHAR(50) NULL DEFAULT NULL",
        'parent2Occupation'         => "VARCHAR(191) NULL DEFAULT NULL",

        // ── Contactos, tutela y salud ───────────────────────────────────────
        'emergencyContactName'      => "VARCHAR(191) NULL DEFAULT NULL",
        'emergencyContactPhone'     => "VARCHAR(50) NULL DEFAULT NULL",
        'legalCustodyInfo'          => "VARCHAR(255) NULL DEFAULT NULL",
        'authorizedPickups'         => "VARCHAR(255) NULL DEFAULT NULL",
        'healthDisabilities'        => "TEXT NULL DEFAULT NULL",
        'healthAllergiesMedication' => "TEXT NULL DEFAULT NULL",

        // ── Reinscripción: facturación y contrato ───────────────────────────
        'billingName'               => "VARCHAR(191) NULL DEFAULT NULL",
        'billingCuit'               => "VARCHAR(20) NULL DEFAULT NULL",
        'billingTaxCondition'       => "VARCHAR(100) NULL DEFAULT NULL",
        'billingEmail'              => "VARCHAR(191) NULL DEFAULT NULL",
        'billingAddress'            => "VARCHAR(255) NULL DEFAULT NULL",
        'contractAccepted'          => "TINYINT(1) NULL DEFAULT NULL",
        'dataAccepted'              => "TINYINT(1) NULL DEFAULT NULL",
        'termsAccepted'             => "TINYINT(1) NULL DEFAULT NULL",
        'termsVersion'              => "VARCHAR(30) NULL DEFAULT NULL",

        // ── Firmas: LONGTEXT obligatorio (data URL base64) ──────────────────
        'signature1Data'            => "LONGTEXT NULL DEFAULT NULL",
        'signature2Data'            => "LONGTEXT NULL DEFAULT NULL",

        // ── Varios ──────────────────────────────────────────────────────────
        'comments'                  => "TEXT NULL DEFAULT NULL",
        'sourceIp'                  => "VARCHAR(45) NULL DEFAULT NULL",
        'userAgent'                 => "VARCHAR(255) NULL DEFAULT NULL",
        'createdAt'                 => "DATETIME(3) NULL DEFAULT NULL",
        'updatedAt'                 => "DATETIME(3) NULL DEFAULT NULL",
    ];
}

function enrollmentSchemaIndexes(): array
{
    return [
        'idx_kind_cohort_created' => "(`formKind`, `cohortYear`, `createdAt`)",
        'idx_submission_uuid'     => "(`submissionUuid`)",
        'idx_tracking'            => "(`trackingNumber`)",
        'idx_student_dni'         => "(`studentDni`)",
        'idx_admission'           => "(`cohortYear`, `admissionStatus`)",
    ];
}

/** Columnas realmente presentes en la tabla. Cacheado por request. */
function enrollmentExistingColumns(PDO $pdo, bool $refresh = false): array
{
    static $cols = null;
    if ($cols !== null && !$refresh) return $cols;

    try {
        $st = $pdo->prepare(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Enrollment'"
        );
        $st->execute();
        $cols = array_flip($st->fetchAll(PDO::FETCH_COLUMN));
    } catch (Throwable $e) {
        error_log('[SCHEMA] No se pudieron leer columnas: ' . $e->getMessage());
        $cols = [];
    }
    return $cols;
}

/**
 * Crea o alinea la tabla `Enrollment`. Idempotente y compatible MySQL 8 + MariaDB.
 * Devuelve un informe para diagnóstico; nunca lanza excepción.
 */
function ensureEnrollmentTableSchema(?PDO $pdo): array
{
    $report = ['ok' => false, 'created' => false, 'added' => [], 'indexes' => [], 'errors' => []];
    if (!$pdo instanceof PDO) {
        $report['errors'][] = 'Sin conexión PDO';
        return $report;
    }

    // ── 1. Tabla base ───────────────────────────────────────────────────────
    try {
        $exists = (bool) $pdo->query(
            "SELECT COUNT(*) FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Enrollment'"
        )->fetchColumn();

        if (!$exists) {
            $pdo->exec(
                "CREATE TABLE `Enrollment` (
                    `id` VARCHAR(36) NOT NULL,
                    PRIMARY KEY (`id`)
                 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
            );
            $report['created'] = true;
        }
    } catch (Throwable $e) {
        $report['errors'][] = 'CREATE TABLE: ' . $e->getMessage();
        return $report;
    }

    // ── 2. Columnas faltantes, en un único ALTER ────────────────────────────
    $existing = enrollmentExistingColumns($pdo, true);
    $missing  = [];
    foreach (enrollmentSchemaDefinition() as $col => $ddl) {
        if (!isset($existing[$col])) {
            $missing[] = "ADD COLUMN `{$col}` {$ddl}";
            $report['added'][] = $col;
        }
    }

    if ($missing) {
        try {
            // Un solo ALTER: MySQL reconstruye la tabla una vez, no N veces.
            $pdo->exec("ALTER TABLE `Enrollment` " . implode(', ', $missing));
            enrollmentExistingColumns($pdo, true);
        } catch (Throwable $e) {
            $report['errors'][] = 'ALTER masivo: ' . $e->getMessage();
            // Degradación: intentar columna por columna para no perder todo.
            foreach ($missing as $clause) {
                try { $pdo->exec("ALTER TABLE `Enrollment` {$clause}"); }
                catch (Throwable $e2) { $report['errors'][] = trim($clause) . ' => ' . $e2->getMessage(); }
            }
            enrollmentExistingColumns($pdo, true);
        }
    }

    // ── 3. Índices ──────────────────────────────────────────────────────────
    foreach (enrollmentSchemaIndexes() as $name => $cols) {
        try {
            $st = $pdo->prepare(
                "SELECT COUNT(*) FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Enrollment' AND INDEX_NAME = ?"
            );
            $st->execute([$name]);
            if (!$st->fetchColumn()) {
                $pdo->exec("ALTER TABLE `Enrollment` ADD INDEX `{$name}` {$cols}");
                $report['indexes'][] = $name;
            }
        } catch (Throwable $e) {
            $report['errors'][] = "INDEX {$name}: " . $e->getMessage();
        }
    }

    // ── 4. Backfill de formKind en registros legacy ─────────────────────────
    // Se corre una sola vez: después no hay filas con formKind NULL.
    try {
        $pdo->exec(
            "UPDATE `Enrollment`
                SET `formKind` = CASE
                    WHEN `type` = 'preinscripcion_2027' THEN 'preinscripcion'
                    WHEN `trackingNumber` LIKE 'PRE-%'  THEN 'preinscripcion'
                    WHEN `admissionStatus` IS NOT NULL AND `admissionStatus` <> '' THEN 'preinscripcion'
                    WHEN `currentSchool` IS NOT NULL AND `currentSchool` <> ''     THEN 'preinscripcion'
                    ELSE 'reinscripcion'
                END
              WHERE `formKind` IS NULL"
        );
    } catch (Throwable $e) {
        $report['errors'][] = 'Backfill formKind: ' . $e->getMessage();
    }

    // ── 5. Tablas auxiliares ────────────────────────────────────────────────
    try {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `InterviewSlot` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `cohortYear` INT NOT NULL,
                `schoolId` VARCHAR(10) NOT NULL,
                `slotDate` DATE NOT NULL,
                `startTime` TIME NOT NULL,
                `endTime` TIME NOT NULL,
                `capacity` SMALLINT NOT NULL DEFAULT 6,
                `booked` SMALLINT NOT NULL DEFAULT 0,
                `isActive` TINYINT(1) NOT NULL DEFAULT 1,
                UNIQUE KEY `uq_slot` (`cohortYear`,`schoolId`,`slotDate`,`startTime`)
             ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    } catch (Throwable $e) {
        $report['errors'][] = 'InterviewSlot: ' . $e->getMessage();
    }

    $report['ok'] = empty($report['errors']);
    if (!$report['ok']) {
        error_log('[SCHEMA] Migración con errores: ' . json_encode($report['errors'], JSON_UNESCAPED_UNICODE));
    }
    return $report;
}
