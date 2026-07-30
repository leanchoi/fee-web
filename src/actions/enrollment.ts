"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";

const formSchema = z.object({
  tutorName: z.string().min(2, "El nombre del tutor es obligatorio"),
  tutorEmail: z.string().email("Correo inválido"),
  tutorPhone: z.string().min(6, "Teléfono inválido"),
  studentName: z.string().min(2, "El nombre del estudiante es obligatorio"),
  studentLevel: z.enum(["Inicial", "Primario", "Secundario"]),
  studentGrade: z.string().min(1, "Especifique sala o grado"),
  comments: z.string().min(5, "Por favor complete este campo contándonos sobre su historia o escuela de procedencia"),
});

type FormInput = z.infer<typeof formSchema>;

export async function submitEnrollment(data: FormInput) {
  try {
    // 1. Validate payload on the server
    const parsed = formSchema.parse(data);

    // 2. Save directly to DB (Guarantees backup)
    const enrollment = await prisma.enrollment.create({
      data: {
        tutorName: parsed.tutorName,
        tutorEmail: parsed.tutorEmail,
        tutorPhone: parsed.tutorPhone,
        studentName: parsed.studentName,
        studentLevel: parsed.studentLevel,
        studentGrade: parsed.studentGrade,
        comments: parsed.comments || "",
      },
    });

    // 3. (Optional) Send Email via Resend/Nodemailer here
    // We log it for now to prove it works securely without exposing keys
    console.log("New Enrollment Saved:", enrollment.id);

    // 4. Synchronize with Google Sheets Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "enrollment",
            id: enrollment.id,
            tutorName: parsed.tutorName,
            tutorEmail: parsed.tutorEmail,
            tutorPhone: parsed.tutorPhone,
            studentName: parsed.studentName,
            studentLevel: parsed.studentLevel,
            studentGrade: parsed.studentGrade,
            comments: parsed.comments || "",
          }),
        });
        console.log("Enrollment synced to Google Sheets successfully");
      } catch (err) {
        console.error("Failed to sync enrollment to Google Sheets:", err);
      }
    }

    return { success: true, id: enrollment.id };
  } catch (error) {
    console.error("Enrollment error:", error);
    return { success: false, error: "Ocurrió un error al procesar tu solicitud." };
  }
}
