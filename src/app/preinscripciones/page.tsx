import { Metadata } from "next";
import { PreinscripcionForm } from "./form";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Solicitud de Preinscripción | Fundación Educativa Esquel",
  description: "Formulario de admisión e ingreso para nuevos estudiantes en Nivel Inicial, Primario y Secundario.",
};

export default function PreinscripcionesPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen pb-24">
      {/* Header */}
      <section className="pt-28 pb-16 bg-brand-blue text-white relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="inline-block bg-white/10 text-brand-yellow text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 border border-white/20">
            Admisión General
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 max-w-4xl mx-auto tracking-tight leading-tight">
            Solicitud de Preinscripción
          </h1>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-slate-200 leading-relaxed font-normal">
            Registro de aspirantes y lista de espera para nuevos estudiantes en Nivel Inicial, Primario y Secundario.
          </p>
        </div>
      </section>

      {/* Notice & Form */}
      <section className="-mt-6 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-3xl">
          
          {/* Banner para alumnos actuales */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>¿Su hijo/a ya es alumno/a regular de la institución?</span>
            </div>
            <Link 
              href="/reinscripciones"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0"
            >
              Ir a Reinscripciones 2027 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80">
            <PreinscripcionForm />
          </div>
        </div>
      </section>
    </div>
  );
}
