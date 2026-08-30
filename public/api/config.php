<?php
declare(strict_types=1);

/* ═══════════════════════════════════════════════════════════════
Buffer de salida: ningún warning suelto puede romper el JSON.
═══════════════════════════════════════════════════════════════ */
ob_start();

/* ── Errores: NUNCA visibles al cliente, SIEMPRE registrados en log ── */
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
if (!is_dir(__DIR__ . '/logs')) {
    @mkdir(__DIR__ . '/logs', 0750, true);
}
ini_set('error_log', __DIR__ . '/logs/php-error.log');

date_default_timezone_set('America/Argentina/Buenos_Aires');

/* ═══════════════════════════════════════════════════════════════
Configuración de Base de Datos y Secretos
═══════════════════════════════════════════════════════════════ */
$envFile = __DIR__ . '/env.php';
$env = is_readable($envFile) ? (require $envFile) : [];

if (!defined('DB_HOST'))    define('DB_HOST',    $env['DB_HOST']    ?? 'localhost');
if (!defined('DB_NAME'))    define('DB_NAME',    $env['DB_NAME']    ?? 'u769174130_escueladb');
if (!defined('DB_USER'))    define('DB_USER',    $env['DB_USER']    ?? 'u769174130_admin');
if (!defined('DB_PASS'))    define('DB_PASS',    $env['DB_PASS']    ?? 'FEE_Esquel_2026$Patagonia');
if (!defined('JWT_SECRET')) define('JWT_SECRET', $env['JWT_SECRET'] ?? 'c0f8e9a2b4d6f8a0c2e4f6a8b0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8');

if (!defined('GOOGLE_SHEET_WEBHOOK_URL')) {
    define('GOOGLE_SHEET_WEBHOOK_URL', $env['GOOGLE_SHEET_WEBHOOK_URL'] ?? 'https://script.google.com/macros/s/AKfycbzfxI_lQ910slPUVyc-scTPr96Jam8jQzHmFTWbCaa6guGpnVb5JUm4oN38h8PgkBsk/exec');
}

/* ═══════════════════════════════════════════════════════════════
Respuesta JSON única y a prueba de basura previa
═══════════════════════════════════════════════════════════════ */
function jsonResponse(int $status, array $payload): void {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('X-Content-Type-Options: nosniff');
    }

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($json === false) {
        error_log('[JSON_ENCODE_ERROR] ' . json_last_error_msg());
        array_walk_recursive($payload, function(&$item) {
            if (is_string($item)) {
                $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
            }
        });
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) {
            $json = json_encode(['success' => false, 'error' => 'Error de serialización JSON en servidor: ' . json_last_error_msg()]);
        }
    }
    echo $json;
    exit;
}

/* ── Todo fatal o excepción sale como JSON, no como cuerpo vacío ── */
set_exception_handler(static function (Throwable $t): void {
    error_log('[UNCAUGHT] ' . $t->getMessage() . ' @ ' . $t->getFile() . ':' . $t->getLine());
    jsonResponse(500, ['success' => false, 'error' => 'Error interno del servidor.']);
});

register_shutdown_function(static function (): void {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log('[FATAL] ' . $e['message'] . ' @ ' . $e['file'] . ':' . $e['line']);
        if (!headers_sent()) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Error interno del servidor: ' . $e['message']]);
        }
    }
});

/* ═══════════════════════════════════════════════════════════════
PDO: conexión única, timeout corto, sin bucles de reintentos
═══════════════════════════════════════════════════════════════ */
function getPDO(): ?PDO {
    static $pdo = null;
    static $tried = false;

    if ($pdo instanceof PDO) return $pdo;
    if ($tried) return null;
    $tried = true;

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 3, // Evita spinners infinitos
            ]
        );
        $pdo->exec("SET time_zone = '-03:00'");
        return $pdo;
    } catch (PDOException $e) {
        error_log('[DB] Connect failed: ' . $e->getMessage());
        $pdo = null;
        return null;
    }
}

function getDatabaseConnection(): ?PDO {
    return getPDO();
}

