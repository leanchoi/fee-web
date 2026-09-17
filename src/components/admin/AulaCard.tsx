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
  gradeName: string;
  level: string;
  school: string;
  capacity?: number;
  students: AulaStudentItem[];
  forceExpandAll?: boolean;
  onInspect: (student: AulaStudentItem) => void;
  onUpdateStatus?: (id: string, newStatus: string) => Promise<void>;
  onResendEmail?: (id: string) => Promise<void>;
}

export function AulaCard({
  gradeName,
  level,
  school,
  capacity = 30,
  students,
  forceExpandAll,
  onInspect,
  onUpdateStatus,
  onResendEmail
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* ── Cabecera del Aula ── */}
      <div 
        onClick={() => setIsAulaOpen(!isAulaOpen)}
        className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-blue text-white rounded-2xl shadow-xs shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {gradeName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {level}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {school}
              </span>
            </div>

            {/* Ocupación y Vacantes */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
              <span>
                <strong>{totalOcupados}</strong> de <strong>{capacity}</strong> cupos cubiertos ({porcentajeOcupacion}%)
              </span>
              {cuposLibres > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  · {cuposLibres} {cuposLibres === 1 ? "vacante disponible" : "vacantes disponibles"}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  · Aula Completa
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
          />
        </div>
      )}
    </div>
  );
}
