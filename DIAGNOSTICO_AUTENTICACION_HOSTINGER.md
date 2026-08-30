# INFORME TÉCNICO: DIAGNÓSTICO DEL SISTEMA DE AUTENTICACIÓN Y ACCESO AL PANEL ADMINISTRATIVO (FEE WEB)

**Proyecto:** Fundación Educativa Esquel — Intranet / Panel Administrativo  
**Entorno de Producción:** Hostinger (Apache 2.4 + PHP 8.x + MySQL 8.0)  
**Arquitectura Frontend:** Next.js 16 (Exportación Estática `out/` servida directamente en la raíz pública `.`)  
**Arquitectura Backend:** Endpoints PHP puros en `/api/*.php` comunicándose con PDO MySQL y almacenamiento dual JSON.

---

## 1. DESCRIPCIÓN DEL PROBLEMA Y SÍNTOMAS OBSERVADOS

1. **Síntoma Inicial:**
   * El usuario intenta ingresar con su usuario y contraseña institucional habituales en `/admin`.
   * El formulario arrojaba el error: `"Unexpected end of JSON input"` en una alerta roja.
2. **Síntoma Actual (tras sanitización y ajuste de respuestas):**
   * El usuario ingresa las credenciales en `/admin` y presiona *"Ingresar"*.
   * El botón pasa a estado de carga / trabajando (*"spinner"*), pero el sistema no ingresa al Dashboard y vuelve a quedar en el formulario de login sin mostrar mensaje de error explícito, o se queda procesando indefinidamente.
3. **Requerimiento Crítico:**
   * **Todos los usuarios preexistentes en la base de datos MySQL (y en `users.json` / usuarios nativos)** deben poder autenticarse con sus contraseñas actuales sin requerir reseteos forzados.
   * Si las credenciales son erróneas, debe mostrar exclusivamente `"Usuario o contraseña incorrectos."` (sin divulgar si el usuario existe o detalles internos).
   * Si las credenciales son correctas, debe ingresar inmediatamente al Dashboard `/admin` cargando los datos.

---

## 2. MAPA DE ARCHIVOS Y FLUJO DE DATOS

```
[Usuario en /admin (Browser)]
       │
       ▼
[src/app/admin/login.tsx] -> Invoca `loginAdmin(password, email)`
       │
       ▼
[src/actions/admin.ts] -> Hace POST a `/api/login.php`
       │
       ▼
[api/login.php] ──(Verifica MySQL User / users.json / $BUILTIN_USERS)──┐
       │                                                              │
       ├─ Si Falla: Retorna HTTP 401 {"success": false, "error": "..."}│
       └─ Si Éxito: Genera JWT (HS256), setea cookie `admin_session`, ──┤
                    y retorna {"success": true, "token": "...", "user": {...}}
       │
       ▼
[src/actions/admin.ts] -> Guarda `localStorage.setItem("fee_admin_token", token)`
       │
       ▼
[src/app/admin/page.tsx] -> Ejecuta `onLoginSuccess()` -> `loadData()`
       │
       ▼
[src/actions/admin.ts] -> Invoca `getDashboardData()` -> GET `/api/admin.php?action=get_data`
       │
       ▼
[api/admin.php] -> Valida JWT con `getBearerToken()` y `verifyToken()`
       │
       ├─ Si Falla (401 / null): Retorna error -> page.tsx no autentica y resetea a LoginForm
       └─ Si Éxito (200): Retorna {"success": true, "enrollments": [...], "user": {...}}
                          -> page.tsx setea `data` y renderiza `<AdminDashboard />`
```

---

## 3. HIPÓTESIS TÉCNICAS DE CAUSA RAÍZ

### Hipótesis A: Pérdida del Header `Authorization` por FastCGI / Apache en Hostinger
* **Mecanismo:** En entornos Apache con PHP-FPM o FastCGI (típico de Hostinger), Apache suele **eliminar** el encabezado `Authorization: Bearer <token>` antes de pasarlo a PHP.
* **Consecuencia:** `getallheaders()['Authorization']` en `api/config.php` devuelve `null`. Si además la cookie `admin_session` no fue enviada por `fetch()` (por falta de `credentials: "same-origin"` o `include`), `getBearerToken()` retorna `null`, `api/admin.php` rechaza la petición con HTTP 401, y `page.tsx` no puede montar el Dashboard.
* **Puntos a verificar:**
  1. `$_SERVER['HTTP_AUTHORIZATION']` y `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']`.
  2. Uso de `credentials: "same-origin"` o `"include"` en todas las peticiones `fetch()` de `src/actions/admin.ts`.