function ensureUserTableSchema($pdo) {
    if (!$pdo) return false;
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `User` (
                `id` VARCHAR(191) PRIMARY KEY,
                `username` VARCHAR(191) UNIQUE NOT NULL,
                `email` VARCHAR(191) UNIQUE NOT NULL,
                `password` VARCHAR(255) NOT NULL,
                `name` VARCHAR(191) NOT NULL,
                `role` VARCHAR(50) DEFAULT 'EDITOR',
                `permissions` TEXT NULL,
                `mustChangePassword` TINYINT(1) DEFAULT 0,
                `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Verificar si la tabla está vacía o si falta el admin principal
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `User`")->fetchColumn();
        if ($count === 0) {
            // Sembrar admin inicial
            $adminPass = password_hash('FEE_Esquel_2026$Patagonia', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("
                INSERT INTO `User` (`id`, `username`, `email`, `password`, `name`, `role`, `permissions`, `mustChangePassword`, `createdAt`, `updatedAt`)
                VALUES ('fee-super-admin-01', 'admin', 'admin@fundacionesquel.edu.ar', :pass, 'Administrador FEE', 'SUPER_ADMIN', 'blog,contacts,enrollments,users,gallery', 0, NOW(3), NOW(3))
                ON DUPLICATE KEY UPDATE `username` = 'admin'
            ");
            $stmt->execute([':pass' => $adminPass]);

            // Sembrar usuarios desde users.json si existen
            $usersFile = __DIR__ . '/data/users.json';
            if (file_exists($usersFile)) {
                $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
                foreach ($localUsers as $lu) {
                    if (($lu['username'] ?? '') === 'admin') continue;
                    $stmtUser = $pdo->prepare("
                        INSERT INTO `User` (`id`, `username`, `email`, `password`, `name`, `role`, `permissions`, `mustChangePassword`, `createdAt`, `updatedAt`)
                        VALUES (:id, :username, :email, :password, :name, :role, :permissions, :mustChange, NOW(3), NOW(3))
                        ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`), `permissions` = VALUES(`permissions`)
                    ");
                    $stmtUser->execute([
                        ':id'          => $lu['id'] ?? generateUUID(),
                        ':username'    => $lu['username'] ?? 'usuario',
                        ':email'       => $lu['email'] ?? ($lu['username'] . '@fee.local'),
                        ':password'    => $lu['password'] ?? password_hash('FEE_Esquel_2026', PASSWORD_DEFAULT),
                        ':name'        => $lu['name'] ?? $lu['username'],
                        ':role'        => $lu['role'] ?? 'EDITOR',
                        ':permissions' => $lu['permissions'] ?? 'blog,enrollments,contacts',
                        ':mustChange'  => !empty($lu['mustChangePassword']) ? 1 : 0
                    ]);
                }
            }
        }
        return true;
    } catch (Exception $e) {
        error_log('[ENSURE_USER_SCHEMA] ' . $e->getMessage());
        return false;
    }
}
function ensureEnrollmentTableSchema($pdo) {
    if (!$pdo) return false;
    try {
        // 1. Tabla Cohort
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

        $pdo->exec("
            INSERT IGNORE INTO `Cohort` (`year`, `type`, `status`, `notes`) VALUES
            (2027, 'reinscripcion', 'abierta', 'Reinscripción Ciclo Lectivo 2027'),
            (2027, 'preinscripcion', 'abierta', 'Preinscripción Ingresantes 2027')
        ");

        // 2. Tabla InterviewSlot
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

        // 3. Tabla Enrollment
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `Enrollment` (
                `id` VARCHAR(191) PRIMARY KEY,
                `submissionUuid` CHAR(36) NULL,
                `trackingNumber` VARCHAR(100) UNIQUE NOT NULL,
                `type` VARCHAR(50) NOT NULL DEFAULT 'reinscripcion_2027',
                `cohortYear` INT NOT NULL DEFAULT 2027,
                `status` VARCHAR(50) NOT NULL DEFAULT 'vigente',
                `studentName` VARCHAR(191) NOT NULL,
                `studentDni` VARCHAR(50) NOT NULL,
                `studentGender` VARCHAR(20) NULL,
                `studentBirthDate` DATE NULL,
                `studentNationality` VARCHAR(60) NULL,
                `studentBirthPlace` VARCHAR(100) NULL,
                `school` VARCHAR(100) NOT NULL,
                `studentLevel` VARCHAR(50) NOT NULL,
                `studentGrade` VARCHAR(100) NOT NULL,
                `currentSchool` VARCHAR(191) NULL,
                `currentSchoolType` VARCHAR(50) DEFAULT 'publica',
                `hasDebtClearance` TINYINT(1) DEFAULT 0,
                `hasRepeated` TINYINT(1) DEFAULT 0,
                `repeatedGrade` VARCHAR(60) NULL,
                `pendingSubjects` TEXT NULL,
                `hasSiblings` TINYINT(1) DEFAULT 0,
                `siblingDetails` TEXT NULL,
                `isStaffChild` TINYINT(1) DEFAULT 0,
                `staffMemberName` VARCHAR(191) NULL,
                `staffMemberDni` VARCHAR(20) NULL,
                `hasSiblingInSchool` TINYINT(1) DEFAULT 0,
                `siblingDni` VARCHAR(20) NULL,
                `siblingCurrentGrade` VARCHAR(191) NULL,
                `englishAccreditationType` VARCHAR(50) DEFAULT 'ninguno',
                `englishInstituteName` VARCHAR(191) NULL,
                `englishLevelAchieved` VARCHAR(100) NULL,
                `parent1Name` VARCHAR(191) NOT NULL,
                `parent1Dni` VARCHAR(50) NOT NULL,
                `parent1Relationship` VARCHAR(100) NOT NULL,
                `parent1Occupation` VARCHAR(191) NULL,
                `parent1Phone` VARCHAR(50) NOT NULL,
                `parent1Email` VARCHAR(191) NOT NULL,
                `parent1Address` VARCHAR(255) NOT NULL,
                `parent1City` VARCHAR(100) NOT NULL,
                `parent1PostalCode` VARCHAR(50) NOT NULL,
                `isSingleParent` TINYINT(1) DEFAULT 0,
                `parent2Name` VARCHAR(191) NULL,
                `parent2Dni` VARCHAR(50) NULL,
                `parent2Relationship` VARCHAR(100) NULL,
                `parent2Occupation` VARCHAR(191) NULL,
                `parent2Phone` VARCHAR(50) NULL,
                `parent2Email` VARCHAR(191) NULL,
                `parent2Address` VARCHAR(255) NULL,
                `parent2City` VARCHAR(100) NULL,
                `parent2PostalCode` VARCHAR(50) NULL,
                `billingName` VARCHAR(191) NULL,
                `billingCuit` VARCHAR(50) NULL,
                `billingTaxCondition` VARCHAR(100) NULL,
                `billingEmail` VARCHAR(191) NULL,
                `billingAddress` VARCHAR(255) NULL,
                `signature1Data` LONGTEXT NULL,
                `signature2Data` LONGTEXT NULL,
                `emergencyContactName` VARCHAR(191) NULL,
                `emergencyContactPhone` VARCHAR(50) NULL,
                `legalCustodyInfo` TEXT NULL,
                `authorizedPickups` TEXT NULL,
                `healthDisabilities` TEXT NULL,
                `healthAllergiesMedication` TEXT NULL,
                `interviewSlotId` INT NULL,
                `termsVersion` VARCHAR(20) DEFAULT '2027.1',
                `admissionStatus` VARCHAR(50) NOT NULL DEFAULT 'recibida',
                `priorityVerified` TINYINT(1) NOT NULL DEFAULT 0,
                `admissionNotes` TEXT NULL,
                `decidedBy` VARCHAR(100) NULL,
                `decidedAt` DATETIME(3) NULL,
                `isArchived` TINYINT(1) DEFAULT 0,
                `comments` TEXT NULL,
                `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                INDEX `idx_enr_dni` (`studentDni`),
                INDEX `idx_enr_cohort` (`cohortYear`, `type`),
                INDEX `idx_enr_status` (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Si la tabla ya existía, agregar columnas faltantes de forma segura
        $columns = [
            'submissionUuid'            => 'CHAR(36) NULL',
            'cohortYear'                => 'INT NOT NULL DEFAULT 2027',
            'status'                    => 'VARCHAR(50) NOT NULL DEFAULT \'vigente\'',
            'studentGender'             => 'VARCHAR(20) NULL',
            'studentBirthDate'          => 'DATE NULL',
            'studentNationality'        => 'VARCHAR(60) NULL',
            'studentBirthPlace'         => 'VARCHAR(100) NULL',
            'currentSchool'             => 'VARCHAR(191) NULL',
            'currentSchoolType'         => 'VARCHAR(50) DEFAULT \'publica\'',
            'hasDebtClearance'          => 'TINYINT(1) DEFAULT 0',
            'hasRepeated'               => 'TINYINT(1) DEFAULT 0',
            'repeatedGrade'             => 'VARCHAR(60) NULL',
            'pendingSubjects'           => 'TEXT NULL',
            'isStaffChild'              => 'TINYINT(1) DEFAULT 0',
            'staffMemberName'           => 'VARCHAR(191) NULL',
            'staffMemberDni'            => 'VARCHAR(20) NULL',
            'hasSiblingInSchool'        => 'TINYINT(1) DEFAULT 0',
            'siblingDni'                => 'VARCHAR(20) NULL',
            'siblingCurrentGrade'       => 'VARCHAR(191) NULL',
            'englishAccreditationType'  => 'VARCHAR(50) DEFAULT \'ninguno\'',
            'englishInstituteName'      => 'VARCHAR(191) NULL',
            'englishLevelAchieved'      => 'VARCHAR(100) NULL',
            'parent1Occupation'         => 'VARCHAR(191) NULL',
            'parent2Occupation'         => 'VARCHAR(191) NULL',
            'emergencyContactName'      => 'VARCHAR(191) NULL',
            'emergencyContactPhone'     => 'VARCHAR(50) NULL',
            'legalCustodyInfo'          => 'TEXT NULL',
            'authorizedPickups'         => 'TEXT NULL',
            'healthDisabilities'        => 'TEXT NULL',
            'healthAllergiesMedication' => 'TEXT NULL',
            'interviewSlotId'           => 'INT NULL',
            'termsVersion'              => 'VARCHAR(20) DEFAULT \'2027.1\'',
            'admissionStatus'           => 'VARCHAR(50) NOT NULL DEFAULT \'recibida\'',
            'priorityVerified'          => 'TINYINT(1) NOT NULL DEFAULT 0',
            'admissionNotes'            => 'TEXT NULL',
            'decidedBy'                 => 'VARCHAR(100) NULL',
            'decidedAt'                 => 'DATETIME(3) NULL',
            'isArchived'                => 'TINYINT(1) DEFAULT 0'
        ];

        foreach ($columns as $col => $type) {
            try {
                $pdo->exec("ALTER TABLE `Enrollment` ADD COLUMN `$col` $type");
            } catch (Exception $e) {
                // Columna ya existe
            }
        }

        return true;
    } catch (Exception $e) {
        error_log('[ENSURE_ENROLLMENT_SCHEMA] ' . $e->getMessage());
        return false;
    }
}

/* ═══════════════════════════════════════════════════════════════
JWT — base64url real (RFC 7515)
═══════════════════════════════════════════════════════════════ */
function b64uEncode(string $bin): string {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function b64uDecode(string $txt): string {
    $rem = strlen($txt) % 4;
    if ($rem) {
        $txt .= str_repeat('=', 4 - $rem);
    }
    $out = base64_decode(strtr($txt, '-_', '+/'), true);
    return $out === false ? '' : $out;
}

function generateToken(array $payload): string {
    $now = time();
    $payload += ['iat' => $now, 'nbf' => $now];
    $h = b64uEncode((string) json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $b = b64uEncode((string) json_encode($payload, JSON_UNESCAPED_UNICODE));
    $s = b64uEncode(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
    return "$h.$b.$s";
}

/**
 * @return array<string,mixed>|false
 */
function verifyToken(?string $token) {
    if (!is_string($token) || $token === '') return false;
    if (strlen(JWT_SECRET) < 32) {
        error_log('[JWT] JWT_SECRET ausente o demasiado corto.');
        return false;
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$h, $b, $s] = $parts;

    $expected = b64uEncode(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return false;

    $header = json_decode(b64uDecode($h), true);
    if (!is_array($header) || ($header['alg'] ?? '') !== 'HS256') return false;

    $payload = json_decode(b64uDecode($b), true);
    if (!is_array($payload)) return false;

    $leeway = 60;
    if (isset($payload['nbf']) && (int) $payload['nbf'] > (time() + $leeway)) return false;
    if (isset($payload['exp']) && (int) $payload['exp'] < (time() - $leeway)) return false;

    return $payload;
}

function verifyJwtToken($token) {
    return verifyToken($token);
}

/* ═══════════════════════════════════════════════════════════════
Headers y Extracción de Token Resiliente
═══════════════════════════════════════════════════════════════ */
function getRequestHeaders(): array {
    $out = [];
    if (function_exists('getallheaders')) {
        foreach ((array) getallheaders() as $k => $v) {
            $out[strtolower((string) $k)] = $v;
        }
    }
    foreach ($_SERVER as $k => $v) {
        if (strncmp($k, 'HTTP_', 5) === 0) {
            $out[strtolower(str_replace('_', '-', substr($k, 5)))] = $v;
        }
    }
    return $out;
}

function getBearerToken(): ?string {
    $h = getRequestHeaders();
    $candidates = [
        $h['authorization'] ?? null,
        $h['x-authorization'] ?? null,
        $_SERVER['HTTP_AUTHORIZATION'] ?? null,
        $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
        $_SERVER['HTTP_X_AUTHORIZATION'] ?? null,
        $_SERVER['REDIRECT_HTTP_X_AUTHORIZATION'] ?? null,
    ];

    foreach ($candidates as $raw) {
        if (is_string($raw) && $raw !== ''
            && preg_match('/Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/i', $raw, $m)) {
            return $m[1];
        }
    }

    if (!empty($_COOKIE['admin_session'])) {
        return (string) $_COOKIE['admin_session'];
    }
    return null;
}

/**
 * Guardia de autenticación para endpoints protegidos
 */
function requireAuth(array $allowedRoles = []): array {
    $payload = verifyToken(getBearerToken());
    if ($payload === false) {
        jsonResponse(401, ['success' => false, 'error' => 'Sesión expirada o inválida.']);
    }
    if ($allowedRoles && !in_array((string) ($payload['role'] ?? ''), $allowedRoles, true)) {
        jsonResponse(403, ['success' => false, 'error' => 'No tenés permisos para esta acción.']);
    }
    return $payload;
}

function setSessionCookie(string $token, int $ttl = 86400): void {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') == 443)
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    setcookie('admin_session', $token, [
        'expires'  => time() + $ttl,
        'path'     => '/',
        'httponly' => true,
        'secure'   => $secure,
        'samesite' => 'Lax',
    ]);
}

function clearSessionCookie(): void {
    setcookie('admin_session', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

/* ═══════════════════════════════════════════════════════════════
Gestión de Tokens CSRF
═══════════════════════════════════════════════════════════════ */
function generateCsrfToken(): string {
    $token = bin2hex(random_bytes(32));
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443);
    setcookie('fee_csrf', $token, [
        'expires'  => time() + 86400,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => false,
        'samesite' => 'Lax'
    ]);
    return $token;
}

function verifyCsrfToken(): bool {
    $cookieToken = $_COOKIE['fee_csrf'] ?? '';
    $headers = getRequestHeaders();
    $headerToken = $headers['x-csrf-token'] ?? '';
    if (empty($cookieToken) || empty($headerToken)) {
        return false;
    }
    return hash_equals($cookieToken, $headerToken);
}

function requireCsrfToken(): void {
    if (!verifyCsrfToken()) {
        jsonResponse(403, ['success' => false, 'error' => 'Token de seguridad CSRF inválido o ausente.']);
    }
}

function generateUUID(): string {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function syncToGoogleSheets($payload): bool {
    $url = defined('GOOGLE_SHEET_WEBHOOK_URL') ? GOOGLE_SHEET_WEBHOOK_URL : '';
    if (empty($url)) return false;

    $jsonData = json_encode($payload, JSON_UNESCAPED_UNICODE);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 4);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($jsonData)
    ]);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    return empty($err);
}
