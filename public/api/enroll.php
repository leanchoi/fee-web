<?php
// ==============================================================================
// MOTOR UNIFICADO DE ADMISIONES - FUNDACIÓN EDUCATIVA ESQUEL
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

if ($attemptData['count'] >= 15) {
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
if (!empty($data['website_url']) || !empty($data['bot_check']) || !empty($data['hp_field'])) {
    echo json_encode(["success" => true, "id" => "sub-" . time()]);
    exit;
}

$pdo = getPDO();
if ($pdo) {
    ensureEnrollmentTableSchema($pdo);
}

// Helper sanitizador
function cleanStr($val, $maxLen = 191) {
    if ($val === null) return '';
    $clean = htmlspecialchars(trim((string)$val), ENT_QUOTES, 'UTF-8');
    return mb_substr($clean, 0, $maxLen);
}

function cleanDigits($val) {
    if (!$val) return '';
    return preg_replace('/[^0-9]/', '', (string)$val);
}

$submissionUuid = cleanStr($data['submissionUuid'] ?? '', 36);
if (empty($submissionUuid)) {
    $submissionUuid = generateUUID();
}

$enrollmentType = cleanStr($data['type'] ?? 'preinscripcion_2027');
$isPreinscripcion = ($enrollmentType === 'preinscripcion_general' || $enrollmentType === 'preinscripcion_2027' || $enrollmentType === 'preinscripcion');
$formCohort = (int)($data['cohortYear'] ?? 2027);

// 3. Idempotencia: Verificar si este UUID ya fue procesado
if ($pdo) {
    try {
        $stmtCheckUuid = $pdo->prepare("SELECT `id`, `trackingNumber` FROM `Enrollment` WHERE `submissionUuid` = :uuid LIMIT 1");
        $stmtCheckUuid->execute([':uuid' => $submissionUuid]);
        $existingSubmission = $stmtCheckUuid->fetch();
        if ($existingSubmission) {
            echo json_encode([
                "success" => true,
                "id" => $existingSubmission['id'],
                "trackingNumber" => $existingSubmission['trackingNumber'],
                "message" => "Solicitud recuperada con éxito."
            ]);
            exit;
        }
    } catch (Exception $e) {}
}

// 4. Validar estado de la Convocatoria (MySQL + settings.json)
$settingsFile = __DIR__ . '/data/settings.json';
$localSettings = file_exists($settingsFile) ? (json_decode(file_get_contents($settingsFile), true) ?: []) : [];
$activeMode = $localSettings['mode'] ?? 'reinscripciones';

// Si está explícitamente cerrado el sistema completo
if ($activeMode === 'cerrado') {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "error" => "El sistema de inscripciones y preinscripciones se encuentra en pausa administrativa temporalmente.",
        "code" => "CONVOCATORIA_CERRADA"
    ]);
    exit;
}

$id = generateUUID();
$trackingPrefix = $isPreinscripcion ? 'PRE' : 'FEE';
$trackingNumber = "{$trackingPrefix}-{$formCohort}-" . strtoupper(substr(md5($id . microtime()), 0, 6));