### Hipótesis B: Desfase de Zona Horaria / Expiración Inmediata del Token JWT
* **Mecanismo:** El JWT se firma con `'exp' => time() + 86400`. En `api/config.php` se agregó `SET time_zone = '-03:00'`, pero la función `time()` de PHP trabaja en epoch timestamp UTC del sistema operativo del servidor.
* **Consecuencia:** Si hay discrepancia entre la hora del sistema en Hostinger y la comparación de expiración en `verifyToken()`, o si el string JWT contiene caracteres base64 con padding (`+`, `/`, `=`) sin codificación URL-safe (`base64url`), `hash_equals` o `explode('.', $token)` podrían fallar.

### Hipótesis C: Bloqueo de Rate-Limiting por Archivo Temporal en Servidor Compartido
* **Mecanismo:** En `api/login.php`:
  ```php
  $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
  $rateLimitFile = sys_get_temp_dir() . '/fee_login_rl_' . md5($clientIp) . '.json';
  ```
* **Consecuencia:** Si múltiples intentos fallaron durante las pruebas previas, el archivo temporal en Hostinger `/tmp/fee_login_rl_...json` quedó con `attempts >= 20`, respondiendo persistentemente HTTP 429.

### Hipótesis D: Falta de Fallback Seguro de Conexión PDO / Timeout en MySQL
* **Mecanismo:** En `api/config.php`, `getPDO()` itera sobre `[DB_HOST, 'localhost', '127.0.0.1']`. Si `DB_HOST` tarda 10-15 segundos en fallar antes de intentar `localhost`, la petición POST a `login.php` o GET a `admin.php` sufre un timeout en el navegador.

---

## 4. CÓDIGO FUENTE COMPLETO DE LOS COMPONENTES RELEVANTES

### 4.1. `api/config.php`
```php
<?php
error_reporting(0);
ini_set('display_errors', '0');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

date_default_timezone_set('America/Argentina/Buenos_Aires');

if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', 'u769174130_escueladb');
if (!defined('DB_USER')) define('DB_USER', 'u769174130_admin');
if (!defined('DB_PASS')) define('DB_PASS', 'FEE_Esquel_2026$Patagonia');
if (!defined('JWT_SECRET')) define('JWT_SECRET', 'c0f8e9a2b4d6f8a0c2e4f6a8b0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8');

function getPDO() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $hosts = [DB_HOST, 'localhost', '127.0.0.1'];
    $lastException = null;

    foreach (array_unique($hosts) as $host) {
        $dsn = "mysql:host=" . $host . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $pdo->exec("SET time_zone = '-03:00'");
            return $pdo;
        } catch (PDOException $e) {
            $lastException = $e;
        }
    }

    error_log("Database connection failed: " . ($lastException ? $lastException->getMessage() : 'unknown'));
    return null;
}

function getDatabaseConnection() {
    return getPDO();
}

function ensureUserTableSchema($pdo) { return true; }
function ensureEnrollmentTableSchema($pdo) { return true; }

// JWT Helpers
function generateToken($payload) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $body = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$signature";
}

function verifyToken($token) {
    if (!$token || strlen(JWT_SECRET) < 32) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    list($header, $body, $signature) = $parts;
    $validSignature = base64_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (hash_equals($validSignature, $signature)) {
        $payload = json_decode(base64_decode($body), true);
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        return $payload;
    }
    return false;
}

function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s(\S+)/', $_SERVER['REDIRECT_HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    if (isset($_COOKIE['admin_session'])) {
        return $_COOKIE['admin_session'];
    }
    return null;
}
```

---

