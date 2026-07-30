"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { MAIN_CAMPUS } from "@/lib/site";

/**
 * Pantalla de error del lado del cliente.
 *
 * Sin este archivo, cualquier fallo en tiempo de ejecución mostraba la pantalla
 * por defecto de Next. Además, el mensaje técnico del error no se muestra al
 * visitante: sólo se registra en la consola.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Error no controlado:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center bg-background px-6 py-32">
      <div className="container mx-auto max-w-2xl text-center">
        <span
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow/15 text-brand-yellow-dark"
          aria-hidden="true"
        >
          <AlertTriangle className="h-8 w-8" />
        </span>

        <h1 className="mb-4 text-3xl font-bold text-brand-blue md:text-4xl">
          Algo no funcionó como esperábamos
        </h1>
        <p className="mb-10 text-lg text-foreground/75">
          El problema es de nuestro lado. Podés reintentar; si vuelve a pasar, escribinos y lo
          revisamos.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-green"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-blue/15 px-6 py-3.5 font-bold text-brand-blue transition-colors hover:border-brand-blue"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-10 text-sm text-foreground/70">
          <a
            href={`mailto:${MAIN_CAMPUS.email}`}
            className="font-semibold text-brand-green hover:underline"
          >
            {MAIN_CAMPUS.email}
          </a>
          {/* El digest identifica el error en los registros del servidor sin
              exponer detalles internos. */}
          {error.digest && (
            <>
              {" · "}
              <span className="font-mono text-xs">ref: {error.digest}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
