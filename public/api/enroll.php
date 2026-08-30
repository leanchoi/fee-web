<?php
declare(strict_types=1);
/**
 * ============================================================================
 * MOTOR UNIFICADO DE INGESTA — FUNDACIÓN EDUCATIVA ESQUEL
 * ----------------------------------------------------------------------------
 * Cambios estructurales respecto de la versión anterior:
 *
 *  1. formKind explícito. La clasificación NUNCA se infiere de la presencia de
 *     firmas ni de substrings. Sale de un campo declarado por el formulario.
 *  2. INSERT construido dinámicamente e intersectado con las columnas que
 *     realmente existen. Una columna faltante deja de abortar el INSERT entero.
 *  3. El fallo de MySQL ya no se traga en silencio: se registra, se marca el
 *     registro JSON con `_dbFailed` y la respuesta informa `persistence`.
 *  4. El cupo de entrevista solo se consume si el INSERT tuvo éxito.
 *  5. Sin htmlspecialchars sobre los datos: el escape va en la salida, no en
 *     la persistencia. Guardar "D&#039;Angelo" es corromper el dato.
 * ============================================================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/schema.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

const FEE_DATA_DIR   = __DIR__ . '/data';
const FEE_RL_WINDOW  = 60;
const FEE_RL_MAX     = 15;

/* ══════════════════════════════════════════════════════════════════════════
   Utilidades
   ══════════════════════════════════════════════════════════════════════════ */

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Limpieza SIN escape HTML. Quita control chars, normaliza espacios, trunca. */
function cleanStr($val, int $maxLen = 191): ?string
{
    if ($val === null) return null;
    $s = (string) $val;
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    $s = trim(preg_replace('/\s+/u', ' ', $s) ?? '');
    if ($s === '') return null;
    return mb_substr($s, 0, $maxLen, 'UTF-8');
}

function cleanDigits($val): ?string
{
    if ($val === null || $val === '') return null;
    $d = preg_replace('/\D+/', '', (string) $val) ?? '';
    return $d === '' ? null : $d;
}

function cleanBool($val): ?int
{
    if ($val === null || $val === '') return null;
    if (is_bool($val)) return $val ? 1 : 0;
    $s = strtolower(trim((string) $val));
    if (in_array($s, ['1', 'true', 'si', 'sí', 'yes', 'on'], true))  return 1;
    if (in_array($s, ['0', 'false', 'no', 'off'], true))             return 0;
    return $val ? 1 : 0;
}

function cleanDate($val): ?string
{
    $s = cleanStr($val, 10);
    if ($s === null) return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
}

function feeUuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function atomicJsonWrite(string $path, array $rows): bool
{
    $tmp = $path . '.' . getmypid() . '.tmp';
    $ok  = @file_put_contents($tmp, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($ok === false) { @unlink($tmp); return false; }
    return @rename($tmp, $path);   // rename es atómico: nunca queda JSON a medias
}

function readJsonFile(string $path): array
{
    if (!is_file($path)) return [];
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

/* ══════════════════════════════════════════════════════════════════════════
   0. Método, rate limit, payload
   ══════════════════════════════════════════════════════════════════════════ */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Método no permitido.']);
}

if (!is_dir(FEE_DATA_DIR)) { @mkdir(FEE_DATA_DIR, 0750, true); }

// REMOTE_ADDR, no X-Forwarded-For: XFF lo manda el cliente y es falsificable.
$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$rlDir    = FEE_DATA_DIR . '/rl';
if (!is_dir($rlDir)) { @mkdir($rlDir, 0750, true); }
$rlFile   = $rlDir . '/enroll_' . hash('sha256', $clientIp) . '.json';

$hits = array_values(array_filter(readJsonFile($rlFile), static fn($t) => (int) $t > time() - FEE_RL_WINDOW));
if (count($hits) >= FEE_RL_MAX) {
    respond(429, ['success' => false, 'error' => 'Demasiadas solicitudes. Esperá un momento e intentá de nuevo.', 'code' => 'RATE_LIMITED']);
}
$hits[] = time();
@file_put_contents($rlFile, json_encode(array_slice($hits, -60)), LOCK_EX);

$raw  = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data) || !$data) {
    respond(400, ['success' => false, 'error' => 'No se recibieron datos válidos.', 'code' => 'BAD_PAYLOAD']);
}

