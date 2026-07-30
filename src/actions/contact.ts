"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { notifySheet } from "@/lib/sheets";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre")
    .max(120, "El nombre es demasiado largo"),
  email: z
    .string()
    .trim()
    .email("Ingresá un correo electrónico válido")
    .max(160, "El correo es demasiado largo"),
  subject: z
    .string()
    .trim()
    .min(2, "Indicá el asunto de tu consulta")
    .max(150, "El asunto es demasiado largo"),
  message: z
    .string()
    .trim()
    .min(5, "Contanos un poco más para poder ayudarte")
    .max(3000, "El mensaje no puede superar los 3000 caracteres"),
  /** Campo trampa: invisible para las personas, tentador para los bots. */
  website: z.string().max(0).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;

export async function submitContact(data: ContactInput) {
  // 5 mensajes por hora y por IP.
  const limit = rateLimit(await getClientKey("contact"), 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return {
      success: false as const,
      error:
        "Recibimos varios mensajes desde esta conexión. Esperá unos minutos o escribinos por correo.",
    };
  }

  const parsed = contactSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Revisá los datos ingresados.",
    };
  }

  if (parsed.data.website) {
    return { success: true as const, id: "" };
  }

  const { website: _honeypot, ...values } = parsed.data;

  try {
    const contact = await prisma.contactMessage.create({ data: values });

    await notifySheet({ type: "contact", id: contact.id, ...values });

    return { success: true as const, id: contact.id };
  } catch (error) {
    console.error("[contact] Error al registrar el mensaje:", error);
    return {
      success: false as const,
      error: "No pudimos enviar tu mensaje. Intentá de nuevo en unos minutos.",
    };
  }
}
