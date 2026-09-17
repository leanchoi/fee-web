import { Metadata } from "next";
import { Suspense } from "react";
import { FormalizacionClient } from "./FormalizacionClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Formalización de Matrícula – Ciclo Lectivo 2027 | Fundación Educativa Esquel",
  description: "Portal oficial de formalización y firma digital de matrícula para nuevos aspirantes admitidos de la Fundación Educativa Esquel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FormalizacionPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header Institucional */}
      <section className="pt-28 pb-12 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-emerald-500/30">
            Ciclo Lectivo 2027
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight">
            Portal de Admisión & Formalización
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Fundación Educativa Esquel · Escuelas N.º 1030 y N.º 1739
          </p>
        </div>
      </section>

      {/* Main Client Content */}
      <main className="container mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <Suspense fallback={
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-wider">Cargando datos de matrícula...</p>
          </div>
        }>
          <FormalizacionClient />
        </Suspense>
      </main>
    </div>
  );
}
