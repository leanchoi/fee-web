"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { notifySheet } from "@/lib/sheets";

/**
 * Los máximos de longitud son deliberados: sin ellos, una acción de servidor
 * pública acepta campos de tamaño arbitrario y cualquiera puede inflar la base
 * de datos con un puñado de pedidos.
 */
const formSchema = z.object({
  tutorName: z
    .string()
    .trim()
    .min(2, "El nombre del tutor es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  tutorEmail: z
    .string()
    .trim()
    .email("Ingresá un correo electrónico válido")
    .max(160, "El correo es demasiado largo"),
  tutorPhone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono de contacto válido")
    .max(40, "El teléfono es demasiado largo"),
  studentName: z
    .string()
    .trim()
    .min(2, "El nombre del estudiante es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  studentLevel: z.enum(["Inicial", "Primario", "Secundario"], {
    message: "Elegí el nivel al que se postula",
  }),
  studentGrade: z
    .string()
    .trim()
    .min(1, "Indicá la sala, grado o año")
    .max(40, "El valor es demasiado largo"),
  comments: z
    .string()
    .trim()
    .min(5, "Contanos brevemente sobre la trayectoria escolar o los intereses del aspirante")
    .max(2000, "El comentario no puede superar los 2000 caracteres"),
  /**
   * Consentimiento explícito. El formulario recoge datos de un menor y de su
   * tutor: la Ley 25.326 de Protección de Datos Personales exige informar la
   * finalidad y obtener consentimiento antes de almacenarlos.
   */
  consent: z.literal(true, {
    message: "Necesitamos tu consentimiento para procesar la solicitud",
  }),
  /** Campo trampa: si viene completo, lo llenó un bot. */
  contactPreference: z.string().max(0).optional(),
});

export type EnrollmentInput = z.input<typeof formSchema>;

export async function submitEnrollment(data: EnrollmentInput) {
  // 5 solicitudes por hora y por IP: suficiente para una familia con varios
  // hijos, insuficiente para un envío automatizado.
  const limit = rateLimit(await getClientKey("enrollment"), 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return {
      success: false as const,
      error:
        "Recibimos varias solicitudes desde esta conexión. Esperá unos minutos o escribinos por correo.",
    };
  }

  const parsed = formSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.",
    };
  }

  // El bot ya consumió su cupo del limitador; devolvemos éxito sin escribir
  // nada para no darle una señal de qué campo lo delató.
  if (parsed.data.contactPreference) {
    return { success: true as const, id: "" };
  }

  const { consent: _consent, contactPreference: _honeypot, ...values } = parsed.data;

  try {
    const enrollment = await prisma.enrollment.create({ data: values });

    // La sincronización con la planilla es best-effort: si falla, la solicitud
    // ya quedó guardada y no se pierde.
    await notifySheet({ type: "enrollment", id: enrollment.id, ...values });

    return { success: true as const, id: enrollment.id };
  } catch (error) {
    console.error("[enrollment] Error al registrar la solicitud:", error);
    return {
      success: false as const,
      error: "No pudimos registrar la solicitud. Intentá de nuevo en unos minutos.",
    };
  }
}
