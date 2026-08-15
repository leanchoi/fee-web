import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  subject: z.string().min(2, "El asunto es obligatorio"),
  message: z.string().min(5, "El mensaje es demasiado corto"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export async function submitContact(data: ContactInput) {
  try {
    const parsed = contactSchema.parse(data);
    const res = await fetch("/api/contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error al enviar el mensaje." };
  }
}