try {
    // Datos comunes del estudiante
    $studentName = cleanStr($data['studentName'] ?? '');
    $studentDni  = cleanDigits($data['studentDni'] ?? '');
    $school      = cleanStr($data['school'] ?? 'Escuela N.º 1030', 100);
    $studentGrade = cleanStr($data['studentGrade'] ?? '', 100);
    $studentLevel = cleanStr($data['studentLevel'] ?? '', 50);

    if (empty($studentName) || empty($studentDni) || empty($studentGrade)) {
        throw new Exception("Nombre, DNI y curso/sala del estudiante son campos obligatorios.");
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();
        } catch (Exception $e) {}
    }

    // =========================================================================
    // FLUJO PREINSCRIPCIÓN (NUEVOS INGRESANTES)
    // =========================================================================
    if ($isPreinscripcion) {
        $studentGender     = cleanStr($data['studentGender'] ?? '', 20);
        $studentBirthDate  = !empty($data['studentBirthDate']) ? cleanStr($data['studentBirthDate'], 10) : null;
        $studentNationality = cleanStr($data['studentNationality'] ?? 'Argentina', 60);
        $studentBirthPlace = cleanStr($data['studentBirthPlace'] ?? 'Esquel', 100);
        
        $currentSchool     = cleanStr($data['currentSchool'] ?? '');
        $currentSchoolType = in_array($data['currentSchoolType'] ?? '', ['publica', 'privada', 'otra']) ? $data['currentSchoolType'] : 'publica';
        $hasDebtClearance  = !empty($data['hasDebtClearance']) ? 1 : 0;
        $hasRepeated       = !empty($data['hasRepeated']) ? 1 : 0;
        $repeatedGrade     = cleanStr($data['repeatedGrade'] ?? '', 60);
        $pendingSubjects   = cleanStr($data['pendingSubjects'] ?? '', 500);

        // Prioridades
        $isStaffChild      = !empty($data['isStaffChild']) ? 1 : 0;
        $staffMemberName   = cleanStr($data['staffMemberName'] ?? '');
        $staffMemberDni    = cleanDigits($data['staffMemberDni'] ?? '');
        $hasSiblingInSchool = !empty($data['hasSiblingInSchool']) ? 1 : 0;
        $siblingDni        = cleanDigits($data['siblingDni'] ?? '');
        $siblingCurrentGrade = cleanStr($data['siblingCurrentGrade'] ?? '');

        // Requisitos de Inglés
        $englishAccreditationType = cleanStr($data['englishAccreditationType'] ?? 'ninguno', 30);
        $englishInstituteName     = cleanStr($data['englishInstituteName'] ?? '');
        $englishLevelAchieved     = cleanStr($data['englishLevelAchieved'] ?? '', 100);

        // Progenitores
        $parent1Name       = cleanStr($data['parent1Name'] ?? ($data['tutorName'] ?? ''));
        $parent1Dni        = cleanDigits($data['parent1Dni'] ?? '');
        $parent1Relationship = cleanStr($data['parent1Relationship'] ?? 'Padre/Madre/Tutor', 100);
        $parent1Phone      = cleanStr($data['parent1Phone'] ?? ($data['tutorPhone'] ?? ''), 50);
        $parent1Email      = cleanStr($data['parent1Email'] ?? ($data['tutorEmail'] ?? ''), 191);
        $parent1Address    = cleanStr($data['parent1Address'] ?? '', 255);
        $parent1City       = cleanStr($data['parent1City'] ?? 'Esquel', 100);
        $parent1PostalCode = cleanStr($data['parent1PostalCode'] ?? '9200', 50);
        $parent1Occupation = cleanStr($data['parent1Occupation'] ?? '');

        $isSingleParent    = !empty($data['isSingleParent']) ? 1 : 0;
        $parent2Name       = $isSingleParent ? '' : cleanStr($data['parent2Name'] ?? '');
        $parent2Dni        = $isSingleParent ? '' : cleanDigits($data['parent2Dni'] ?? '');
        $parent2Relationship = $isSingleParent ? '' : cleanStr($data['parent2Relationship'] ?? 'Madre/Padre/Tutora', 100);
        $parent2Phone      = $isSingleParent ? '' : cleanStr($data['parent2Phone'] ?? '', 50);
        $parent2Email      = $isSingleParent ? '' : cleanStr($data['parent2Email'] ?? '', 191);
        $parent2Occupation = $isSingleParent ? '' : cleanStr($data['parent2Occupation'] ?? '');

        // Contactos y Salud
        $emergencyContactName  = cleanStr($data['emergencyContactName'] ?? '');
        $emergencyContactPhone = cleanStr($data['emergencyContactPhone'] ?? '', 50);
        $legalCustodyInfo      = cleanStr($data['legalCustodyInfo'] ?? '', 500);
        $authorizedPickups     = cleanStr($data['authorizedPickups'] ?? '', 500);
        $healthDisabilities    = cleanStr($data['healthDisabilities'] ?? '', 500);
        $healthAllergiesMedication = cleanStr($data['healthAllergiesMedication'] ?? '', 500);

        // Turno de Entrevista (InterviewSlot)
        $interviewSlotId = !empty($data['interviewSlotId']) ? (int)$data['interviewSlotId'] : null;
        $admissionStatus = 'recibida';

        if ($pdo) {
            try {
                if ($interviewSlotId) {
                    // Reserva atómica con comprobación de capacidad
                    $stmtReserve = $pdo->prepare("
                        UPDATE `InterviewSlot` 
                        SET `booked` = `booked` + 1 
                        WHERE `id` = :slotId AND `booked` < `capacity` AND `isActive` = 1
                    ");
                    $stmtReserve->execute([':slotId' => $interviewSlotId]);
                    if ($stmtReserve->rowCount() > 0) {
                        $admissionStatus = 'entrevista_agendada';
                    }
                }

                // Marcar trámites anteriores del mismo aspirante en esta cohorte como reemplazados
                $stmtReplaceOld = $pdo->prepare("
                    UPDATE `Enrollment` 
                    SET `status` = 'reemplazado' 
                    WHERE `studentDni` = :dni AND `cohortYear` = :cohort AND `type` = 'preinscripcion_2027' AND `status` = 'vigente'
                ");
                $stmtReplaceOld->execute([':dni' => $studentDni, ':cohort' => $formCohort]);

                // Insertar Preinscripción
                $stmtInsert = $pdo->prepare("
                    INSERT INTO `Enrollment` (
                        `id`, `submissionUuid`, `trackingNumber`, `type`, `cohortYear`, `status`,
                        `studentName`, `studentDni`, `studentGender`, `studentBirthDate`, `studentNationality`, `studentBirthPlace`,
                        `school`, `studentLevel`, `studentGrade`,
                        `currentSchool`, `currentSchoolType`, `hasDebtClearance`, `hasRepeated`, `repeatedGrade`, `pendingSubjects`,
                        `isStaffChild`, `staffMemberName`, `staffMemberDni`, `hasSiblingInSchool`, `siblingDni`, `siblingCurrentGrade`,
                        `englishAccreditationType`, `englishInstituteName`, `englishLevelAchieved`,
                        `parent1Name`, `parent1Dni`, `parent1Relationship`, `parent1Phone`, `parent1Email`, `parent1Address`, `parent1City`, `parent1PostalCode`, `parent1Occupation`,
                        `isSingleParent`, `parent2Name`, `parent2Dni`, `parent2Relationship`, `parent2Phone`, `parent2Email`, `parent2Occupation`,
                        `emergencyContactName`, `emergencyContactPhone`, `legalCustodyInfo`, `authorizedPickups`, `healthDisabilities`, `healthAllergiesMedication`,
                        `interviewSlotId`, `admissionStatus`, `termsVersion`, `comments`, `createdAt`, `updatedAt`
                    ) VALUES (
                        :id, :uuid, :tracking, 'preinscripcion_2027', :cohort, 'vigente',
                        :stuName, :stuDni, :stuGender, :stuBirthDate, :stuNat, :stuBirthPlace,
                        :school, :stuLevel, :stuGrade,
                        :curSchool, :curSchoolType, :debtClear, :repeated, :repGrade, :pendingSub,
                        :isStaff, :staffName, :staffDni, :hasSib, :sibDni, :sibGrade,
                        :engType, :engInst, :engLvl,
                        :p1Name, :p1Dni, :p1Rel, :p1Phone, :p1Email, :p1Address, :p1City, :p1Cp, :p1Occ,
                        :singleP, :p2Name, :p2Dni, :p2Rel, :p2Phone, :p2Email, :p2Occ,
                        :emName, :emPhone, :custody, :pickups, :hDis, :hAllergies,
                        :slotId, :admStatus, '2027.pre.v1', :comments, NOW(3), NOW(3)
                    )
                ");

                $stmtInsert->execute([
                    ':id' => $id,
                    ':uuid' => $submissionUuid,
                    ':tracking' => $trackingNumber,
                    ':cohort' => $formCohort,
                    ':stuName' => $studentName,
                    ':stuDni' => $studentDni,
                    ':stuGender' => $studentGender,
                    ':stuBirthDate' => $studentBirthDate,
                    ':stuNat' => $studentNationality,
                    ':stuBirthPlace' => $studentBirthPlace,
                    ':school' => $school,
                    ':stuLevel' => $studentLevel,
                    ':stuGrade' => $studentGrade,
                    ':curSchool' => $currentSchool,
                    ':curSchoolType' => $currentSchoolType,
                    ':debtClear' => $hasDebtClearance,
                    ':repeated' => $hasRepeated,
                    ':repGrade' => $repeatedGrade,
                    ':pendingSub' => $pendingSubjects,
                    ':isStaff' => $isStaffChild,
                    ':staffName' => $staffMemberName,
                    ':staffDni' => $staffMemberDni,
                    ':hasSib' => $hasSiblingInSchool,
                    ':sibDni' => $siblingDni,
                    ':sibGrade' => $siblingCurrentGrade,
                    ':engType' => $englishAccreditationType,
                    ':engInst' => $englishInstituteName,
                    ':engLvl' => $englishLevelAchieved,
                    ':p1Name' => $parent1Name,
                    ':p1Dni' => $parent1Dni,
                    ':p1Rel' => $parent1Relationship,
                    ':p1Phone' => $parent1Phone,
                    ':p1Email' => $parent1Email,
                    ':p1Address' => $parent1Address,
                    ':p1City' => $parent1City,
                    ':p1Cp' => $parent1PostalCode,
                    ':p1Occ' => $parent1Occupation,
                    ':singleP' => $isSingleParent,
                    ':p2Name' => $parent2Name,
                    ':p2Dni' => $parent2Dni,
                    ':p2Rel' => $parent2Relationship,
                    ':p2Phone' => $parent2Phone,
                    ':p2Email' => $parent2Email,
                    ':p2Occ' => $parent2Occupation,
                    ':emName' => $emergencyContactName,
                    ':emPhone' => $emergencyContactPhone,
                    ':custody' => $legalCustodyInfo,
                    ':pickups' => $authorizedPickups,
                    ':hDis' => $healthDisabilities,
                    ':hAllergies' => $healthAllergiesMedication,
                    ':slotId' => $interviewSlotId,
                    ':admStatus' => $admissionStatus,
                    ':comments' => cleanStr($data['comments'] ?? '', 1000)
                ]);
            } catch (Exception $dbErr) {
                error_log("[PREINSC_DB_INSERT_ERR] " . $dbErr->getMessage());
            }
        }
                `isStaffChild`, `staffMemberName`, `staffMemberDni`, `hasSiblingInSchool`, `siblingDni`, `siblingCurrentGrade`,
                `englishAccreditationType`, `englishInstituteName`, `englishLevelAchieved`,
                `parent1Name`, `parent1Dni`, `parent1Relationship`, `parent1Phone`, `parent1Email`, `parent1Address`, `parent1City`, `parent1PostalCode`, `parent1Occupation`,
                `isSingleParent`, `parent2Name`, `parent2Dni`, `parent2Relationship`, `parent2Phone`, `parent2Email`, `parent2Occupation`,
                `emergencyContactName`, `emergencyContactPhone`, `legalCustodyInfo`, `authorizedPickups`, `healthDisabilities`, `healthAllergiesMedication`,
                `interviewSlotId`, `admissionStatus`, `termsVersion`, `comments`, `createdAt`, `updatedAt`
            ) VALUES (
                :id, :uuid, :tracking, 'preinscripcion_2027', :cohort, 'vigente',
                :stuName, :stuDni, :stuGender, :stuBirthDate, :stuNat, :stuBirthPlace,
                :school, :stuLevel, :stuGrade,
                :curSchool, :curSchoolType, :debtClear, :repeated, :repGrade, :pendingSub,
                :isStaff, :staffName, :staffDni, :hasSib, :sibDni, :sibGrade,
                :engType, :engInst, :engLvl,
                :p1Name, :p1Dni, :p1Rel, :p1Phone, :p1Email, :p1Address, :p1City, :p1Cp, :p1Occ,
                :singleP, :p2Name, :p2Dni, :p2Rel, :p2Phone, :p2Email, :p2Occ,
                :emName, :emPhone, :custody, :pickups, :hDis, :hAllergies,
                :slotId, :admStatus, '2027.pre.v1', :comments, NOW(3), NOW(3)
            )
        ");

        $stmtInsert->execute([
            ':id' => $id,
            ':uuid' => $submissionUuid,
            ':tracking' => $trackingNumber,
            ':cohort' => $formCohort,
            ':stuName' => $studentName,
            ':stuDni' => $studentDni,
            ':stuGender' => $studentGender,
            ':stuBirthDate' => $studentBirthDate,
            ':stuNat' => $studentNationality,
            ':stuBirthPlace' => $studentBirthPlace,
            ':school' => $school,
            ':stuLevel' => $studentLevel,
            ':stuGrade' => $studentGrade,
            ':curSchool' => $currentSchool,
            ':curSchoolType' => $currentSchoolType,
            ':debtClear' => $hasDebtClearance,
            ':repeated' => $hasRepeated,
            ':repGrade' => $repeatedGrade,
            ':pendingSub' => $pendingSubjects,
            ':isStaff' => $isStaffChild,
            ':staffName' => $staffMemberName,
            ':staffDni' => $staffMemberDni,
            ':hasSib' => $hasSiblingInSchool,
            ':sibDni' => $siblingDni,
            ':sibGrade' => $siblingCurrentGrade,
            ':engType' => $englishAccreditationType,
            ':engInst' => $englishInstituteName,
            ':engLvl' => $englishLevelAchieved,
            ':p1Name' => $parent1Name,
            ':p1Dni' => $parent1Dni,
            ':p1Rel' => $parent1Relationship,
            ':p1Phone' => $parent1Phone,
            ':p1Email' => $parent1Email,
            ':p1Address' => $parent1Address,
            ':p1City' => $parent1City,
            ':p1Cp' => $parent1PostalCode,
            ':p1Occ' => $parent1Occupation,
            ':singleP' => $isSingleParent,
            ':p2Name' => $parent2Name,
            ':p2Dni' => $parent2Dni,
            ':p2Rel' => $parent2Relationship,
            ':p2Phone' => $parent2Phone,
            ':p2Email' => $parent2Email,
            ':p2Occ' => $parent2Occupation,
            ':emName' => $emergencyContactName,
            ':emPhone' => $emergencyContactPhone,
            ':custody' => $legalCustodyInfo,
            ':pickups' => $authorizedPickups,
            ':hDis' => $healthDisabilities,
            ':hAllergies' => $healthAllergiesMedication,
            ':slotId' => $interviewSlotId,
            ':admStatus' => $admissionStatus,
            ':comments' => cleanStr($data['comments'] ?? '', 1000)
        ]);

    } else {
        // =====================================================================
        // FLUJO REINSCRIPCIÓN (ALUMNOS REGULARES CON CONTRATO Y FIRMAS)
        // =========================================================================
        $hasSiblings       = !empty($data['hasSiblings']) ? 1 : 0;
        $siblingDetails    = cleanStr($data['siblingDetails'] ?? '', 500);
        $parent1Name       = cleanStr($data['parent1Name'] ?? ($data['tutorName'] ?? ''));
        $parent1Dni        = cleanDigits($data['parent1Dni'] ?? '');
        $parent1Relationship = cleanStr($data['parent1Relationship'] ?? 'Madre/Padre/Tutor', 100);
        $parent1Phone      = cleanStr($data['parent1Phone'] ?? ($data['tutorPhone'] ?? ''), 50);
        $parent1Email      = cleanStr($data['parent1Email'] ?? ($data['tutorEmail'] ?? ''), 191);
        $parent1Address    = cleanStr($data['parent1Address'] ?? '', 255);
        $parent1City       = cleanStr($data['parent1City'] ?? 'Esquel', 100);
        $parent1PostalCode = cleanStr($data['parent1PostalCode'] ?? '9200', 50);

        $isSingleParent    = !empty($data['isSingleParent']) ? 1 : 0;
        $parent2Name       = $isSingleParent ? '' : cleanStr($data['parent2Name'] ?? '');
        $parent2Dni        = $isSingleParent ? '' : cleanDigits($data['parent2Dni'] ?? '');
        $parent2Relationship = $isSingleParent ? '' : cleanStr($data['parent2Relationship'] ?? '', 100);
        $parent2Phone      = $isSingleParent ? '' : cleanStr($data['parent2Phone'] ?? '', 50);
        $parent2Email      = $isSingleParent ? '' : cleanStr($data['parent2Email'] ?? '', 191);
        $parent2Address    = $isSingleParent ? '' : cleanStr($data['parent2Address'] ?? '', 255);
        $parent2City       = $isSingleParent ? '' : cleanStr($data['parent2City'] ?? 'Esquel', 100);
        $parent2PostalCode = $isSingleParent ? '' : cleanStr($data['parent2PostalCode'] ?? '9200', 50);
        $signature2Data    = $isSingleParent ? null : ($data['signature2Data'] ?? null);

        $billingName       = cleanStr($data['billingName'] ?? $parent1Name);
        $billingCuit       = cleanDigits($data['billingCuit'] ?? $parent1Dni);
        $billingTaxCondition = cleanStr($data['billingTaxCondition'] ?? 'Consumidor Final', 100);
        $billingEmail      = cleanStr($data['billingEmail'] ?? $parent1Email, 191);
        $billingAddress    = cleanStr($data['billingAddress'] ?? $parent1Address, 255);
        $signature1Data    = $data['signature1Data'] ?? null;

        if ($pdo) {
            try {
                // Marcar trámite previo del mismo estudiante como reemplazado
                $stmtReplaceRe = $pdo->prepare("
                    UPDATE `Enrollment` 
                    SET `status` = 'reemplazado' 
                    WHERE `studentDni` = :dni AND `cohortYear` = :cohort AND `type` = 'reinscripcion_2027' AND `status` = 'vigente'
                ");
                $stmtReplaceRe->execute([':dni' => $studentDni, ':cohort' => $formCohort]);

                $stmtInsert = $pdo->prepare("
                    INSERT INTO `Enrollment` (
                        `id`, `submissionUuid`, `trackingNumber`, `type`, `cohortYear`, `status`,
                        `studentName`, `studentDni`, `school`, `studentLevel`, `studentGrade`,
                        `hasSiblings`, `siblingDetails`,
                        `parent1Name`, `parent1Dni`, `parent1Relationship`, `parent1Phone`, `parent1Email`, `parent1Address`, `parent1City`, `parent1PostalCode`,
                        `isSingleParent`, `parent2Name`, `parent2Dni`, `parent2Relationship`, `parent2Phone`, `parent2Email`, `parent2Address`, `parent2City`, `parent2PostalCode`,
                        `billingName`, `billingCuit`, `billingTaxCondition`, `billingEmail`, `billingAddress`,
                        `contractAccepted`, `dataAccepted`, `termsAccepted`,
                        `signature1Data`, `signature2Data`, `comments`, `createdAt`, `updatedAt`
                    ) VALUES (
                        :id, :uuid, :tracking, 'reinscripcion_2027', :cohort, 'vigente',
                        :stuName, :stuDni, :school, :stuLevel, :stuGrade,
                        :hasSib, :sibDetails,
                        :p1Name, :p1Dni, :p1Rel, :p1Phone, :p1Email, :p1Address, :p1City, :p1Cp,
                        :singleP, :p2Name, :p2Dni, :p2Rel, :p2Phone, :p2Email, :p2Address, :p2City, :p2Cp,
                        :billName, :billCuit, :billTax, :billEmail, :billAddress,
                        1, 1, 1,
                        :sig1, :sig2, :comments, NOW(3), NOW(3)
                    )
                ");

                $stmtInsert->execute([
                    ':id'          => $id,
                    ':uuid'        => $submissionUuid,
                    ':tracking'    => $trackingNumber,
                    ':cohort'      => $formCohort,
                    ':stuName'     => $studentName,
                    ':stuDni'      => $studentDni,
                    ':school'      => $school,
                    ':stuLevel'    => $studentLevel,
                    ':stuGrade'    => $studentGrade,
                    ':hasSib'      => $hasSiblings,
                    ':sibDetails'  => $siblingDetails,
                    ':p1Name'      => $parent1Name,
                    ':p1Dni'       => $parent1Dni,
                    ':p1Rel'       => $parent1Relationship,
                    ':p1Phone'     => $parent1Phone,
                    ':p1Email'     => $parent1Email,
                    ':p1Address'   => $parent1Address,
                    ':p1City'      => $parent1City,
                    ':p1Cp'        => $parent1PostalCode,
                    ':singleP'     => $isSingleParent,
                    ':p2Name'      => $parent2Name,
                    ':p2Dni'       => $parent2Dni,
                    ':p2Rel'       => $parent2Relationship,
                    ':p2Phone'     => $parent2Phone,
                    ':p2Email'     => $parent2Email,
                    ':p2Address'   => $parent2Address,
                    ':p2City'      => $parent2City,
                    ':p2Cp'        => $parent2PostalCode,
                    ':billName'    => $billingName,
                    ':billCuit'    => $billingCuit,
                    ':billTax'     => $billingTaxCondition,
                    ':billEmail'   => $billingEmail,
                    ':billAddress' => $billingAddress,
                    ':sig1'        => $signature1Data,
                    ':sig2'        => $signature2Data,
                    ':comments'    => cleanStr($data['comments'] ?? '', 1000)
                ]);
            } catch (Exception $dbErr) {
                error_log("[REINSC_DB_INSERT_ERR] " . $dbErr->getMessage());
            }
        }
    }

    if ($pdo && $pdo->inTransaction()) {
        $pdo->commit();
    }

    // Respaldo Dual Permanente en Almacenamiento JSON
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
    
    $enrollFile = $dataDir . '/enrollments.json';
    $localEnrollments = file_exists($enrollFile) ? (json_decode(file_get_contents($enrollFile), true) ?: []) : [];
    
    $submissionRecord = array_merge($data, [
        "id"             => $id,
        "submissionUuid" => $submissionUuid,
        "trackingNumber" => $trackingNumber,
        "type"           => $isPreinscripcion ? 'preinscripcion_2027' : 'reinscripcion_2027',
        "cohortYear"     => $formCohort,
        "status"         => 'vigente',
        "studentName"    => $studentName,
        "studentDni"     => $studentDni,
        "school"         => $school,
        "studentLevel"   => $studentLevel,
        "studentGrade"   => $studentGrade,
        "parent1Name"    => $parent1Name,
        "parent1Dni"     => $parent1Dni,
        "parent1Phone"   => $parent1Phone,
        "parent1Email"   => $parent1Email,
        "parent1Address" => $parent1Address,
        "parent1City"    => $parent1City,
        "createdAt"      => date('Y-m-d H:i:s'),
        "updatedAt"      => date('Y-m-d H:i:s')
    ]);

    $localEnrollments[] = $submissionRecord;
    @file_put_contents($enrollFile, json_encode($localEnrollments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    // Si es preinscripción, respaldar también en archivo exclusivo
    if ($isPreinscripcion) {
        $preFile = $dataDir . '/preinscripciones.json';
        $localPres = file_exists($preFile) ? (json_decode(file_get_contents($preFile), true) ?: []) : [];
        $localPres[] = $submissionRecord;
        @file_put_contents($preFile, json_encode($localPres, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // Sincronización asíncrona a Google Sheets
    syncToGoogleSheets([
        "id"             => $id,
        "trackingNumber" => $trackingNumber,
        "type"           => $isPreinscripcion ? 'preinscripcion_2027' : 'reinscripcion_2027',
        "cohort"         => $formCohort,
        "studentName"    => $studentName,
        "studentDni"     => $studentDni,
        "school"         => $school,
        "studentGrade"   => $studentGrade,
        "parent1Name"    => $parent1Name,
        "parent1Phone"   => $parent1Phone,
        "parent1Email"   => $parent1Email,
        "createdAt"      => date('Y-m-d H:i:s')
    ]);

    echo json_encode([
        "success"        => true,
        "id"             => $id,
        "trackingNumber" => $trackingNumber,
        "type"           => $isPreinscripcion ? 'preinscripcion' : 'reinscripcion',
        "message"        => "Trámite procesado exitosamente."
    ]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    error_log("[ENROLL_ERROR] " . $e->getMessage());
    
    // Respaldo de emergencia en caso de fallo DB
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
    $enrollFile = $dataDir . '/enrollments.json';
    $localEnrollments = file_exists($enrollFile) ? (json_decode(file_get_contents($enrollFile), true) ?: []) : [];
    $emergencyRecord = array_merge($data, [
        "id"             => $id ?? generateUUID(),
        "trackingNumber" => $trackingNumber ?? ("FEE-" . time()),
        "createdAt"      => date('Y-m-d H:i:s'),
        "fallbackSaved"  => true
    ]);
    $localEnrollments[] = $emergencyRecord;
    @file_put_contents($enrollFile, json_encode($localEnrollments, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        "success"        => true,
        "id"             => $emergencyRecord['id'],
        "trackingNumber" => $emergencyRecord['trackingNumber'],
        "type"           => $isPreinscripcion ? 'preinscripcion' : 'reinscripcion',
        "message"        => "Trámite procesado y respaldado exitosamente."
    ]);
}
