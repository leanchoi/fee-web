"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { submitEnrollment } from "@/actions/enrollment";
import { Field, Honeypot, controlClasses } from "@/components/forms/Field";
import { MAIN_CAMPUS } from "@/lib/site";

/**
 * El esquema del cliente refleja el del servidor (`src/actions/enrollment.ts`),
 * que es el que decide. Acá sirve para dar retroalimentación inmediata.
 */
const formSchema = z.object({
  tutorName: z.string().trim().min(2, "Ingresá el nombre completo del tutor").max(120),
  tutorEmail: z.string().trim().email("Ingresá un correo electrónico válido").max(160),
  tutorPhone: z.string().trim().min(6, "Ingresá un teléfono de contacto válido").max(40),
  studentName: z.string().trim().min(2, "Ingresá el nombre del aspirante").max(120),
  studentLevel: z.enum(["Inicial", "Primario", "Secundario"], {
    message: "Elegí el nivel al que se postula",
  }),
  studentGrade: z.string().trim().min(1, "Elegí la sala, grado o año").max(40),
  comments: z
    .string()
    .trim()
    .min(5, "Contanos brevemente sobre la trayectoria escolar o los intereses del aspirante")
    .max(2000, "El comentario no puede superar los 2000 caracteres"),
  consent: z.literal(true, {
    message: "Necesitamos tu consentimiento para procesar la solicitud",
  }),
  contactPreference: z.string().max(0).optional(),
});

type FormInput = z.input<typeof formSchema>;

const GRADE_OPTIONS = {
  Inicial: ["Sala de 3", "Sala de 4", "Sala de 5"],
  Primario: ["1.er grado", "2.º grado", "3.er grado", "4.º grado", "5.º grado", "6.º grado"],
  Secundario: ["1.er año", "2.º año", "3.er año", "4.º año", "5.º año", "6.º año"],
} as const;

