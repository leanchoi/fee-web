import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdmissionYear } from "@/lib/dateUtils";
import { MAIN_CAMPUS } from "@/lib/site";

export function CtaSection() {
  const admissionYear = getAdmissionYear();

  return (
    <section className="relative overflow-hidden bg-brand-green py-24 text-white">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-20" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="cta-lines" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 40 0 0" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-lines)" />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto flex flex-col items-center px-6 text-center lg:px-12">
        {/* El texto decía "Admisiones Abiertas" sin año, mientras el resto del
            sitio anuncia un ciclo concreto. */}
        <p className="mb-4 block text-sm font-bold uppercase tracking-widest text-brand-yellow">
          Preinscripción {admissionYear} abierta
        </p>
        <h2 className="mb-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          El primer paso puede darse hoy.
        </h2>
        <p className="mb-12 max-w-2xl text-xl text-white/85">
          La preinscripción se recibe durante todo el año. Registrá el interés de tu familia o
          vení a conocer la escuela en persona.
        </p>

        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/inscripciones"
            className="group flex items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-4 text-lg font-bold text-brand-blue shadow-xl transition-all hover:-translate-y-1 hover:bg-white"
          >
            Completar preinscripción
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/contacto"
            className="flex items-center justify-center rounded-full border-2 border-white/40 bg-transparent px-8 py-4 text-lg font-bold text-white transition-all hover:border-white hover:bg-white/10"
          >
            Coordinar una visita
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/70">
          También podés escribirnos a{" "}
          <a
            href={`mailto:${MAIN_CAMPUS.email}`}
            className="font-semibold text-brand-yellow underline underline-offset-4 hover:text-white"
          >
            {MAIN_CAMPUS.email}
          </a>{" "}
          o llamar al{" "}
          <a
            href={`tel:${MAIN_CAMPUS.phoneHref}`}
            className="font-semibold text-brand-yellow underline underline-offset-4 hover:text-white"
          >
            {MAIN_CAMPUS.phone}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
