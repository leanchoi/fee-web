"use client";

import React, { useState, useMemo } from "react";
import { 
  School, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { StudentDeck } from "./StudentDeck";
import { AulaStudentItem } from "./AulaStudentCard";
import { cn } from "@/lib/utils";

interface AulaCardProps {
  id?: string;
  gradeName: string;
  level: string;
  school: string;
  capacity?: number;
  students: AulaStudentItem[];
  forceExpandAll?: boolean;
  onInspect: (student: AulaStudentItem) => void;
  onUpdateStatus?: (id: string, newStatus: string) => Promise<void>;
  onResendEmail?: (id: string) => Promise<void>;
  isSuperAdmin?: boolean;
  onDelete?: (student: AulaStudentItem) => void;
}

interface AulaTheme {
  badgeLabel: string;
  numberLabel: string;
  bgBadge: string;
  ringColor: string;
  borderLeft: string;
  borderGeneral: string;
  headerGradient: string;
  badgeLevel: string;
  cycleBadge?: string;
}

function getAulaTheme(gradeName: string, level: string): AulaTheme {
  const g = gradeName.toLowerCase();
  
  if (level === "Nivel Inicial" || g.includes("sala")) {
    const num = g.includes("3") ? "3" : g.includes("4") ? "4" : "5";
    const is5 = num === "5";
    return {
      badgeLabel: "Sala",
      numberLabel: num,
      bgBadge: is5 ? "bg-amber-600 text-white" : "bg-amber-500 text-white",
      ringColor: "ring-amber-100 dark:ring-amber-950/60",
      borderLeft: is5 ? "border-l-amber-600" : "border-l-amber-500",
      borderGeneral: "border-amber-200/80 dark:border-amber-900/50",
      headerGradient: "bg-gradient-to-r from-amber-50/70 dark:from-amber-950/25 via-transparent to-transparent",
      badgeLevel: "bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700",
      cycleBadge: is5 ? "Preescolar" : undefined
    };
  }

  if (level === "Nivel Primario" || g.includes("grado")) {
    const match = g.match(/\d+/);
    const numVal = match ? parseInt(match[0], 10) : 1;
    const isFirstCycle = numVal <= 3;
    return {
      badgeLabel: "Grado",
      numberLabel: `${numVal}°`,
      bgBadge: isFirstCycle ? "bg-blue-600 text-white" : "bg-sky-600 text-white",
      ringColor: isFirstCycle ? "ring-blue-100 dark:ring-blue-950/60" : "ring-sky-100 dark:ring-sky-950/60",
      borderLeft: isFirstCycle ? "border-l-blue-600" : "border-l-sky-600",
      borderGeneral: isFirstCycle ? "border-blue-200/80 dark:border-blue-900/50" : "border-sky-200/80 dark:border-sky-900/50",
      headerGradient: isFirstCycle
        ? "bg-gradient-to-r from-blue-50/70 dark:from-blue-950/25 via-transparent to-transparent"
        : "bg-gradient-to-r from-sky-50/70 dark:from-sky-950/25 via-transparent to-transparent",
      badgeLevel: "bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
      cycleBadge: isFirstCycle ? "1° Ciclo" : "2° Ciclo"
    };
  }

  // Nivel Secundario
  const match = g.match(/\d+/);
  const numVal = match ? parseInt(match[0], 10) : 1;
  const isBasicCycle = numVal <= 3;
  return {
    badgeLabel: "Año",
    numberLabel: `${numVal}°`,
    bgBadge: isBasicCycle ? "bg-purple-600 text-white" : "bg-indigo-600 text-white",
    ringColor: isBasicCycle ? "ring-purple-100 dark:ring-purple-950/60" : "ring-indigo-100 dark:ring-indigo-950/60",
    borderLeft: isBasicCycle ? "border-l-purple-600" : "border-l-indigo-600",
    borderGeneral: isBasicCycle ? "border-purple-200/80 dark:border-purple-900/50" : "border-indigo-200/80 dark:border-indigo-900/50",
    headerGradient: isBasicCycle
      ? "bg-gradient-to-r from-purple-50/70 dark:from-purple-950/25 via-transparent to-transparent"
      : "bg-gradient-to-r from-indigo-50/70 dark:from-indigo-950/25 via-transparent to-transparent",
    badgeLevel: "bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700",
    cycleBadge: isBasicCycle ? "Ciclo Básico" : "Bachiller"
  };
}

export function AulaCard({
  id,
  gradeName,
  level,
  school,
  capacity = 30,
  students,
  forceExpandAll,
  onInspect,
  onUpdateStatus,
  onResendEmail,
  isSuperAdmin,
  onDelete
}: AulaCardProps) {
  const [isAulaOpen, setIsAulaOpen] = useState(true);

  // Clasificación de estudiantes dentro del aula
  const {
    regulares,
    enEvaluacion,
    reservados,
    confirmados,
    listaEspera
  } = useMemo(() => {
    const reg: AulaStudentItem[] = [];
    const evalList: AulaStudentItem[] = [];
    const resList: AulaStudentItem[] = [];
    const confList: AulaStudentItem[] = [];
    const waitList: AulaStudentItem[] = [];

    students.forEach((s) => {
      if (s.formKind === "reinscripcion") {
        reg.push(s);
      } else {
        const st = s.admissionStatus || "recibida";
        if (st === "confirmada" || s.formalizationSignedAt) {
          confList.push(s);
        } else if (st === "admitida" || st === "aprobada_pendiente_firma") {
          resList.push(s);
        } else if (st === "lista_espera") {
          waitList.push(s);
        } else {
          evalList.push(s);
        }
      }
    });

    return {
      regulares: reg,
      enEvaluacion: evalList,
      reservados: resList,
      confirmados: confList,
      listaEspera: waitList
    };
  }, [students]);

  // Métricas de ocupación del aula
  const totalOcupados = regulares.length + confirmados.length + reservados.length;
  const cuposLibres = Math.max(0, capacity - totalOcupados);
  const porcentajeOcupacion = Math.min(100, Math.round((totalOcupados / capacity) * 100));

  // Porcentajes de tramos de la barra segmentada
  const pRegulares = Math.min(100, (regulares.length / capacity) * 100);
  const pConfirmados = Math.min(100 - pRegulares, (confirmados.length / capacity) * 100);
  const pReservados = Math.min(100 - pRegulares - pConfirmados, (reservados.length / capacity) * 100);

  const theme = useMemo(() => getAulaTheme(gradeName, level), [gradeName, level]);

  return (
    <div 
      id={id ? `aula-${id}` : undefined}
      className={cn(
        "bg-white dark:bg-slate-900 border-2 rounded-3xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md border-l-8 scroll-mt-28",
        theme.borderLeft,
        theme.borderGeneral
      )}
    >
      {/* ── Cabecera del Aula Diferenciada ── */}
      <div 
        onClick={() => setIsAulaOpen(!isAulaOpen)}
        className={cn(
          "p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none",
          theme.headerGradient
        )}
      >
        <div className="flex items-center gap-3.5">
          {/* Monograma Numérico de Grado */}
          <div className={cn(
            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-xs shrink-0 ring-4",
            theme.bgBadge,
            theme.ringColor
          )}>
            <span className="text-[9px] font-bold uppercase tracking-widest leading-none opacity-90">
              {theme.badgeLabel}
            </span>
            <span className="text-xl font-black leading-tight">
              {theme.numberLabel}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                {gradeName}
              </h2>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                theme.badgeLevel
              )}>
                {level}
              </span>
              {theme.cycleBadge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {theme.cycleBadge}
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                · {school}
              </span>
            </div>

            {/* Ocupación y Vacantes */}
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                <strong>{totalOcupados}</strong> de <strong>{capacity}</strong> cupos cubiertos ({porcentajeOcupacion}%)
              </span>
              {cuposLibres > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {cuposLibres} {cuposLibres === 1 ? "vacante disponible" : "vacantes disponibles"}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                  Aula Completa
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Progreso y Acciones */}
        <div className="flex items-center gap-4">
          <div className="w-full md:w-56 space-y-1.5">
            {/* Barra Segmentada */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              {pRegulares > 0 && (
                <div 
                  style={{ width: `${pRegulares}%` }} 
                  className="bg-blue-600 h-full transition-all duration-500" 
                  title={`Regulares Reinscriptos: ${regulares.length}`} 
                />
              )}
              {pConfirmados > 0 && (
                <div 
                  style={{ width: `${pConfirmados}%` }} 
                  className="bg-teal-500 h-full transition-all duration-500" 
                  title={`Nuevos Formalizados: ${confirmados.length}`} 
                />
              )}
              {pReservados > 0 && (
                <div 
                  style={{ width: `${pReservados}%` }} 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  title={`Reservados Pendiente Firma: ${reservados.length}`} 
                />
              )}
            </div>

            {/* Leyenda Métrica Rápida */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" /> {regulares.length} Reg.
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> {confirmados.length} Nuev.
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {reservados.length} Res.
              </span>
              {listaEspera.length > 0 && (
                <span className="flex items-center gap-1 text-rose-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> +{listaEspera.length} Esp.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            {isAulaOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mazos de Tarjetas dentro del Aula ── */}
      {isAulaOpen && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Mazo 1: Alumnos Regulares Reinscriptos (Azul) */}
          <StudentDeck
            title="Alumnos Regulares Reinscriptos"
            subtitle="Estudiantes con cupo asegurado por derecho de reinscripción anual"
            deckType="blue"
            students={regulares}
            isExpanded={forceExpandAll !== undefined ? forceExpandAll : undefined}
            onInspect={onInspect}
            onUpdateStatus={onUpdateStatus}
            onResendEmail={onResendEmail}
            isSuperAdmin={isSuperAdmin}
            onDelete={onDelete}
          />

          {/* Mazo 2: Nuevos Aspirantes en Evaluación (Amarillo) */}
          <StudentDeck
            title="Aspirantes Nuevos en Evaluación"
            subtitle="Preinscripciones recibidas en proceso de análisis o entrevista directiva"
            deckType="yellow"
            students={enEvaluacion}
            isExpanded={forceExpandAll !== undefined ? forceExpandAll : undefined}
            onInspect={onInspect}
            onUpdateStatus={onUpdateStatus}
            onResendEmail={onResendEmail}
            isSuperAdmin={isSuperAdmin}
            onDelete={onDelete}
          />

          {/* Mazo 3: Vacantes Reservadas Pendiente de Firma (Amarillo + Verde) */}
          <StudentDeck
            title="Vacantes Reservadas · Pendiente de Formalización"
            subtitle="Aspirantes con vacante asignada a la espera de la firma del contrato digital"
            deckType="yellow-green"
            students={reservados}
            isExpanded={forceExpandAll !== undefined ? forceExpandAll : undefined}
            onInspect={onInspect}
            onUpdateStatus={onUpdateStatus}
            onResendEmail={onResendEmail}
            isSuperAdmin={isSuperAdmin}
            onDelete={onDelete}
          />

          {/* Mazo 4: Nuevas Matrículas Formalizadas & Confirmadas (Verde + Azul) */}
          <StudentDeck
            title="Nuevas Matrículas Oficializadas"
            subtitle="Aspirantes que completaron la firma digital del contrato y están formalizados en el aula"
            deckType="green-blue"
            students={confirmados}
            isExpanded={forceExpandAll !== undefined ? forceExpandAll : undefined}
            onInspect={onInspect}
            onUpdateStatus={onUpdateStatus}
            onResendEmail={onResendEmail}
            isSuperAdmin={isSuperAdmin}
            onDelete={onDelete}
          />

          {/* Mazo 5: Lista de Espera (Rojo) */}
          <StudentDeck
            title="Nómina en Lista de Espera"
            subtitle="Aspirantes condicionales por cupo de aula cubierto"
            deckType="red"
            students={listaEspera}
            isExpanded={forceExpandAll !== undefined ? forceExpandAll : undefined}
            onInspect={onInspect}
            onUpdateStatus={onUpdateStatus}
            onResendEmail={onResendEmail}
            isSuperAdmin={isSuperAdmin}
            onDelete={onDelete}
          />
        </div>
      )}
    </div>
  );
}
