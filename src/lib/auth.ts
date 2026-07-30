import crypto from "crypto";

/**
 * Primitivas de autenticación de la intranet FEE.
 *
 * Reglas de diseño:
 * - Ningún secreto vive en el código. En producción la app falla al arrancar
 *   si falta configuración, en lugar de caer en un valor por defecto público.
 * - Las contraseñas se guardan con scrypt y sal por usuario.
 * - Toda comparación de material secreto es de tiempo constante.
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = { N: 16384, r: 8, p: 1 };

const isProduction = process.env.NODE_ENV === "production";

/** Secreto usado para firmar cookies de sesión. */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (isProduction) {
    throw new Error(
      "SESSION_SECRET no está configurada (se requieren 32+ caracteres). " +
        "Generá una con: openssl rand -hex 32"
    );
  }

  if (secret) {
    throw new Error("SESSION_SECRET es demasiado corta: se requieren 32+ caracteres.");
  }

  // Sólo desarrollo local: efímero, distinto en cada arranque.
  // Invalida las sesiones al reiniciar, que es el comportamiento correcto
  // cuando no hay un secreto configurado.
  return devEphemeralSecret();
}

let ephemeralSecret: string | null = null;
function devEphemeralSecret(): string {
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString("hex");
    console.warn(
      "[auth] SESSION_SECRET no configurada. Usando un secreto efímero de desarrollo; " +
        "las sesiones se invalidan al reiniciar el servidor."
    );
  }
  return ephemeralSecret;
}

/** Compara dos strings en tiempo constante, sin filtrar su longitud. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  // Hasheamos primero para que la comparación sea sobre buffers de igual largo:
  // timingSafeEqual lanza si difieren en longitud.
  const digestA = crypto.createHash("sha256").update(bufA).digest();
  const digestB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

// ---------------------------------------------------------------------------
// Hashing de contraseñas
// ---------------------------------------------------------------------------

/**
 * Deriva un hash scrypt con sal aleatoria por usuario.
 * Formato: `scrypt$N$r$p$<sal hex>$<hash hex>`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_COST);
  const { N, r, p } = SCRYPT_COST;
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Verifica una contraseña contra un hash almacenado.
 *
 * Acepta además el formato heredado (HMAC-SHA256 con sal fija) para no dejar
 * afuera a los usuarios creados por la versión anterior; `needsRehash` indica
 * que conviene re-guardar la contraseña con el esquema actual.
 */
export function verifyPassword(
  password: string,
  stored: string
): { valid: boolean; needsRehash: boolean } {
  if (!stored) return { valid: false, needsRehash: false };

  if (stored.startsWith("scrypt$")) {
    const parts = stored.split("$");
    if (parts.length !== 6) return { valid: false, needsRehash: false };

    const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return { valid: false, needsRehash: false };
    }

    let expected: Buffer;
    try {
      expected = Buffer.from(hashHex, "hex");
      const derived = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
        N,
        r,
        p,
      });
      const valid = crypto.timingSafeEqual(derived, expected);
      const outdated = N !== SCRYPT_COST.N || r !== SCRYPT_COST.r || p !== SCRYPT_COST.p;
      return { valid, needsRehash: valid && outdated };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Esquema heredado: HMAC-SHA256 con sal compartida.
  const legacy = crypto
    .createHmac("sha256", "fee_salt_2026")
    .update(password)
    .digest("hex");
  const valid = safeEqual(legacy, stored);
  return { valid, needsRehash: valid };
}

// ---------------------------------------------------------------------------
// Sesiones firmadas
// ---------------------------------------------------------------------------

export interface SessionPayload {
  userId: string;
  role: string;
  name: string;
  email?: string;
  permissions: string;
  /** Emitida en (epoch ms). */
  iat: number;
  /** Expira en (epoch ms). Se valida en el servidor, no sólo por maxAge. */
  exp: number;
}

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Firma un payload de sesión. Devuelve `<payload b64url>.<hmac b64url>`. */
export function signSession(payload: Omit<SessionPayload, "iat" | "exp">): string {
  const now = Date.now();
  const full: SessionPayload = { ...payload, iat: now, exp: now + SESSION_TTL_MS };
  const encoded = base64url(JSON.stringify(full));
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/** Verifica firma y vigencia. Devuelve `null` ante cualquier problema. */
export function verifySession(cookieValue: string): SessionPayload | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  if (!safeEqual(signature, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.userId !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  // La expiración se valida del lado del servidor: una cookie copiada
  // fuera del navegador tampoco sobrevive al TTL.
  if (Date.now() > payload.exp) return null;

  return payload;
}

// ---------------------------------------------------------------------------
// Credenciales del administrador principal
// ---------------------------------------------------------------------------

/**
 * Credenciales del admin de arranque, tomadas del entorno.
 *
 * `ADMIN_PASSWORD_HASH` (recomendado) espera el formato de `hashPassword`.
 * `ADMIN_PASSWORD` se acepta como alternativa en texto plano para instalaciones
 * simples. Si no hay ninguna configurada, el login maestro queda deshabilitado:
 * no existe contraseña por defecto.
 */
export function getMasterCredentials(): { email: string; verify: (pwd: string) => boolean } | null {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const plain = process.env.ADMIN_PASSWORD;

  if (!email || (!hash && !plain)) return null;

  if (hash) {
    return { email, verify: (pwd) => verifyPassword(pwd, hash).valid };
  }

  return { email, verify: (pwd) => safeEqual(pwd, plain as string) };
}
