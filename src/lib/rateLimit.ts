import { headers } from "next/headers";

/**
 * Limitador de tasa en memoria (ventana fija).
 *
 * Alcance: pensado para el despliegue actual de un solo proceso (VPS con
 * `next start`). Es una defensa efectiva contra fuerza bruta y spam de
 * formularios, pero el estado no se comparte entre instancias: si el sitio
 * pasa a correr en varias réplicas o en serverless, esto debe migrar a un
 * store compartido (Redis, Upstash o similar).
 */

interface Counter {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Counter>();

/** Evita que el Map crezca sin límite ante IPs rotativas. */
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, counter] of buckets) {
    if (counter.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos hasta que la ventana se reinicie. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Identifica al cliente para el limitador.
 *
 * Confía en `x-forwarded-for` porque el despliegue previsto está detrás de un
 * proxy inverso propio (Nginx/Caddy). Si la app quedara expuesta directamente
 * a Internet, la cabecera es falsificable y este valor deja de ser confiable.
 */
export async function getClientKey(scope: string): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
