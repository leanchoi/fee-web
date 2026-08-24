import { Metadata } from "next";
import { EnrollmentForm } from "../inscripciones/form";
import { AlertTriangle } from "lucide-react";

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
          
          {/* Cartel Rojo de Aviso Importante */}
          <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 sm:p-7 mb-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl shrink-0 shadow-md">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    Aviso Importante — Período Exclusivo
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-red-900 leading-snug">
                  Habilitado únicamente para alumnos que ya estén anotados en la institución y hermanos/as de los mismos.
                </h3>
                <p className="text-xs sm:text-sm text-red-800 font-medium leading-relaxed">
                  El período de inscripción regular para <strong className="font-extrabold text-red-950 underline decoration-red-400 decoration-2">nuevos alumnos</strong> a la institución iniciará con posterioridad a esta etapa de reinscripción.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80">
            <EnrollmentForm />
          </div>
        </div>
      </section>
    </div>
  );
}
