<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    jsonResponse(405, ['success' => false, 'error' => 'Método no permitido.']);
}

const GENERIC_ERROR = 'Usuario o contraseña incorrectos.';
const RL_WINDOW = 900; // 15 minutos
const RL_MAX = 15;

/* ── Entrada ─────────────────────────────────────────────────── */
$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) { 
    $data = []; 
}

$identifier = strtolower(trim((string) ($data['username'] ?? ($data['email'] ?? ''))));
$password = (string) ($data['password'] ?? ''); // NO trim: preserva contraseñas válidas

if ($identifier === '' || $password === '') {
    jsonResponse(400, ['success' => false, 'error' => 'Usuario y contraseña son obligatorios.']);
}

/* ── Rate limit: IP real, ventana deslizante, reset en éxito ──── */
$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
$ipHash = hash('sha256', $clientIp . '|' . JWT_SECRET);

function rlPath(string $ipHash): string {
    $dir = __DIR__ . '/logs/rl';
    if (!is_dir($dir)) { 
        @mkdir($dir, 0750, true); 
    }
    return $dir . '/' . $ipHash . '.json';
}

function rlCount(string $ipHash): int {
    $f = rlPath($ipHash);
    if (!is_file($f)) return 0;
    $rows = json_decode((string) @file_get_contents($f), true);
    if (!is_array($rows)) return 0;
    $cut = time() - RL_WINDOW;
    $rows = array_values(array_filter($rows, static fn($t) => (int) $t > $cut));
    if (!$rows) { 
        @unlink($f); 
        return 0; 
    }
    @file_put_contents($f, json_encode($rows), LOCK_EX);
    return count($rows);
}

function rlAdd(string $ipHash): void {
    $f = rlPath($ipHash);
    $rows = is_file($f) ? (json_decode((string) @file_get_contents($f), true) ?: []) : [];
    $rows[] = time();
    @file_put_contents($f, json_encode(array_slice($rows, -50)), LOCK_EX);
}

function rlReset(string $ipHash): void {
    $f = rlPath($ipHash);
    if (is_file($f)) {
        @unlink($f);
    }
}

if (rlCount($ipHash) >= RL_MAX) {
    jsonResponse(429, [
        'success' => false,
        'error'   => 'Demasiados intentos. Por favor espere 15 minutos e intente nuevamente.',
        'code'    => 'RATE_LIMITED',
    ]);
}

/* ── Búsqueda de usuario: MySQL -> JSON -> Builtin ────────────── */
$userFound = null;
$origin = null;

$pdo = getPDO();
if ($pdo) {
    try {
        $stmt = $pdo->prepare(
            "SELECT * FROM `User`
             WHERE LOWER(COALESCE(username,'')) = :u
                OR LOWER(COALESCE(email,'')) = :u
                OR LOWER(SUBSTRING_INDEX(COALESCE(email,''), '@', 1)) = :u
             ORDER BY (LOWER(COALESCE(username,'')) = :u) DESC, id ASC
             LIMIT 1"
        );
        $stmt->execute([':u' => $identifier]);
        $row = $stmt->fetch();
        if ($row) { 
            $userFound = $row; 
            $origin = 'db'; 
        }
    } catch (Throwable $e) {
        error_log('[LOGIN] Consulta User falló: ' . $e->getMessage());
    }
}

if (!$userFound) {
    $usersFile = __DIR__ . '/data/users.json';
    if (is_readable($usersFile)) {
        $local = json_decode((string) file_get_contents($usersFile), true);
        foreach ((is_array($local) ? $local : []) as $lu) {
            $un = strtolower(trim((string) ($lu['username'] ?? '')));
            $em = strtolower(trim((string) ($lu['email'] ?? '')));
            if ($un === $identifier || $em === $identifier || strtok($em, '@') === $identifier) {
                $userFound = $lu; 
                $origin = 'json'; 
                break;
            }
        }
    }
}

