"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  subject: z.string().min(2, "El asunto es obligatorio"),
  message: z.string().min(5, "El mensaje es demasiado corto"),
});

type ContactInput = z.infer<typeof contactSchema>;

export async function submitContact(data: ContactInput) {
  try {
    const parsed = contactSchema.parse(data);

    const contact = await prisma.contactMessage.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        subject: parsed.subject,
        message: parsed.message,
      },
    });

    console.log("New Contact Message Saved:", contact.id);

    // Synchronize with Google Sheets Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "contact",
            id: contact.id,
            name: parsed.name,
            email: parsed.email,
            subject: parsed.subject,
            message: parsed.message,
          }),
        });
        console.log("Contact message synced to Google Sheets successfully");
      } catch (err) {
        console.error("Failed to sync contact message to Google Sheets:", err);
      }
    }

    return { success: true, id: contact.id };
  } catch (error: any) {
    console.error("Contact error:", error);
    return { success: false, error: error.message || "Ocurrió un error al procesar tu mensaje." };
  }
}