export function EnrollmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    // `as never` evita el desajuste de tipos entre el literal `true` del
    // consentimiento y el valor `false` con el que arranca el checkbox.
    resolver: zodResolver(formSchema) as never,
  });

  // `useWatch` en vez de `watch()`: devuelve un valor estable que el compilador
  // de React puede memoizar.
  const selectedLevel = useWatch({ control, name: "studentLevel" });

  const onSubmit = async (data: FormInput) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await submitEnrollment(data);
      if (result.success) {
        setReference(result.id);
      } else {
        setServerError(result.error ?? "No pudimos registrar la solicitud.");
      }
    } catch {
      setServerError("Hubo un problema de conexión. Revisá tu red e intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reference !== null) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>
        <h3 className="mb-4 text-3xl font-bold text-brand-blue">Solicitud registrada</h3>
        <p className="max-w-md text-lg text-foreground/80">
          Recibimos los datos correctamente. El equipo de admisiones se pondrá en contacto por
          correo o teléfono.
        </p>

        {/* Un comprobante concreto: sirve para citar la solicitud al llamar. */}
        {reference && (
          <p className="mt-6 rounded-2xl border border-brand-gray/20 bg-brand-gray/5 px-5 py-3 text-sm text-foreground/75">
            Código de seguimiento:{" "}
            <span className="font-mono font-bold text-brand-blue">
              {reference.slice(-8).toUpperCase()}
            </span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              reset();
              setReference(null);
            }}
            className="rounded-full border-2 border-brand-blue/20 px-6 py-3 text-sm font-bold text-brand-blue transition-colors hover:border-brand-blue"
          >
            Cargar otra solicitud
          </button>
          <a
            href={`mailto:${MAIN_CAMPUS.email}`}
            className="rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green"
          >
            Escribir a admisiones
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Honeypot name="contact-pref" label="No completar" register={register("contactPreference")} />

      {/* `role="alert"` hace que el lector de pantalla anuncie el error sin que
          la persona tenga que buscarlo en la página. */}
      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{serverError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <fieldset className="space-y-4">
          <legend className="mb-2 w-full border-b border-brand-gray/20 pb-2 text-lg font-bold text-brand-green">
            Datos del tutor responsable
          </legend>

          <Field label="Nombre completo" required error={errors.tutorName?.message}>
            {(props) => (
              <input
                {...props}
                {...register("tutorName")}
                type="text"
                autoComplete="name"
                placeholder="Ej.: María López"
                className={controlClasses(!!errors.tutorName)}
              />
            )}
          </Field>

          <Field label="Correo electrónico" required error={errors.tutorEmail?.message}>
            {(props) => (
              <input
                {...props}
                {...register("tutorEmail")}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="correo@ejemplo.com"
                className={controlClasses(!!errors.tutorEmail)}
              />
            )}
          </Field>

          <Field label="Teléfono móvil" required error={errors.tutorPhone?.message}>
            {(props) => (
              <input
                {...props}
                {...register("tutorPhone")}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="2945 15 123456"
                className={controlClasses(!!errors.tutorPhone)}
              />
            )}
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 w-full border-b border-brand-gray/20 pb-2 text-lg font-bold text-brand-green">
            Datos del aspirante
          </legend>

          <Field label="Nombre y apellido" required error={errors.studentName?.message}>
            {(props) => (
              <input
                {...props}
                {...register("studentName")}
                type="text"
                placeholder="Nombre del alumno o alumna"
                className={controlClasses(!!errors.studentName)}
              />
            )}
          </Field>

          <Field label="Nivel al que se postula" required error={errors.studentLevel?.message}>
            {(props) => (
              <select
                {...props}
                {...register("studentLevel")}
                defaultValue=""
                className={controlClasses(!!errors.studentLevel)}
              >
                <option value="">Elegí un nivel…</option>
                <option value="Inicial">Nivel Inicial</option>
                <option value="Primario">Nivel Primario</option>
                <option value="Secundario">Nivel Secundario</option>
              </select>
            )}
          </Field>

          <Field
            label="Sala, grado o año"
            required
            error={errors.studentGrade?.message}
            hint={selectedLevel ? undefined : "Se habilita al elegir el nivel."}
          >
            {(props) => (
              <select
                {...props}
                {...register("studentGrade")}
                defaultValue=""
                disabled={!selectedLevel}
                className={controlClasses(
                  !!errors.studentGrade,
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                <option value="">
                  {selectedLevel ? "Elegí una opción…" : "Elegí primero el nivel"}
                </option>
                {selectedLevel &&
                  GRADE_OPTIONS[selectedLevel as keyof typeof GRADE_OPTIONS]?.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
              </select>
            )}
          </Field>
        </fieldset>
      </div>

      <Field
        label="Trayectoria escolar o escuela de procedencia"
        required
        error={errors.comments?.message}
        hint="Nos ayuda a conocer al aspirante antes de la entrevista."
      >
        {(props) => (
          <textarea
            {...props}
            {...register("comments")}
            rows={4}
            maxLength={2000}
            placeholder="Contanos sobre su historia escolar, intereses y qué buscan para su educación…"
            className={controlClasses(!!errors.comments, "resize-y")}
          />
        )}
      </Field>

      {/* Consentimiento informado. El formulario recoge datos de un menor y de
          su tutor: la Ley 25.326 exige informar la finalidad y pedir permiso
          antes de almacenarlos. */}
      <div className="rounded-2xl border border-brand-gray/20 bg-brand-gray/5 p-5">
        <div className="flex items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            {...register("consent")}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-brand-green"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-foreground/80">
            Autorizo a la Fundación Educativa Esquel a registrar estos datos con el único fin de
            gestionar la preinscripción y comunicarse conmigo. Entiendo que se tratan de forma
            confidencial y que puedo pedir su corrección o eliminación escribiendo a{" "}
            <a
              href={`mailto:${MAIN_CAMPUS.email}`}
              className="font-semibold text-brand-green underline underline-offset-2"
            >
              {MAIN_CAMPUS.email}
            </a>
            .
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-xs font-medium text-red-600">
            {errors.consent.message}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-end gap-4 pt-2 sm:flex-row">
        <p className="text-xs text-foreground/70 sm:mr-auto">
          Los campos con <span aria-hidden="true">*</span>
          <span className="sr-only">asterisco</span> son obligatorios.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-10 py-4 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-brand-green disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            "Enviar preinscripción"
          )}
        </button>
      </div>
    </form>
  );
}
