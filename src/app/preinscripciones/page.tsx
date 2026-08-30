import { Metadata } from "next";
import { PreinscripcionForm } from "./form";

export const metadata: Metadata = {
  title: "Preinscripciones Ciclo Lectivo 2027 | Fundación Educativa Esquel",
  description: "Formulario de admisión e ingreso para nuevos estudiantes en Nivel Inicial, Primario y Secundario para el Ciclo Lectivo 2027.",
};

export default function PreinscripcionesPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen pb-24">
      {/* Header */}
      <section className="pt-28 pb-16 bg-brand-blue text-white relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="inline-block bg-white/10 text-brand-yellow text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 border border-white/20">
            Convocatoria Abierta • Ingresantes 2027
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 max-w-4xl mx-auto tracking-tight leading-tight">
            Preinscripción Ciclo Lectivo 2027
          </h1>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto text-slate-200 leading-relaxed font-normal">
            Registro oficial de aspirantes para Nivel Inicial, Primario (Escuela N.º 1030) y Secundario (Escuela N.º 1739).
          </p>
        </div>
      </section>

      {/* Notice & Form */}
      <section className="-mt-6 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-3xl">
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80">
            <PreinscripcionForm />
          </div>
        </div>
      </section>
    </div>
  );
}