### 4.2. `api/login.php`
```php
<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];

$username = strtolower(trim($data['username'] ?? ($data['email'] ?? '')));
$password = trim($data['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Usuario o contraseña requeridos."]);
    exit;
}

$BUILTIN_USERS = [
    'admin' => [
        'id'                 => 'fee-super-admin-01',
        'username'           => 'admin',
        'email'              => 'admin@fundacionesquel.edu.ar',
        'name'               => 'Administrador FEE',
        'role'               => 'SUPER_ADMIN',
        'permissions'        => 'blog,contacts,enrollments,users,gallery',
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
        'default_pass'       => 'Mar2026!Escuela',
        'mustChangePassword' => true
    ]
];

$authenticatedUser = null;
$userFound = null;

// 1. MySQL
try {
    $pdo = getPDO();
    if ($pdo) {
        $stmt = $pdo->prepare("
            SELECT * FROM `User` 
            WHERE LOWER(COALESCE(username, '')) = :u 
               OR LOWER(email) = :u 
               OR LOWER(email) = CONCAT(:u, '@fee.local')
               OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = :u
               OR LOWER(COALESCE(name, '')) = :u
               OR (:u = 'admin' AND LOWER(email) = 'admin@fundacionesquel.edu.ar')
            LIMIT 1
        ");
        $stmt->execute([':u' => $username]);
        $dbUser = $stmt->fetch();
        if ($dbUser) $userFound = $dbUser;
    }
} catch (Exception $e) {}

// 2. users.json fallback
if (!$userFound) {
    $usersFile = __DIR__ . '/data/users.json';
    if (file_exists($usersFile)) {
        $localUsers = json_decode(file_get_contents($usersFile), true) ?: [];
        foreach ($localUsers as $lu) {
            $uName = strtolower(trim($lu['username'] ?? ''));
            $uEmail = strtolower(trim($lu['email'] ?? ''));
            if ($uName === $username || $uEmail === $username || $uEmail === $username . '@fee.local') {
                $userFound = $lu;
                break;
            }
        }
    }
}

// 3. Builtin users fallback
if (!$userFound) {
    if ($username === 'admin' || $username === 'admin@fundacionesquel.edu.ar' || $username === 'administrador') {
        $userFound = $BUILTIN_USERS['admin'];
    } elseif ($username === 'mar' || $username === 'mar@fee.local' || $username === 'marina') {
        $userFound = $BUILTIN_USERS['mar'];
    }
}

// 4. Password validation
if ($userFound) {
    $isDirectAdmin = ($password === 'FEE_Esquel_2026$Patagonia' && ($username === 'admin' || ($userFound['username'] ?? '') === 'admin'));
    $isDirectMar   = (($password === 'Mar2026!Escuela' || $password === 'Patagonia$2026') && ($username === 'mar' || ($userFound['username'] ?? '') === 'mar'));

    $isValid = false;
    if (!empty($userFound['password']) && password_verify($password, $userFound['password'])) {
        $isValid = true;
    } elseif ($isDirectAdmin || $isDirectMar) {
        $isValid = true;
    } elseif (!empty($userFound['default_pass']) && $password === $userFound['default_pass']) {
        $isValid = true;
    } elseif (!empty($userFound['password']) && $userFound['password'] === $password) {
        $isValid = true;
    }

    if ($isValid) {
        $authenticatedUser = [
            'id'                 => $userFound['id'],
            'username'           => $userFound['username'] ?: ($userFound['email'] ?: $username),
            'email'              => $userFound['email'] ?? ($username . '@fee.local'),
            'name'               => $userFound['name'] ?: ($userFound['username'] ?: $username),
            'role'               => $userFound['role'] ?: 'EDITOR',
            'permissions'        => $userFound['permissions'] ?: 'blog,contacts,enrollments',
            'mustChangePassword' => !empty($userFound['mustChangePassword'])
        ];
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos."]);
        exit;
    }
}

if (!$authenticatedUser) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Usuario o contraseña incorrectos."]);
    exit;
}

$payload = [
    'userId'             => $authenticatedUser['id'],
    'username'           => $authenticatedUser['username'] ?? 'admin',
    'role'               => $authenticatedUser['role'],
    'name'               => $authenticatedUser['name'],
    'email'              => $authenticatedUser['email'],
    'permissions'        => $authenticatedUser['permissions'],
    'mustChangePassword' => !empty($authenticatedUser['mustChangePassword']),
    'exp'                => time() + 86400
];
$token = generateToken($payload);

$isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
setcookie('admin_session', $token, [
    'expires'  => time() + 86400,
    'path'     => '/',
    'httponly' => true,
    'secure'   => $isSecure,
    'samesite' => 'Lax'
]);

echo json_encode([
    "success" => true,
    "token"   => $token,
    "user"    => $payload
]);
```

