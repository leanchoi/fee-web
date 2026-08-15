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

export type FormInput = z.infer<typeof formSchema>;

export async function submitEnrollment(data: FormInput) {
  try {
    const parsed = formSchema.parse(data);
    const res = await fetch("/api/enroll.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error al procesar tu solicitud." };
  }
}
