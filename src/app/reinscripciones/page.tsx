import { Metadata } from "next";
import { EnrollmentForm } from "../inscripciones/form";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Formulario de Reinscripción – Ciclo Lectivo 2027 | Fundación Educativa Esquel",
  description: "Formulario oficial de reinscripción para estudiantes de las Escuelas N.º 1030 y N.º 1739 - Ciclo Lectivo 2027.",
};

export default function ReinscripcionesPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen pb-24">
      {/* Header Institucional */}
      <section className="pt-28 pb-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
            Ciclo Lectivo 2027
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 max-w-4xl mx-auto tracking-tight leading-tight">
            Formulario de Reinscripción
          </h1>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-slate-300 leading-relaxed font-normal">
            Gestión digital exclusiva para estudiantes actuales de las Escuelas N.º 1030 y N.º 1739.
          </p>
        </div>
      </section>

      {/* Form Container */}
      <section className="-mt-6 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-4xl">
          
          {/* Banner para nuevos ingresantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-blue-950 font-medium">
              <Users className="w-5 h-5 text-blue-600 shrink-0" />
              <span>¿Busca vacante para un estudiante que no cursa actualmente en la Fundación?</span>
            </div>
            <Link 
              href="/preinscripciones"
              className="text-xs font-bold text-blue-800 hover:text-blue-950 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0"
            >
              Ir a Preinscripciones <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80">
            <EnrollmentForm />
          </div>
        </div>
      </section>
    </div>
  );
}
