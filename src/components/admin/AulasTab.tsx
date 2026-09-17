"use client";

import React, { useState, useMemo } from "react";
import { 
  School, 
  Users, 
  Search, 
  Filter, 
  Layers, 
  Plus, 
  Minus, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info, 
  X, 
  Download, 
  MessageCircle, 
  Link as LinkIcon, 
  Send,
  Loader2
} from "lucide-react";
import { AulaCard } from "./AulaCard";
import { AulaStudentItem } from "./AulaStudentCard";
import { CleanBaseStudent } from "@/lib/familyConsolidator";
import { cn } from "@/lib/utils";

interface AulasTabProps {
  cleanStudents: CleanBaseStudent[];
  preinscripcionesList: any[];
  isSuperAdmin: boolean;
  onRefreshData?: () => void;
}

// Configuración canónica de aulas de la Fundación Educativa Esquel
interface AulaConfig {
  id: string;
  gradeName: string;
  level: "Nivel Inicial" | "Nivel Primario" | "Nivel Secundario";
  school: "Escuela N.º 1030" | "Escuela N.º 1739";
  capacity: number;
  aliases: string[];
}

const AULAS_CONFIG: AulaConfig[] = [
  // Nivel Inicial - Escuela N.º 1030 (Cupo 25)
  { id: "ini-3", gradeName: "Sala de 3", level: "Nivel Inicial", school: "Escuela N.º 1030", capacity: 25, aliases: ["sala de 3", "sala 3", "3 años", "3 anos"] },
  { id: "ini-4", gradeName: "Sala de 4", level: "Nivel Inicial", school: "Escuela N.º 1030", capacity: 25, aliases: ["sala de 4", "sala 4", "4 años", "4 anos"] },
  { id: "ini-5", gradeName: "Sala de 5", level: "Nivel Inicial", school: "Escuela N.º 1030", capacity: 25, aliases: ["sala de 5", "sala 5", "5 años", "5 anos"] },

  // Nivel Primario - Escuela N.º 1030 (Cupo 30)
  { id: "pri-1", gradeName: "1° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["1° grado", "1º grado", "1 grado", "primer grado", "1ro"] },
  { id: "pri-2", gradeName: "2° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["2° grado", "2º grado", "2 grado", "segundo grado", "2do"] },
  { id: "pri-3", gradeName: "3° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["3° grado", "3º grado", "3 grado", "tercer grado", "3ro"] },
  { id: "pri-4", gradeName: "4° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["4° grado", "4º grado", "4 grado", "cuarto grado", "4to"] },
  { id: "pri-5", gradeName: "5° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["5° grado", "5º grado", "5 grado", "quinto grado", "5to"] },
  { id: "pri-6", gradeName: "6° Grado", level: "Nivel Primario", school: "Escuela N.º 1030", capacity: 30, aliases: ["6° grado", "6º grado", "6 grado", "sexto grado", "6to"] },

  // Nivel Secundario - Escuela N.º 1739 (Cupo 30)
  { id: "sec-1", gradeName: "1° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["1° año", "1º año", "1 año", "primer año", "1er año"] },
  { id: "sec-2", gradeName: "2° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["2° año", "2º año", "2 año", "segundo año", "2do año"] },
  { id: "sec-3", gradeName: "3° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["3° año", "3º año", "3 año", "tercer año", "3er año"] },
  { id: "sec-4", gradeName: "4° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["4° año", "4º año", "4 año", "cuarto año", "4to año"] },
  { id: "sec-5", gradeName: "5° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["5° año", "5º año", "5 año", "quinto año", "5to año"] },
  { id: "sec-6", gradeName: "6° Año", level: "Nivel Secundario", school: "Escuela N.º 1739", capacity: 30, aliases: ["6° año", "6º año", "6 año", "sexto año", "6to año"] },
];

function normalizeGradeString(raw: string): string {
  if (!raw) return "";
  return raw.toLowerCase().trim().replace(/º/g, "°").replace(/\s+/g, " ");
}

export function AulasTab({
  cleanStudents,
  preinscripcionesList,
  isSuperAdmin,
  onRefreshData
}: AulasTabProps) {
  // Filtros
  const [levelFilter, setLevelFilter] = useState<"all" | "Nivel Inicial" | "Nivel Primario" | "Nivel Secundario">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);

  // Modal 360° para inspección y edición de estudiante
  const [inspectingStudent, setInspectingStudent] = useState<AulaStudentItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Estado local reactivo de overrides inmediatos (optimistic updates)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { admissionStatus?: string; formalizationToken?: string }>>({});

  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/(?:^|;\s*)fee_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  // Convertir CleanBaseStudent (reinscripciones) a AulaStudentItem
  const regularStudentItems: AulaStudentItem[] = useMemo(() => {
    return cleanStudents.map((s) => ({
      id: s.id,
      studentName: s.studentName,
      studentDni: s.studentDni,
      studentGrade: s.studentGrade,
      studentLevel: s.studentLevel,
      school: s.school,
      formKind: "reinscripcion" as const,
      parent1Name: s.parent1Name,
      parent1Phone: s.parent1Phone,
      parent1Email: s.parent1Email,
      raw: s
    }));
  }, [cleanStudents]);

  // Convertir preinscripcionesList (aspirantes) a AulaStudentItem con overrides inmediatos
  const preinscriptosItems: AulaStudentItem[] = useMemo(() => {
    return preinscripcionesList.map((e) => {
      const override = statusOverrides[e.id];
      const admissionStatus = override?.admissionStatus || e.admissionStatus || "recibida";
      const formalizationToken = override?.formalizationToken || e.formalizationToken;

      return {
        id: e.id,
        studentName: e.studentName,
        studentDni: e.studentDni,
        studentGrade: e.studentGrade,
        studentLevel: e.studentLevel,
        school: e.school || "Escuela N.º 1030",
        formKind: "preinscripcion" as const,
        admissionStatus,
        formalizationToken,
        formalizationSignedAt: e.formalizationSignedAt,
        isStaffChild: Boolean(e.isStaffChild),
        hasSiblingInSchool: Boolean(e.hasSiblingInSchool),
        englishLevelAchieved: e.englishLevelAchieved,
        parent1Name: e.parent1Name || e.tutorName || "Tutor/a",
        parent1Phone: e.parent1Phone || e.tutorPhone,
        parent1Email: e.parent1Email || e.tutorEmail,
        raw: e
      };
    });
  }, [preinscripcionesList, statusOverrides]);

  // Consolidar todos los estudiantes
  const allStudents = useMemo(() => {
    return [...regularStudentItems, ...preinscriptosItems];
  }, [regularStudentItems, preinscriptosItems]);

  // Agrupar estudiantes por cada aula canónica
  const aulasData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return AULAS_CONFIG.map((aula) => {
      // Filtrar estudiantes asignados a esta aula
      const studentsForAula = allStudents.filter((s) => {
        const gradeNorm = normalizeGradeString(s.studentGrade);
        const matchGrade = aula.aliases.some((alias) => gradeNorm.includes(alias)) || gradeNorm === normalizeGradeString(aula.gradeName);
        if (!matchGrade) return false;

        // Búsqueda libre
        if (q) {
          const corpus = [
            s.studentName,
            s.studentDni,
            s.parent1Name,
            s.parent1Phone,
            s.parent1Email,
            s.raw?.trackingNumber
          ].filter(Boolean).join(" ").toLowerCase();

          return corpus.includes(q);
        }

        return true;
      });

      return {
        ...aula,
        students: studentsForAula
      };
    });
  }, [allStudents, searchQuery]);

  // Filtrado por nivel educativo
  const filteredAulas = useMemo(() => {
    if (levelFilter === "all") return aulasData;
    return aulasData.filter((a) => a.level === levelFilter);
  }, [aulasData, levelFilter]);

  // Métricas globales consolidadas
  const globalMetrics = useMemo(() => {
    let totalCapacidad = 0;
    let totalRegulares = 0;
    let totalConfirmados = 0;
    let totalReservados = 0;
    let totalEnEvaluacion = 0;
    let totalListaEspera = 0;

    aulasData.forEach((a) => {
      totalCapacidad += a.capacity;
      a.students.forEach((s) => {
        if (s.formKind === "reinscripcion") {
          totalRegulares++;
        } else {
          const st = s.admissionStatus || "recibida";
          if (st === "confirmada" || s.formalizationSignedAt) totalConfirmados++;
          else if (st === "admitida" || st === "aprobada_pendiente_firma") totalReservados++;
          else if (st === "lista_espera") totalListaEspera++;
          else totalEnEvaluacion++;
        }
      });
    });

    const totalOcupados = totalRegulares + totalConfirmados + totalReservados;
    const vacantesDisponibles = Math.max(0, totalCapacidad - totalOcupados);

    return {
      totalCapacidad,
      totalRegulares,
      totalConfirmados,
      totalReservados,
      totalEnEvaluacion,
      totalListaEspera,
      totalOcupados,
      vacantesDisponibles
    };
  }, [aulasData]);

  // Acción: Actualizar estado de aspirante
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsProcessingAction(true);

    // 1. Actualización inmediata y optimista en UI (0ms)
    setStatusOverrides(prev => ({
      ...prev,
      [id]: { ...prev[id], admissionStatus: newStatus }
    }));

    try {
      const res = await fetch("/api/admin.php?action=update_admission_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ids: [id],
          admissionStatus: newStatus,
          sendEmail: true
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.tokens && json.tokens[id]) {
          setStatusOverrides(prev => ({
            ...prev,
            [id]: { ...prev[id], admissionStatus: newStatus, formalizationToken: json.tokens[id] }
          }));
        }
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Error al actualizar estado de admisión.");
        // Revertir en caso de error
        setStatusOverrides(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
      setStatusOverrides(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Acción: Reenviar correo de formalización
  const handleResendEmail = async (id: string) => {
    setIsProcessingAction(true);
    try {
      const res = await fetch("/api/admin.php?action=resend_formalization_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({ id })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.token) {
          setStatusOverrides(prev => ({
            ...prev,
            [id]: { ...prev[id], formalizationToken: json.token }
          }));
        }
        if (json.mailSent) {
          alert("¡Correo de formalización enviado exitosamente a la familia!");
        } else {
          alert(`El enlace fue generado: ${json.directUrl}\n\nNota SMTP: ${json.mailError || "Omitido en servidor"}`);
        }
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "No se pudo despachar el correo.");
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Encabezado y Selector de Vistas ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
              Cohorte 2027
            </span>
            <span className="text-xs text-slate-500 font-bold">· Distribución Oficial de Alumnos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <School className="w-7 h-7 text-brand-blue" />
            Aulas & Cupos 2027
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Vista integral de conformación de aulas, vacantes aseguradas, aspirantes preinscriptos y nóminas de espera.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setForceExpandAll(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Expandir Mazos</span>
          </button>
          <button
            type="button"
            onClick={() => setForceExpandAll(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Colapsar Mazos</span>
          </button>
        </div>
      </div>

      {/* ── Cartel de Criterios de Agregación y Auditoría ── */}
      <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Criterio de Consolidación de Aulas:</strong> Cada aula se nutre de dos afluentes: (1) <strong>Alumnos Regulares</strong> con derecho adquirido desduplicados según su última reinscripción válida (tarjetas azules); y (2) <strong>Aspirantes Nuevos</strong> según el curso solicitado para 2027 (tarjetas amarillas, amarillo+verde, verde+azul o rojas según su estado administrativo).
        </div>
      </div>

      {/* ── Franja de Métricas Consolidadas ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Métrica 1: Capacidad Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Capacidad Proyectada</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {globalMetrics.totalCapacidad}
          </div>
          <span className="text-[11px] text-slate-500">15 aulas</span>
        </div>

        {/* Métrica 2: Regulares Reinscriptos */}
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Regulares
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
            {globalMetrics.totalRegulares}
          </div>
          <span className="text-[11px] text-slate-500">Cupo asegurado</span>
        </div>

        {/* Métrica 3: Nuevos Confirmados */}
        <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/40 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Formalizados
          </span>
          <div className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-300 mt-0.5">
            {globalMetrics.totalConfirmados}
          </div>
          <span className="text-[11px] text-slate-500">Contrato firmado</span>
        </div>

        {/* Métrica 4: Vacantes Reservadas */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Pendiente Firma
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
            {globalMetrics.totalReservados}
          </div>
          <span className="text-[11px] text-slate-500">Invitación enviada</span>
        </div>

        {/* Métrica 5: Vacantes Disponibles */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Vacantes Libres</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            {globalMetrics.vacantesDisponibles}
          </div>
          <span className="text-[11px] text-slate-500">Disponibilidad real</span>
        </div>

        {/* Métrica 6: Lista de Espera */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Lista de Espera
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-0.5">
            {globalMetrics.totalListaEspera}
          </div>
          <span className="text-[11px] text-slate-500">Aspirantes condicionales</span>
        </div>
      </div>

      {/* ── Filtros por Nivel y Buscador Rápido ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Pestañas de Nivel Educativo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Todas las Aulas (15)" },
            { id: "Nivel Inicial", label: "Nivel Inicial (3)" },
            { id: "Nivel Primario", label: "Nivel Primario (6)" },
            { id: "Nivel Secundario", label: "Nivel Secundario (6)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLevelFilter(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer",
                levelFilter === tab.id
                  ? "bg-brand-blue text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador de Alumno o Tutor */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar alumno, DNI o tutor..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Lista de Aulas ── */}
      <div className="space-y-6">
        {filteredAulas.map((aula) => (
          <AulaCard
            key={aula.id}
            gradeName={aula.gradeName}
            level={aula.level}
            school={aula.school}
            capacity={aula.capacity}
            students={aula.students}
            forceExpandAll={forceExpandAll}
            onInspect={(st) => setInspectingStudent(st)}
            onUpdateStatus={handleUpdateStatus}
            onResendEmail={handleResendEmail}
          />
        ))}

        {filteredAulas.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
            <School className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="font-bold text-sm">No se encontraron aulas para el criterio seleccionado.</p>
          </div>
        )}
      </div>

      {/* ── Modal / Ficha 360° del Estudiante con 'dvh' ── */}
      {inspectingStudent && (
        <div 
          onClick={() => setInspectingStudent(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden pt-safe"
          >
            {/* Cabecera del Modal */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-brand-blue text-white rounded-xl">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    {inspectingStudent.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    DNI {inspectingStudent.studentDni} · {inspectingStudent.studentGrade} ({inspectingStudent.school})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Expediente */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300 scrollbar-thin">
              {/* Bloque Identidad y Escuela */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identidad y Estado</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Tipo de Trámite:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {inspectingStudent.formKind === "reinscripcion" ? "Reinscripción Oficial (Regular)" : "Preinscripción de Aspirante"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Estado Actual:</span>
                    <strong className="text-slate-900 dark:text-white capitalize">
                      {inspectingStudent.admissionStatus || "Recibida"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Responsables Parentales */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contacto Familiar</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">Responsable Titular:</span>
                    <strong className="text-slate-900 dark:text-white">{inspectingStudent.parent1Name}</strong>
                    {inspectingStudent.parent1Phone && <span className="block text-slate-500">Tel: {inspectingStudent.parent1Phone}</span>}
                    {inspectingStudent.parent1Email && <span className="block text-slate-500">Email: {inspectingStudent.parent1Email}</span>}
                  </div>
                  {inspectingStudent.raw?.parent2Name && (
                    <div>
                      <span className="text-slate-500 block">Segundo Responsable:</span>
                      <strong className="text-slate-900 dark:text-white">{inspectingStudent.raw.parent2Name}</strong>
                      {inspectingStudent.raw.parent2Phone && <span className="block text-slate-500">Tel: {inspectingStudent.raw.parent2Phone}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Enlace y Token de Formalización */}
              {inspectingStudent.formalizationToken && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider">
                      Enlace Único de Formalización Digital
                    </span>
                    {inspectingStudent.formalizationSignedAt && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Ya Firmado ({new Date(inspectingStudent.formalizationSignedAt).toLocaleDateString("es-AR")})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    {window.location.origin}/formalizacion?token={inspectingStudent.formalizationToken}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/formalizacion?token=${inspectingStudent.formalizationToken}`;
                        navigator.clipboard.writeText(url);
                        alert("Enlace copiado al portapapeles.");
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Copiar Enlace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResendEmail(inspectingStudent.id)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                    >
                      Reenviar por Correo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