// Honeypot: se responde OK para no darle señal al bot, pero se registra.
if (!empty($data['website_url']) || !empty($data['bot_check']) || !empty($data['hp_field'])) {
    error_log('[ENROLL] Honeypot activado desde ' . $clientIp);
    respond(200, ['success' => true, 'id' => 'hp-' . time(), 'trackingNumber' => 'FEE-0000-000000']);
}

/* ══════════════════════════════════════════════════════════════════════════
   1. CLASIFICACIÓN — fuente de verdad única
   ══════════════════════════════════════════════════════════════════════════
   Precedencia:
     a) formKind explícito enviado por el formulario   ← lo correcto
     b) type con igualdad EXACTA (no substring)
     c) prefijo del trackingNumber
     d) heurística por campos              ← solo legacy, se loguea como warning
   ══════════════════════════════════════════════════════════════════════════ */

function resolveFormKind(array $d, string &$how): string
{
    $kind = strtolower(trim((string) ($d['formKind'] ?? '')));
    if ($kind === 'preinscripcion' || $kind === 'reinscripcion') { $how = 'formKind'; return $kind; }

    // Igualdad exacta. NUNCA strpos/includes: "preinscripcion" CONTIENE "reinscripcion".
    $type = strtolower(trim((string) ($d['type'] ?? '')));
    $map  = [
        'preinscripcion'      => 'preinscripcion',
        'preinscripcion_2027' => 'preinscripcion',
        'preinscripciones'    => 'preinscripcion',
        'reinscripcion'       => 'reinscripcion',
        'reinscripcion_2027'  => 'reinscripcion',
        'reinscripciones'     => 'reinscripcion',
    ];
    if (isset($map[$type])) { $how = 'type'; return $map[$type]; }

    $tracking = strtoupper(trim((string) ($d['trackingNumber'] ?? '')));
    if (str_starts_with($tracking, 'PRE-')) { $how = 'tracking'; return 'preinscripcion'; }
    if (str_starts_with($tracking, 'FEE-')) { $how = 'tracking'; return 'reinscripcion'; }

    $how = 'heuristica';
    $hasContract = !empty($d['signature1Data']) || !empty($d['contractAccepted']) || !empty($d['billingCuit']);
    return $hasContract ? 'reinscripcion' : 'preinscripcion';
}

$how      = '';
$formKind = resolveFormKind($data, $how);
if ($how === 'heuristica') {
    error_log('[ENROLL] Clasificación por heurística (el formulario no envió formKind). Resultado: ' . $formKind);
}

$isPre      = ($formKind === 'preinscripcion');
$legacyType = $isPre ? 'preinscripcion_2027' : 'reinscripcion_2027';
$cohortYear = (int) ($data['cohortYear'] ?? 2027);
if ($cohortYear < 2020 || $cohortYear > 2100) { $cohortYear = 2027; }

/* ══════════════════════════════════════════════════════════════════════════
   2. Esquema y conexión
   ═════════════════════════════════════════════��════════════════════════════ */

$pdo = getPDO();
if ($pdo) { ensureEnrollmentTableSchema($pdo); }

/* ══════════════════════════════════════════════════════════════════════════
   3. Idempotencia
   ══════════════════════════════════════════════════════════════════════════ */

$submissionUuid = cleanStr($data['submissionUuid'] ?? '', 36) ?? feeUuid();

