"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { submitEnrollment } from "@/actions/enrollment";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EnrollmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
  });

  const selectedLevel = watch("studentLevel");

  const gradeOptions = {
    Inicial: ["Sala de 3", "Sala de 4", "Sala de 5"],
    Primario: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    Secundario: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año", "6to Año"],
  };

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    setErrorObj(null);
    try {
      const result = await submitEnrollment(data);
      if (result.success) {
        setSuccess(true);
      } else {
        setErrorObj(result.error || "Error desconocido");
      }
    } catch (e) {
      setErrorObj("Ocurrió un error de red. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-3xl font-bold text-brand-blue mb-4">¡Solicitud Enviada!</h3>
        <p className="text-lg text-brand-foreground/80 max-w-md">
          Hemos recibido los datos correctamente. Nuestro equipo de admisiones se pondrá en contacto a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {errorObj && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{errorObj}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tutor Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-brand-green border-b border-brand-gray/10 pb-2">
            Datos del Tutor Responsable
          </h3>
          
          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Nombre Completo</label>
            <input 
              {...register("tutorName")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.tutorName ? "border-red-400" : "border-brand-gray/20")}
              placeholder="Ej. María López"
            />
            {errors.tutorName && <span className="text-red-500 text-xs mt-1 block">{errors.tutorName.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Correo Electrónico</label>
            <input 
              type="email"
              {...register("tutorEmail")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.tutorEmail ? "border-red-400" : "border-brand-gray/20")}
              placeholder="correo@ejemplo.com"
            />
            {errors.tutorEmail && <span className="text-red-500 text-xs mt-1 block">{errors.tutorEmail.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Teléfono Móvil</label>
            <input 
              type="tel"
              {...register("tutorPhone")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.tutorPhone ? "border-red-400" : "border-brand-gray/20")}
              placeholder="(02945) 15-XXXXXX"
            />
            {errors.tutorPhone && <span className="text-red-500 text-xs mt-1 block">{errors.tutorPhone.message}</span>}
          </div>
        </div>

        {/* Student Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-brand-green border-b border-brand-gray/10 pb-2">
            Datos del Aspirante
          </h3>
          
          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Nombre y Apellido</label>
            <input 
              {...register("studentName")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.studentName ? "border-red-400" : "border-brand-gray/20")}
              placeholder="Nombre del alumno/a"
            />
            {errors.studentName && <span className="text-red-500 text-xs mt-1 block">{errors.studentName.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Nivel al que postula</label>
            <select 
              {...register("studentLevel")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.studentLevel ? "border-red-400" : "border-brand-gray/20")}
            >
              <option value="">Seleccione un nivel...</option>
              <option value="Inicial">Nivel Inicial</option>
              <option value="Primario">Nivel Primario</option>
              <option value="Secundario">Nivel Secundario</option>
            </select>
            {errors.studentLevel && <span className="text-red-500 text-xs mt-1 block">{errors.studentLevel.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-blue mb-1">Sala o Grado</label>
            <select 
              {...register("studentGrade")} 
              className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all", errors.studentGrade ? "border-red-400" : "border-brand-gray/20")}
              disabled={!selectedLevel}
            >
              <option value="">Seleccione primero el nivel...</option>
              {selectedLevel && gradeOptions[selectedLevel as keyof typeof gradeOptions]?.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {errors.studentGrade && <span className="text-red-500 text-xs mt-1 block">{errors.studentGrade.message}</span>}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-blue mb-1">Comentarios o Escuela de Procedencia</label>
        <textarea 
          {...register("comments")} 
          rows={3}
          className={cn("w-full px-4 py-3 rounded-xl border bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent outline-none transition-all resize-none", errors.comments ? "border-red-400" : "border-brand-gray/20")}
          placeholder="Contanos un poco sobre su historia escolar, intereses o motivaciones para conocer mejor a tu hijo/a y brindarle una experiencia educativa más ágil y personalizada..."
        />
        {errors.comments && <span className="text-red-500 text-xs mt-1 block">{errors.comments.message}</span>}
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-brand-blue text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-brand-green transition-all shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : "Enviar Solicitud de Preinscripción"}
        </button>
      </div>

    </form>
  );
}
