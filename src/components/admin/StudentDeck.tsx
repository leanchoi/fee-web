"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Minus, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { AulaStudentCard, AulaStudentItem } from "./AulaStudentCard";
import { cn } from "@/lib/utils";

interface StudentDeckProps {
  title: string;
  subtitle?: string;
  deckType: "blue" | "yellow" | "yellow-green" | "green-blue" | "red";
  students: AulaStudentItem[];
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  onInspect: (student: AulaStudentItem) => void;
  onUpdateStatus?: (id: string, newStatus: string) => Promise<void>;
  onResendEmail?: (id: string) => Promise<void>;
}

export function StudentDeck({
  title,
  subtitle,
  deckType,
  students,
  isExpanded: controlledExpanded,
  onToggleExpanded,
  onInspect,
  onUpdateStatus,
  onResendEmail
}: StudentDeckProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggle = () => {
    const next = !isExpanded;
    if (onToggleExpanded) {
      onToggleExpanded(next);
    } else {
      setInternalExpanded(next);
    }
  };

  // Paleta de estilos por tipo de mazo
  const deckStyles = {
    blue: {
      accent: "border-blue-500",
      badge: "bg-blue-600 text-white",
      deckBorder: "border-blue-300 dark:border-blue-800",
      deckBg: "bg-blue-50/90 dark:bg-blue-950/40",
      deckStack1: "border-blue-200 dark:border-blue-900 bg-blue-100/50 dark:bg-blue-950/20",
      deckStack2: "border-blue-100 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/10",
      icon: ShieldCheck,
      countText: "text-blue-900 dark:text-blue-300",
    },
    yellow: {
      accent: "border-amber-500",
      badge: "bg-amber-500 text-slate-950 font-black",
      deckBorder: "border-amber-300 dark:border-amber-800",
      deckBg: "bg-amber-50/90 dark:bg-amber-950/40",
      deckStack1: "border-amber-200 dark:border-amber-900 bg-amber-100/50 dark:bg-amber-950/20",
      deckStack2: "border-amber-100 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10",
      icon: Clock,
      countText: "text-amber-900 dark:text-amber-300",
    },
    "yellow-green": {
      accent: "border-emerald-500",
      badge: "bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-black",
      deckBorder: "border-emerald-300 dark:border-emerald-800",
      deckBg: "bg-gradient-to-r from-amber-50/80 to-emerald-50/80 dark:from-amber-950/30 dark:to-emerald-950/30",
      deckStack1: "border-emerald-200 dark:border-emerald-900 bg-emerald-100/40 dark:bg-emerald-950/20",
      deckStack2: "border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10",
      icon: Sparkles,
      countText: "text-emerald-900 dark:text-emerald-300",
    },
    "green-blue": {
      accent: "border-teal-500",
      badge: "bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-black",
      deckBorder: "border-teal-300 dark:border-teal-800",
      deckBg: "bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-950/30 dark:to-blue-950/30",
      deckStack1: "border-teal-200 dark:border-teal-900 bg-teal-100/40 dark:bg-teal-950/20",
      deckStack2: "border-teal-100 dark:border-teal-950 bg-teal-50/30 dark:bg-teal-950/10",
      icon: CheckCircle2,
      countText: "text-teal-900 dark:text-teal-300",
    },
    red: {
      accent: "border-rose-500",
      badge: "bg-rose-600 text-white font-black",
      deckBorder: "border-rose-300 dark:border-rose-800",
      deckBg: "bg-rose-50/90 dark:bg-rose-950/40",
      deckStack1: "border-rose-200 dark:border-rose-900 bg-rose-100/50 dark:bg-rose-950/20",
      deckStack2: "border-rose-100 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10",
      icon: AlertCircle,
      countText: "text-rose-900 dark:text-rose-300",
    }
  }[deckType];

  const Icon = deckStyles.icon;
  const count = students.length;

  if (count === 0) {
    return null; // Si no hay alumnos en este grupo, no renderiza para mantener la vista limpia
  }

  return (
    <div className="space-y-3">
      {/* ── Mazo Apilado (Cabecera / Bloque Sólido 3D) ── */}
      <div className="relative group">
        {/* Capas simuladas de cartas apiladas en 3D (visibles cuando está colapsado) */}
        {!isExpanded && count > 1 && (
          <>
            {/* Tercera capa de carta apilada */}
            <div 
              className={cn(
                "absolute -bottom-2 left-2 right-2 h-12 rounded-2xl border -z-20 transition-all duration-300 transform group-hover:translate-y-0.5",
                deckStyles.deckStack2
              )}
            />
            {/* Segunda capa de carta apilada */}
            <div 
              className={cn(
                "absolute -bottom-1 left-1 right-1 h-12 rounded-2xl border -z-10 transition-all duration-300 transform group-hover:translate-y-0.5",
                deckStyles.deckStack1
              )}
            />
          </>
        )}

        {/* Carta Principal / Frontal del Mazo */}
        <div 
          onClick={toggle}
          className={cn(
            "p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs",
            deckStyles.deckBg,
            deckStyles.deckBorder,
            isExpanded ? "shadow-sm ring-1 ring-slate-300 dark:ring-slate-700" : "hover:shadow-md hover:scale-[1.008]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn("p-2 rounded-xl text-white shadow-2xs shrink-0", deckStyles.badge)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {title}
                  </h3>
                  <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-black shrink-0", deckStyles.badge)}>
                    {count} {count === 1 ? "alumno" : "alumnos"}
                  </span>
                </div>
                {subtitle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Botón de Despliegue / Repliegue (+ / -) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              className={cn(
                "p-2 rounded-xl transition-all font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer",
                isExpanded 
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs hover:bg-slate-100 hover:shadow"
              )}
              title={isExpanded ? "Replegar mazo" : "Desplegar mazo"}
            >
              {isExpanded ? (
                <>
                  <Minus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Replegar</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desplegar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tarjetas Desplegadas (Grilla Animada) ── */}
      {isExpanded && (
        <div className="pl-2 sm:pl-3 pt-1 border-l-2 border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {students.map((student) => (
              <AulaStudentCard
                key={student.id}
                student={student}
                onInspect={onInspect}
                onUpdateStatus={onUpdateStatus}
                onResendEmail={onResendEmail}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