if ($pdo) {
    try {
        $st = $pdo->prepare("SELECT `id`, `trackingNumber` FROM `Enrollment` WHERE `submissionUuid` = :u LIMIT 1");
        $st->execute([':u' => $submissionUuid]);
        if ($prev = $st->fetch()) {
            respond(200, [
                'success'        => true,
                'id'             => $prev['id'],
                'trackingNumber' => $prev['trackingNumber'],
                'formKind'       => $formKind,
                'duplicate'      => true,
                'message'        => 'Tu trámite ya había sido registrado.',
            ]);
        }
    } catch (Throwable $e) {
        error_log('[ENROLL] Chequeo de idempotencia falló: ' . $e->getMessage());
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   4. Convocatoria abierta
   ══════════════════════════════════════════════════════════════════════════ */

$settings   = readJsonFile(FEE_DATA_DIR . '/settings.json');
$activeMode = (string) ($settings['mode'] ?? 'reinscripciones');

if ($activeMode === 'cerrado') {
    respond(409, [
        'success' => false,
        'error'   => 'El sistema de inscripciones se encuentra cerrado temporalmente.',
        'code'    => 'CONVOCATORIA_CERRADA',
    ]);
}

$expected = $isPre ? 'preinscripciones' : 'reinscripciones';
if ($activeMode !== $expected && $activeMode !== 'ambas') {
    // El formulario se cargó antes del cambio de modo. No se pierde el trámite:
    // se acepta y se marca para revisión manual.
    error_log("[ENROLL] Modo activo '{$activeMode}' pero llegó '{$formKind}'. Se acepta y se marca.");
    $data['_outOfWindow'] = true;
}

/* ══════════════════════════════════════════════════════════════════════════
   5. Validación mínima común
   ══════════════════════════════════════════════════════════════════════════ */

$studentName  = cleanStr($data['studentName'] ?? '');
$studentDni   = cleanDigits($data['studentDni'] ?? '');
$studentGrade = cleanStr($data['studentGrade'] ?? '', 100);

$errors = [];
if (!$studentName)                                   { $errors['studentName']  = 'Ingresá el nombre y apellido.'; }
if (!$studentDni || strlen($studentDni) < 7 || strlen($studentDni) > 9) { $errors['studentDni'] = 'El DNI debe tener entre 7 y 9 dígitos.'; }
if (!$studentGrade)                                  { $errors['studentGrade'] = 'Indicá sala, grado o año.'; }

if ($isPre) {
    if (($data['currentSchoolType'] ?? '') === 'privada' && empty($data['hasDebtClearance'])) {
        $errors['hasDebtClearance'] = 'Para colegios privados es obligatorio el compromiso de libre deuda.';
    }
} else {
    if (empty($data['signature1Data']))  { $errors['signature1Data']  = 'Falta la firma del responsable.'; }
    if (empty($data['contractAccepted'])){ $errors['contractAccepted'] = 'Debés aceptar el contrato educativo.'; }
}

if ($errors) {
    respond(422, ['success' => false, 'error' => 'Revisá los datos del formulario.', 'code' => 'VALIDATION', 'fields' => $errors]);
}

/* ══════════════════════════════════════════════════════════════════════════
   6. Armado del registro — un solo array para DB y JSON
   ══════════════════════════════════════════════════════════════════════════ */

$id             = feeUuid();
$trackingNumber = ($isPre ? 'PRE' : 'FEE') . "-{$cohortYear}-" . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
$now            = date('Y-m-d H:i:s.v');

$isSingleParent = cleanBool($data['isSingleParent'] ?? null) ?? 0;

$row = [
    'id'                     => $id,
    'submissionUuid'         => $submissionUuid,
    'trackingNumber'         => $trackingNumber,
    'formKind'               => $formKind,
    'type'                   => $legacyType,
    'cohortYear'             => $cohortYear,
    'status'                 => 'vigente',
    'isArchived'             => 0,
    'validationRulesVersion' => $isPre ? '2027.pre.v2' : '2027.re.v2',

    'studentName'            => $studentName,
    'studentDni'             => $studentDni,
    'studentGender'          => cleanStr($data['studentGender'] ?? null, 20),
    'studentBirthDate'       => cleanDate($data['studentBirthDate'] ?? null),
    'studentNationality'     => cleanStr($data['studentNationality'] ?? null, 60),
    'studentBirthPlace'      => cleanStr($data['studentBirthPlace'] ?? null, 100),
    'school'                 => cleanStr($data['school'] ?? 'Escuela N.º 1030', 100),
    'studentLevel'           => cleanStr($data['studentLevel'] ?? null, 50),
    'studentGrade'           => $studentGrade,

    'parent1Name'            => cleanStr($data['parent1Name'] ?? ($data['tutorName'] ?? null)),
    'parent1Dni'             => cleanDigits($data['parent1Dni'] ?? null),
    'parent1Relationship'    => cleanStr($data['parent1Relationship'] ?? null, 100),
    'parent1Phone'           => cleanStr($data['parent1Phone'] ?? ($data['tutorPhone'] ?? null), 50),
    'parent1Email'           => cleanStr($data['parent1Email'] ?? ($data['tutorEmail'] ?? null), 191),
    'parent1Address'         => cleanStr($data['parent1Address'] ?? null, 255),
    'parent1City'            => cleanStr($data['parent1City'] ?? 'Esquel', 100),
    'parent1PostalCode'      => cleanStr($data['parent1PostalCode'] ?? '9200', 50),
    'parent1Occupation'      => cleanStr($data['parent1Occupation'] ?? null),

    'isSingleParent'         => $isSingleParent,
    'parent2Name'            => $isSingleParent ? null : cleanStr($data['parent2Name'] ?? null),
    'parent2Dni'             => $isSingleParent ? null : cleanDigits($data['parent2Dni'] ?? null),
    'parent2Relationship'    => $isSingleParent ? null : cleanStr($data['parent2Relationship'] ?? null, 100),
    'parent2Phone'           => $isSingleParent ? null : cleanStr($data['parent2Phone'] ?? null, 50),
    'parent2Email'           => $isSingleParent ? null : cleanStr($data['parent2Email'] ?? null, 191),
    'parent2Occupation'      => $isSingleParent ? null : cleanStr($data['parent2Occupation'] ?? null),

    'comments'               => cleanStr($data['comments'] ?? null, 1000),
    'sourceIp'               => $clientIp,
    'userAgent'              => cleanStr($_SERVER['HTTP_USER_AGENT'] ?? null, 255),
    'createdAt'              => $now,
    'updatedAt'              => $now,
];

if ($isPre) {
    $row += [
        'currentSchool'             => cleanStr($data['currentSchool'] ?? null),
        'currentSchoolType'         => in_array($data['currentSchoolType'] ?? '', ['publica', 'privada', 'otra'], true)
                                        ? $data['currentSchoolType'] : 'publica',
        'hasDebtClearance'          => cleanBool($data['hasDebtClearance'] ?? null) ?? 0,
        'hasRepeated'               => cleanBool($data['hasRepeated'] ?? null) ?? 0,
        'repeatedGrade'             => cleanStr($data['repeatedGrade'] ?? null, 60),
        'pendingSubjects'           => cleanStr($data['pendingSubjects'] ?? null, 500),

        'isStaffChild'              => cleanBool($data['isStaffChild'] ?? null) ?? 0,
        'staffMemberName'           => cleanStr($data['staffMemberName'] ?? null),
        'staffMemberDni'            => cleanDigits($data['staffMemberDni'] ?? null),
        'hasSiblingInSchool'        => cleanBool($data['hasSiblingInSchool'] ?? null) ?? 0,
        'siblingDni'                => cleanDigits($data['siblingDni'] ?? null),
        'siblingCurrentGrade'       => cleanStr($data['siblingCurrentGrade'] ?? null),
        'priorityVerified'          => 0,

        'englishAccreditationType'  => cleanStr($data['englishAccreditationType'] ?? 'ninguno', 30),
        'englishInstituteName'      => cleanStr($data['englishInstituteName'] ?? null),
        'englishLevelAchieved'      => cleanStr($data['englishLevelAchieved'] ?? null, 100),

        'emergencyContactName'      => cleanStr($data['emergencyContactName'] ?? null),
        'emergencyContactPhone'     => cleanStr($data['emergencyContactPhone'] ?? null, 50),
        'legalCustodyInfo'          => cleanStr($data['legalCustodyInfo'] ?? null, 255),
        'authorizedPickups'         => cleanStr($data['authorizedPickups'] ?? null, 255),
        'healthDisabilities'        => cleanStr($data['healthDisabilities'] ?? null, 500),
        'healthAllergiesMedication' => cleanStr($data['healthAllergiesMedication'] ?? null, 500),

        'interviewSlotId'           => !empty($data['interviewSlotId']) ? (int) $data['interviewSlotId'] : null,
        'admissionStatus'           => 'recibida',
    ];
} else {
    $p1Name    = $row['parent1Name'];
    $p1Dni     = $row['parent1Dni'];
    $p1Email   = $row['parent1Email'];
    $p1Address = $row['parent1Address'];

    $row += [
        'hasSiblings'         => cleanBool($data['hasSiblings'] ?? null) ?? 0,
        'siblingDetails'      => cleanStr($data['siblingDetails'] ?? null, 500),

        'parent2Address'      => $isSingleParent ? null : cleanStr($data['parent2Address'] ?? null, 255),
        'parent2City'         => $isSingleParent ? null : cleanStr($data['parent2City'] ?? 'Esquel', 100),
        'parent2PostalCode'   => $isSingleParent ? null : cleanStr($data['parent2PostalCode'] ?? '9200', 50),

        'billingName'         => cleanStr($data['billingName'] ?? null) ?? $p1Name,
        'billingCuit'         => cleanDigits($data['billingCuit'] ?? null) ?? $p1Dni,
        'billingTaxCondition' => cleanStr($data['billingTaxCondition'] ?? 'Consumidor Final', 100),
        'billingEmail'        => cleanStr($data['billingEmail'] ?? null, 191) ?? $p1Email,
        'billingAddress'      => cleanStr($data['billingAddress'] ?? null, 255) ?? $p1Address,

        'contractAccepted'    => 1,
        'dataAccepted'        => 1,
        'termsAccepted'       => 1,
        'termsVersion'        => cleanStr($data['termsVersion'] ?? '2027.v1', 30),

        // Sin cleanStr: son data URLs base64, cualquier "limpieza" las destruye.
        'signature1Data'      => is_string($data['signature1Data'] ?? null) ? $data['signature1Data'] : null,
        'signature2Data'      => (!$isSingleParent && is_string($data['signature2Data'] ?? null)) ? $data['signature2Data'] : null,
    ];
}

/* ══════════════════════════════════════════════════════════════════════════
   7. Persistencia en MySQL — INSERT inmune a columnas faltantes
   ══════════════════════════════════════════════════════════════════════════ */

$persistence = 'json_only';
$dbError     = null;
$slotTaken   = false;

if ($pdo) {
    try {
        $pdo->beginTransaction();

        // Reserva de cupo: atómica, sin SELECT FOR UPDATE previo.
        $slotId = $row['interviewSlotId'] ?? null;
        if ($isPre && $slotId) {
            $up = $pdo->prepare(
                "UPDATE `InterviewSlot` SET `booked` = `booked` + 1
                 WHERE `id` = :id AND `isActive` = 1 AND `booked` < `capacity`"
            );
            $up->execute([':id' => $slotId]);
            if ($up->rowCount() === 0) {
                $row['interviewSlotId'] = null;   // se acepta el trámite sin turno
                $row['comments'] = trim((string) $row['comments'] . ' [Turno solicitado sin cupo — reasignar]');
            } else {
                $slotTaken = true;
            }
        }

        // Reinscripción: la anterior del mismo alumno deja de ser la vigente.
        if (!$isPre && $studentDni) {
            $pdo->prepare(
                "UPDATE `Enrollment` SET `status` = 'reemplazado', `updatedAt` = NOW(3)
                 WHERE `studentDni` = :dni AND `cohortYear` = :c
                   AND `formKind` = 'reinscripcion' AND `status` = 'vigente'"
            )->execute([':dni' => $studentDni, ':c' => $cohortYear]);
        }

        // ── EL FIX CENTRAL ───────────────────────────────────────────────
        // Solo se insertan las columnas que existen de verdad. Si el esquema
        // quedó desfasado, se pierde ESE campo, no el trámite completo.
        $existing = enrollmentExistingColumns($pdo);
        $insert   = array_intersect_key($row, $existing);

        if (count($insert) < count($row)) {
            error_log('[ENROLL] Columnas ausentes en Enrollment: '
                . implode(', ', array_keys(array_diff_key($row, $existing))));
        }

        $cols   = array_keys($insert);
        $sql    = 'INSERT INTO `Enrollment` (`' . implode('`, `', $cols) . '`) VALUES ('
                . implode(', ', array_map(static fn($c) => ':' . $c, $cols)) . ')';
        $params = [];
        foreach ($insert as $k => $v) { $params[':' . $k] = $v; }

        $pdo->prepare($sql)->execute($params);
        $pdo->commit();
        $persistence = 'mysql';

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) { $pdo->rollBack(); }   // ← libera el cupo también
        $slotTaken = false;
        $dbError   = $e->getMessage();
        error_log('[ENROLL][DB_FAIL] ' . $formKind . ' :: ' . $dbError);
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   8. Respaldo JSON — siempre, sin firmas
   ══════════════════════════════════════════════════════════════════════════ */

$jsonRecord = $row;
$jsonRecord['signature1Data'] = !empty($row['signature1Data']) ? '[stored]' : null;
$jsonRecord['signature2Data'] = !empty($row['signature2Data']) ? '[stored]' : null;
$jsonRecord['_persistence']   = $persistence;
$jsonRecord['_dbFailed']      = ($persistence !== 'mysql');
if (!empty($data['_outOfWindow'])) { $jsonRecord['_outOfWindow'] = true; }

$enrollFile = FEE_DATA_DIR . '/enrollments.json';
$all = readJsonFile($enrollFile);
if (!$isPre && $studentDni) {
    foreach ($all as &$r) {
        if (($r['studentDni'] ?? null) === $studentDni
            && ($r['formKind'] ?? '') === 'reinscripcion'
            && (int) ($r['cohortYear'] ?? 0) === $cohortYear) {
            $r['status'] = 'reemplazado';
        }
    }
    unset($r);
}
$all[] = $jsonRecord;
atomicJsonWrite($enrollFile, $all);

if ($isPre) {
    $preFile = FEE_DATA_DIR . '/preinscripciones.json';
    $pre = readJsonFile($preFile);
    $pre[] = $jsonRecord;
    atomicJsonWrite($preFile, $pre);
}

if (function_exists('syncToGoogleSheets')) {
    try {
        syncToGoogleSheets([
            'id' => $id, 'trackingNumber' => $trackingNumber, 'formKind' => $formKind,
            'cohort' => $cohortYear, 'studentName' => $studentName, 'studentDni' => $studentDni,
            'school' => $row['school'], 'studentGrade' => $studentGrade,
            'parent1Name' => $row['parent1Name'], 'parent1Phone' => $row['parent1Phone'],
            'parent1Email' => $row['parent1Email'], 'createdAt' => $now,
        ]);
    } catch (Throwable $e) {
        error_log('[ENROLL] Sync a Sheets falló (no bloqueante): ' . $e->getMessage());
    }
}

/* ══════════════════════════════════════════════════════════════════════════
   9. Respuesta
   ══════════════════════════════════════════════════════════════════════════ */

respond(200, [
    'success'        => true,
    'id'             => $id,
    'trackingNumber' => $trackingNumber,
    'formKind'       => $formKind,
    'type'           => $legacyType,
    'cohortYear'     => $cohortYear,
    'interviewSlot'  => $slotTaken ? (int) $row['interviewSlotId'] : null,
    // El frontend no lo muestra, pero queda en la respuesta para diagnóstico.
    'persistence'    => $persistence,
    'message'        => $isPre
        ? 'Preinscripción registrada. Guardá tu número de trámite.'
        : 'Reinscripción registrada. Guardá tu número de trámite.',
]);
