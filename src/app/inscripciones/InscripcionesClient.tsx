"use client";

import { useState } from "react";
import { EnrollmentForm } from "./form";
import { PreinscripcionForm } from "../preinscripciones/form";
import { ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Control temporal para deshabilitar la pestaña de Nuevos Ingresantes durante el período exclusivo de reinscripciones
const SHOW_PREINSCRIPCIONES = false;

export function InscripcionesClient() {
  const [activeMode, setActiveMode] = useState<"reinscripcion" | "preinscripcion">("reinscripcion");

  return (
    <div>
      {/* Selector de Modalidad (Visible solo si Nuevos Ingresantes está habilitado) */}
      {SHOW_PREINSCRIPCIONES && (
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner max-w-lg w-full">
            <button
              type="button"
              onClick={() => setActiveMode("reinscripcion")}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeMode === "reinscripcion"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:text-slate-950"
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Reinscripción 2027</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("preinscripcion")}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeMode === "preinscripcion"
                  ? "bg-brand-blue text-white shadow-md"
                  : "text-slate-700 hover:text-slate-950"
              )}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Nuevos Ingresantes</span>
            </button>
          </div>
        </div>
      )}

      {/* Renderizado de la opción activa */}
      {(!SHOW_PREINSCRIPCIONES || activeMode === "reinscripcion") ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Alumnos Actuales
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Reinscripción — Ciclo Lectivo 2027
              </h2>
            </div>
          </div>
          <EnrollmentForm />
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80 max-w-3xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Aspirantes Nuevos
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Solicitud de Admisión y Lista de Espera
              </h2>
            </div>
          </div>
          <PreinscripcionForm />
        </div>
      )}
    </div>
  );
}
