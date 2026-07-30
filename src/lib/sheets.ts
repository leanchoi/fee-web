/**
 * Replicación opcional a una planilla de Google (Apps Script).
 *
 * Es un canal secundario: la base de datos es la fuente de verdad. Si el
 * webhook falla o tarda, la operación del visitante no se ve afectada.
 */

const TIMEOUT_MS = 5000;

export async function notifySheet(payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    // Sin timeout, un webhook que no responde mantiene abierta la petición del
    // visitante hasta el límite del servidor.
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    // Se registra en el servidor pero no se propaga: el dato ya está guardado.
    console.error("[sheets] No se pudo sincronizar con la planilla:", error);
  }
}