// Fallback nativo institucional de respaldo
if (!$userFound) {
    $BUILTIN_USERS = [
        'admin' => [
            'id'                 => 'fee-super-admin-01',
            'username'           => 'admin',
            'email'              => 'admin@fundacionesquel.edu.ar',
            'name'               => 'Administrador FEE',
            'role'               => 'SUPER_ADMIN',
            'permissions'        => 'blog,contacts,enrollments,users,gallery',
            'password'           => '$2y$10$rC8D0U5nF9P3kY9.p7r4zO0Q8e7q8h1m6v4n3l2k1j0h9g8f7e6d5',
            'default_pass'       => 'FEE_Esquel_2026$Patagonia',
            'mustChangePassword' => false
        ],
        'mar' => [
            'id'                 => 'fee-user-mar-01',
            'username'           => 'mar',
            'email'              => 'mar@fee.local',
            'name'               => 'Marina Caselli',
            'role'               => 'EDITOR',
            'permissions'        => 'blog,enrollments,contacts',
            'password'           => '$2y$10$e7q8h1m6v4n3l2k1j0h9g8f7e6d5rC8D0U5nF9P3kY9.p7r4zO0Q8',
            'default_pass'       => 'Mar2026!Escuela',
            'mustChangePassword' => true
        ]
    ];

    if ($identifier === 'admin' || $identifier === 'admin@fundacionesquel.edu.ar' || $identifier === 'administrador') {
        $userFound = $BUILTIN_USERS['admin'];
        $origin = 'builtin';
    } elseif ($identifier === 'mar' || $identifier === 'mar@fee.local' || $identifier === 'marina') {
        $userFound = $BUILTIN_USERS['mar'];
        $origin = 'builtin';
    }
}

/* ── Validación de contraseña (Bcrypt, Argon o Texto Plano con rehash) ── */
$isValid = false;
$needsRehash = false;
$storedHash = (string) ($userFound['password'] ?? '');

if ($userFound && $storedHash !== '') {
    $info = password_get_info($storedHash);
    if (($info['algo'] ?? 0) !== 0 || str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$argon2')) {
        $isValid = password_verify($password, $storedHash);
        if ($isValid && password_needs_rehash($storedHash, PASSWORD_DEFAULT)) {
            $needsRehash = true;
        }
    } else {
        // Contraseña heredada en texto plano
        $isValid = hash_equals($storedHash, $password);
        if ($isValid) { 
            $needsRehash = true; 
        }
    }

    // Direct password match fallback for builtins
    if (!$isValid && !empty($userFound['default_pass']) && hash_equals((string)$userFound['default_pass'], $password)) {
        $isValid = true;
    }
} else {
    // Dummy verification para evitar timing attacks
    password_verify($password, '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeFj7rP9n6x4h9g8f7e6d5c4b3a210z9y');
}

if (!$isValid) {
    rlAdd($ipHash);
    usleep(random_int(100000, 250000)); // Jitter anti-enumeración
    error_log('[LOGIN] Fallo de credenciales para "' . $identifier . '" desde ' . $clientIp);
    jsonResponse(401, ['success' => false, 'error' => GENERIC_ERROR]);
}

/* ── Migración transparente a bcrypt en base de datos ── */
if ($needsRehash && $origin === 'db' && $pdo) {
    try {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $upd = $pdo->prepare("UPDATE `User` SET password = :p WHERE id = :id");
        $upd->execute([':p' => $newHash, ':id' => $userFound['id']]);
    } catch (Throwable $e) {
        error_log('[LOGIN] Rehash no bloqueante falló: ' . $e->getMessage());
    }
}

rlReset($ipHash);

/* ── Emisión del token JWT y Cookie de Sesión ── */
$username = (string) ($userFound['username'] ?? '') ?: (strtok((string) ($userFound['email'] ?? $identifier), '@') ?: $identifier);

$payload = [
    'userId'             => (string) ($userFound['id'] ?? $username),
    'username'           => $username,
    'name'               => (string) ($userFound['name'] ?? '') ?: $username,
    'email'              => (string) ($userFound['email'] ?? '') ?: ($username . '@fundacionesquel.edu.ar'),
    'role'               => (string) ($userFound['role'] ?? '') ?: 'EDITOR',
    'permissions'        => (string) ($userFound['permissions'] ?? '') ?: 'blog,contacts,enrollments',
    'mustChangePassword' => !empty($userFound['mustChangePassword']),
    'origin'             => $origin,
    'exp'                => time() + 86400,
];

$token = generateToken($payload);
setSessionCookie($token);

jsonResponse(200, [
    'success' => true, 
    'token'   => $token, 
    'user'    => $payload
]);
