import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 bg-brand-green text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="lines" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 40 0 0" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center flex flex-col items-center">
        <span className="text-brand-yellow font-bold uppercase tracking-widest text-sm mb-4 block">Admisiones Abiertas</span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl leading-tight">
          El primer paso hacia un futuro extraordinario.
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mb-12">
          Te invitamos a ser parte de nuestra comunidad. Conocé nuestra propuesta en persona o iniciá el proceso de postulación online.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/inscripciones"
            className="group flex items-center justify-center gap-2 bg-brand-yellow text-brand-blue px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:-translate-y-1 transition-all shadow-xl"
          >
            Postulación online
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/contacto"
            className="flex items-center justify-center bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:border-white transition-all"
          >
            Contactar Sede
          </Link>
        </div>
      </div>
    </section>
  );
}
