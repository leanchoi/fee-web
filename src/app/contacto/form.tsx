"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { submitContact } from "@/actions/contact";
import { Field, Honeypot, controlClasses } from "@/components/forms/Field";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  email: z.string().trim().email("Ingresá un correo electrónico válido").max(160),
  subject: z.string().trim().min(2, "Indicá el asunto de tu consulta").max(150),
  message: z
    .string()
    .trim()
    .min(5, "Contanos un poco más para poder ayudarte")
    .max(3000, "El mensaje no puede superar los 3000 caracteres"),
  website: z.string().max(0).optional(),
});

type ContactFormInput = z.input<typeof contactSchema>;

/**
 * La página de contacto entera era un componente de cliente, así que no podía
 * exportar `metadata` y quedaba sin título ni descripción propios en buscadores.
 * Ahora sólo el formulario es cliente.
 */
export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema) as never,
  });

  const onSubmit = async (data: ContactFormInput) => {
    setLoading(true);
    setStatus(null);

    try {
      const result = await submitContact(data);
      if (result.success) {
        setStatus({
          type: "success",
          text: "Recibimos tu mensaje. Te respondemos a la brevedad por correo.",
        });
        reset();
      } else {
        setStatus({ type: "error", text: result.error ?? "No pudimos enviar el mensaje." });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Hubo un problema de conexión. Revisá tu red e intentá de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-max rounded-[2rem] border border-brand-gray/10 bg-white p-8 shadow-xl md:p-10">
      <h2 className="mb-6 border-b border-brand-gray/15 pb-4 text-2xl font-bold text-brand-blue">
        Escribinos
      </h2>

      {/* `aria-live` anuncia el resultado del envío a quien usa lector de
          pantalla: antes el mensaje aparecía sólo visualmente. */}
      <div aria-live="polite" role="status">
        {status && (
          <div
            className={`mb-6 flex items-start gap-2.5 rounded-2xl border p-4 text-sm font-semibold ${
              status.type === "success"
                ? "border-brand-green/20 bg-brand-green/10 text-brand-green"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {status.text}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Honeypot name="website" label="No completar" register={register("website")} />

        <Field label="Nombre completo" required error={errors.name?.message}>
          {(props) => (
            <input
              {...props}
              {...register("name")}
              type="text"
              autoComplete="name"
              className={controlClasses(!!errors.name)}
            />
          )}
        </Field>

        <Field label="Correo electrónico" required error={errors.email?.message}>
          {(props) => (
            <input
              {...props}
              {...register("email")}
              type="email"
              autoComplete="email"
              inputMode="email"
              className={controlClasses(!!errors.email)}
            />
          )}
        </Field>

        <Field label="Asunto" required error={errors.subject?.message}>
          {(props) => (
            <input
              {...props}
              {...register("subject")}
              type="text"
              placeholder="Ej.: consulta por vacantes en Nivel Primario"
              className={controlClasses(!!errors.subject)}
            />
          )}
        </Field>

        <Field label="Mensaje" required error={errors.message?.message}>
          {(props) => (
            <textarea
              {...props}
              {...register("message")}
              rows={5}
              maxLength={3000}
              className={controlClasses(!!errors.message, "resize-y")}
            />
          )}
        </Field>

        <p className="text-xs text-foreground/70">
          Los campos con <span aria-hidden="true">*</span>
          <span className="sr-only">asterisco</span> son obligatorios. Usamos tus datos únicamente
          para responder esta consulta.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-blue disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Enviando…
            </>
          ) : (
            "Enviar mensaje"
          )}
        </button>
      </form>
    </div>
  );
}
