"use client";

import { useState, useEffect } from "react";
import { EnrollmentForm } from "./form";
import { PreinscripcionForm } from "../preinscripciones/form";
import { ShieldCheck, Users, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function InscripcionesClient() {
  const [mode, setMode] = useState<"reinscripciones" | "preinscripciones" | "cerrado">("reinscripciones");
  const [cohort, setCohort] = useState<number>(2027);
  const [isLoading, setIsLoading] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.mode) {
            setMode(data.mode);
          }
          if (data.mode === "preinscripciones" && data.preinscripciones) {
            setCohort(data.preinscripciones.cohort || 2027);
            setClosedMessage(data.preinscripciones.closedMessage || "");
          } else if (data.reinscripciones) {
            setCohort(data.reinscripciones.cohort || 2027);
            setClosedMessage(data.reinscripciones.closedMessage || "");
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Cargando portal de admisiones...</p>
      </div>
    );
  }

  // MODO 1: PREINSCRIPCIONES (Nuevos Ingresantes)
  if (mode === "preinscripciones") {
    return (
      <div className="space-y-6">
        {/* Banner Informativo Preinscripciones */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-brand-blue text-white rounded-2xl shrink-0 shadow-md">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-brand-blue text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  Convocatoria Abierta — Ciclo {cohort}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-blue-950 leading-snug">
                Preinscripción y Solicitud de Vacantes para Nuevos Ingresantes
              </h3>
              <p className="text-xs sm:text-sm text-blue-900 font-medium leading-relaxed">
                Habilitado para aspirantes a <strong className="font-extrabold text-blue-950">Nivel Inicial (Jardín), Primaria (Escuela N.º 1030) y Secundaria (Escuela N.º 1739)</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80 max-w-4xl mx-auto">
          <PreinscripcionForm />
        </div>
      </div>
    );
  }

  // MODO 2: REINSCRIPCIONES (Alumnos Regulares)
  if (mode === "reinscripciones") {
    return (
      <div className="space-y-6">
        {/* Cartel Rojo de Aviso Importante */}
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
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
                Habilitado únicamente para la reinscripción de estudiantes que ya concurren a la Fundación.
              </h3>
              <p className="text-xs sm:text-sm text-red-800 font-medium leading-relaxed">
                El período de inscripción para <strong className="font-extrabold text-red-950 underline decoration-red-400 decoration-2">nuevos ingresantes</strong> a la institución iniciará con posterioridad a esta etapa de reinscripción.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-xl border border-slate-200/80 max-w-4xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Alumnos Actuales
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Reinscripción — Ciclo Lectivo {cohort}
              </h2>
            </div>
          </div>
          <EnrollmentForm />
        </div>
      </div>
    );
  }

  // MODO 3: CERRADO
  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 text-center max-w-xl mx-auto space-y-5">
      <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-md">
        <AlertCircle className="w-8 h-8" />
      </div>
      <span className="inline-block bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-amber-300">
        Convocatorias en Pausa
      </span>
      <h2 className="text-2xl font-black text-slate-900">Período de Inscripción No Disponible</h2>
      <p className="text-sm text-slate-600 leading-relaxed">
        {closedMessage || "Actualmente no hay convocatorias activas para el ciclo lectivo. Por favor comuníquese con la administración."}
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1 text-left">
        <p className="font-bold text-slate-800">Canales de Contacto Administrativo:</p>
        <p>• Escuela N.º 1030 (Inicial y Primario): +54 2945 45-1030</p>
        <p>• Escuela N.º 1739 (Secundario): +54 2945 45-1739</p>
        <p>• Email: administracion@fundacionesquel.edu.ar</p>
      </div>
    </div>
  );
}
