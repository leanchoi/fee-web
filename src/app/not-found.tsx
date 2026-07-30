import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { MAIN_CAMPUS } from "@/lib/site";

/**
 * Página 404 propia.
 *
 * Sin este archivo, Next servía su pantalla de error genérica: sin header,
 * sin footer y en inglés. Una familia que llega desde un enlace viejo quedaba
 * sin ninguna salida.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center bg-background px-6 py-32">
      <div className="container mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-brand-green">
          Error 404
        </p>
        <h1 className="mb-6 text-4xl font-bold text-brand-blue md:text-5xl">
          No encontramos esta página
        </h1>
        <p className="mb-10 text-lg text-foreground/75">
          Puede que el enlace haya cambiado o que la página ya no exista. Te dejamos algunos
          caminos para seguir.
        </p>

        <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-3.5 font-bold text-white transition-colors hover:bg-brand-green"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <Link
            href="/inscripciones"
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-blue/15 px-6 py-3.5 font-bold text-brand-blue transition-colors hover:border-brand-blue"
          >
            Preinscripción
          </Link>
        </div>

        <nav aria-label="Enlaces útiles">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-brand-green">
            <li>
              <Link href="/quienes-somos" className="hover:underline">
                Quiénes somos
              </Link>
            </li>
            <li>
              <Link href="/propuesta-educativa/inicial" className="hover:underline">
                Niveles
              </Link>
            </li>
            <li>
              <Link href="/ingles" className="hover:underline">
                Inglés
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:underline">
                Novedades
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:underline">
                Contacto
              </Link>
            </li>
          </ul>
        </nav>

        <p className="mt-10 text-sm text-foreground/70">
          ¿Buscabas algo puntual?{" "}
          <a
            href={`mailto:${MAIN_CAMPUS.email}`}
            className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Escribinos
          </a>
        </p>
      </div>
    </div>
  );
}