---

### 4.3. `src/actions/admin.ts`
```typescript
function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fee_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function loginAdmin(password: string, email?: string) {
  try {
    const res = await fetch("/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || "admin", password }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch (parseErr) {
      return { success: false, error: "Usuario o contraseña incorrectos." };
    }

    if (data && data.success && data.token && typeof window !== "undefined") {
      localStorage.setItem("fee_admin_token", data.token);
    }
    return data || { success: false, error: "Usuario o contraseña incorrectos." };
  } catch (error: any) {
    return { success: false, error: "Usuario o contraseña incorrectos." };
  }
}

export async function getDashboardData() {
  try {
    const res = await fetch("/api/admin.php?action=get_data", {
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

### 4.4. `src/app/admin/page.tsx`
```typescript
"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "./dashboard";
import { LoginForm } from "./login";
import { getDashboardData } from "@/actions/admin";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      if (res && res.success) {
        setData(res);
      } else {
        setData(null);
      }
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userSession = data ? (data.user || data.session) : null;
  const isAuth = !!userSession;

  return (
    <div className="min-h-screen bg-brand-gray/5 pb-24">
      <main className="container mx-auto px-6 lg:px-12 max-w-5xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-blue">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-semibold text-sm">Cargando panel de administración...</p>
          </div>
        ) : isAuth && userSession ? (
          <AdminDashboard 
            posts={data.posts || []} 
            enrollments={data.enrollments || []} 
            contactMessages={data.contacts || []} 
            users={data.users || []} 
            gallery={data.gallery || []}
            session={userSession} 
            onLogout={() => {
              setData(null);
            }}
          />
        ) : (
          <LoginForm onLoginSuccess={loadData} />
        )}
      </main>
    </div>
  );
}
```

---

## 5. PROMPT ESTRUCTURADO PARA CLAUDE

A continuación se presenta el prompt listo para copiar y pegar en Claude:

```text
Actuá como un Arquitecto de Software y Especialista en Seguridad PHP / Next.js.
Estamos depurando un fallo de autenticación en producción sobre un hosting Apache (Hostinger) con MySQL y export estático de Next.js.

CONTEXTO DEL PROBLEMA:
Al intentar autenticarse en el formulario `/admin`:
1. Inicialmente arrojaba un error de JSON inválido ("Unexpected end of JSON input").
2. Tras sanitizar los endpoints y hacer try/catch en el frontend, el botón de login muestra el spinner de carga pero inmediatamente se queda en la pantalla de login sin ingresar al Dashboard ni mostrar mensaje de error.

OBJETIVO:
Garantizar que:
1. Todos los usuarios legítimos (tanto los registrados en la tabla `User` de MySQL como los de respaldo en `users.json` o usuarios nativos) puedan autenticarse exitosamente con sus contraseñas preexistentes.
2. Si las credenciales fallan, se muestre únicamente "Usuario o contraseña incorrectos." sin revelar nombres de usuario válidos ni errores técnicos.
3. Al loguearse con éxito, se acceda inmediatamente al `<AdminDashboard />` sin bloqueos por FastCGI header stripping, cookies HttpOnly, o excepciones de base de datos.

REVISÁ EL DOCUMENTO TÉCNICO ADJUNTO (que contiene el código exacto de api/config.php, api/login.php, api/admin.php, src/actions/admin.ts y src/app/admin/page.tsx) Y RESPONDÉ:

1. ¿Cuál es la causa raíz exacta por la cual la sesión no se establece o `getDashboardData()` no autentica en Hostinger?
2. Proporcioná el código corregido y optimizado para:
   - `api/config.php` (especialmente la extracción resiliente de tokens Bearer en Apache/FastCGI y cookies, y el manejo de JWT).
   - `api/login.php` (flujo de autenticación sin puntos únicos de fallo).
   - `src/actions/admin.ts` y `src/app/admin/page.tsx` (manejo de estado, tokens y llamadas con `credentials: "same-origin"`).
3. Asegurá que no haya dependencias circulares, bloqueos por rate limiting residual en `/tmp`, ni incompatibilidades con el export estático de Next.js.
```
