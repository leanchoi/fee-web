"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Envoltorio de campo de formulario.
 *
 * Existe para que la accesibilidad no dependa de recordarla en cada campo: los
 * formularios de contacto e inscripción tenían `<label>` sin `htmlFor` ni `id`,
 * así que al tocar la etiqueta no se enfocaba el campo y los lectores de
 * pantalla anunciaban "campo de texto sin nombre". El error tampoco estaba
 * asociado al control.
 */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Recibe los atributos que el control debe aplicar. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean | undefined;
    "aria-required": boolean | undefined;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-brand-blue">
        {label}
        {required && (
          <span className="ml-0.5 text-brand-yellow-dark" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="mb-1.5 text-xs text-foreground/70">
          {hint}
        </p>
      )}

      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })}

      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Clases compartidas por inputs, selects y textareas. */
export function controlClasses(hasError?: boolean, extra?: string) {
  return cn(
    "w-full rounded-xl border bg-brand-gray/5 px-4 py-3 text-sm outline-none transition-all",
    "focus:border-transparent focus:bg-white focus:ring-2 focus:ring-brand-green",
    hasError ? "border-red-400" : "border-brand-gray/30",
    extra
  );
}

/**
 * Campo trampa para bots. Va fuera del flujo visual y del orden de tabulación,
 * y queda oculto para tecnologías asistivas.
 */
export function Honeypot({
  name,
  label,
  register,
}: {
  name: string;
  label: string;
  register?: Record<string, unknown>;
}) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor={`hp-${name}`}>{label}</label>
      <input id={`hp-${name}`} type="text" tabIndex={-1} autoComplete="off" {...register} />
    </div>
  );
}
