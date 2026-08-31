"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckSquare, 
  Square, 
  MessageCircle, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  School, 
  BookOpen, 
  Clock, 
  ChevronRight,
  X,
  Sparkles,
  LayoutGrid,
  List,
  Printer,
  FileText,
  Save,
  Check,
  Building2,
  GraduationCap,
  HeartPulse,
  User,
  Shield,
  FileCheck2,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreinscripcionesTabProps {
  preinscripcionesList: any[];
  isSuperAdmin: boolean;
  onRefreshData?: () => void;
  onDeleteEnrollment?: (id: string) => void;
}

export function PreinscripcionesTab({ 
  preinscripcionesList, 
  isSuperAdmin, 
  onRefreshData,
  onDeleteEnrollment 
}: PreinscripcionesTabProps) {
  // Modo de visualización: Tarjetas de expediente o Tabla compacta
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<"all" | "Escuela N.º 1030" | "Escuela N.º 1739">("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "inicial" | "primario" | "secundario">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "staff" | "sibling">("all");

  // Selección múltiple para acciones en lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal para detalle 360° de aspirante
  const [inspectingAspirant, setInspectingAspirant] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"general" | "prioridades" | "familia" | "salud" | "resolucion">("general");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Helper para CSRF token
  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/(?:^|;\s*)fee_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  // Sincronizar notas cuando se abre el modal
  const handleOpenModal = (aspirant: any) => {
    setInspectingAspirant(aspirant);
    setInternalNotes(aspirant.admissionNotes || "");
    setModalTab("general");
    setNotesSaveSuccess(false);
  };

  // Filtrado de aspirantes
  const filteredAspirants = useMemo(() => {
    return preinscripcionesList.filter((e: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const corpus = [
          e.studentName,
          e.studentDni,
          e.parent1Name,
          e.parent1Dni,
          e.parent1Phone,
          e.parent1Email,
          e.parent2Name,
          e.parent2Dni,
          e.studentGrade,
          e.studentLevel,
          e.school,
          e.trackingNumber,
          e.currentSchool,
          e.staffMemberName,
          e.siblingDni,
          e.englishInstituteName,
          e.englishLevelAchieved,
          e.emergencyContactName,
          e.emergencyContactPhone,
          e.comments,
          e.admissionNotes
        ].filter(Boolean).join(" ").toLowerCase();

        if (!terms.every(t => corpus.includes(t))) return false;
      }

      // 2. School Filter
      if (schoolFilter !== "all") {
        const sch = (e.school || "Escuela N.º 1030").toLowerCase();
        if (schoolFilter === "Escuela N.º 1030" && !sch.includes("1030")) return false;
        if (schoolFilter === "Escuela N.º 1739" && !sch.includes("1739")) return false;
      }

      // 3. Level Filter
      if (levelFilter !== "all") {
        const lvl = (e.studentLevel || e.studentGrade || "").toLowerCase();
        if (!lvl.includes(levelFilter)) return false;
      }

      // 4. Admission Status Filter
      if (statusFilter !== "all") {
        const s = e.admissionStatus || "recibida";
        if (s !== statusFilter) return false;
      }

      // 5. Priority Filter
      if (priorityFilter === "staff" && !e.isStaffChild) return false;
      if (priorityFilter === "sibling" && !e.hasSiblingInSchool) return false;

      return true;
    });
  }, [preinscripcionesList, searchQuery, schoolFilter, levelFilter, statusFilter, priorityFilter]);

  // Selección masiva
  const handleSelectAll = () => {
    if (selectedIds.length === filteredAspirants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAspirants.map(a => a.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Actualizar estado de admisión (individual o masivo)
  const handleUpdateAdmissionStatus = async (ids: string[], newStatus: string, notes?: string) => {
    if (ids.length === 0) return;
    setIsUpdatingStatus(true);

    try {
      const res = await fetch("/api/admin.php?action=update_admission_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ids: ids,
          admissionStatus: newStatus,
          admissionNotes: notes !== undefined ? notes : internalNotes
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (ids.length > 1) setSelectedIds([]);
        if (inspectingAspirant && ids.includes(inspectingAspirant.id)) {
          setInspectingAspirant((prev: any) => prev ? { ...prev, admissionStatus: newStatus, admissionNotes: notes !== undefined ? notes : internalNotes } : null);
        }
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Error al actualizar estado de admisión.");
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Guardar notas internas de resolución directiva
  const handleSaveInternalNotes = async () => {
    if (!inspectingAspirant) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);

    try {
      const res = await fetch("/api/admin.php?action=update_admission_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ids: [inspectingAspirant.id],
          admissionStatus: inspectingAspirant.admissionStatus || "recibida",
          admissionNotes: internalNotes
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNotesSaveSuccess(true);
        setInspectingAspirant((prev: any) => prev ? { ...prev, admissionNotes: internalNotes } : null);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setNotesSaveSuccess(false), 3000);
      } else {
        alert(json.error || "Error al guardar notas de admisión.");
      }
    } catch (e: any) {
      alert("Error de conexión: " + e.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Toggle verificación de prioridad
  const handleTogglePriority = async (id: string, currentVerified: boolean) => {
    try {
      const res = await fetch("/api/admin.php?action=verify_priority", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          id: id,
          priorityVerified: currentVerified ? 0 : 1
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (inspectingAspirant && inspectingAspirant.id === id) {
          setInspectingAspirant((prev: any) => prev ? { ...prev, priorityVerified: currentVerified ? 0 : 1 } : null);
        }
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {}
  };

  // Exportar a CSV con BOM UTF-8 y separador ";"
  const handleExportCsv = () => {
    if (filteredAspirants.length === 0) return;

    const headers = [
      "N° Trámite",
      "Fecha Presentación",
      "Aspirante",
      "DNI Aspirante",
      "Género",
      "Fecha Nacimiento",
      "Nacionalidad",
      "Escuela",
      "Nivel",
      "Curso/Sala Solicitado",
      "Escuela Actual",
      "Gestión Escuela Actual",
      "Libre Deuda Aceptado",
      "Repitió Año",
      "Grado Repetido",
      "Materias Pendientes (1739)",
      "Hijo Personal FEE",
      "Nombre Agente FEE",
      "DNI Agente FEE",
      "Hermano en Escuela",
      "DNI Hermano",
      "Grado Hermano",
      "Prioridad Verificada",
      "Acreditación Inglés",
      "Instituto Inglés",
      "Nivel Inglés",
      "Responsable 1",
      "DNI Resp 1",
      "Vínculo Resp 1",
      "Teléfono Resp 1",
      "Email Resp 1",
      "Ocupación Resp 1",
      "Domicilio",
      "Ciudad",
      "Único Responsable",
      "Responsable 2",
      "DNI Resp 2",
      "Teléfono Resp 2",
      "Email Resp 2",
      "Contacto Emergencia",
      "Tel Emergencia",
      "Salud/CUD",
      "Alergias/Medicación",
      "Estado Admisión",
      "Notas Administrativas Directivas",
      "Comentarios Familia"
    ];

    const rows = filteredAspirants.map((a: any) => [
      a.trackingNumber || a.id,
      new Date(a.createdAt).toLocaleString("es-AR"),
      a.studentName,
      a.studentDni,
      a.studentGender || "---",
      a.studentBirthDate || "---",
      a.studentNationality || "Argentina",
      a.school || "Escuela N.º 1030",
      a.studentLevel || "Nivel Primario",
      a.studentGrade,
      a.currentSchool || "---",
      a.currentSchoolType || "publica",
      a.hasDebtClearance ? "SÍ" : "NO",
      a.hasRepeated ? "SÍ" : "NO",
      a.repeatedGrade || "---",
      a.pendingSubjects || "---",
      a.isStaffChild ? "SÍ" : "NO",
      a.staffMemberName || "---",
      a.staffMemberDni || "---",
      a.hasSiblingInSchool ? "SÍ" : "NO",
      a.siblingDni || "---",
      a.siblingCurrentGrade || "---",
      a.priorityVerified ? "SÍ" : "NO",
      a.englishAccreditationType || "ninguno",
      a.englishInstituteName || "---",
      a.englishLevelAchieved || "---",
      a.parent1Name || a.tutorName || "---",
      a.parent1Dni || "---",
      a.parent1Relationship || "Madre/Padre",
      a.parent1Phone || a.tutorPhone || "---",
      a.parent1Email || a.tutorEmail || "---",
      a.parent1Occupation || "---",
      a.parent1Address || "---",
      a.parent1City || "Esquel",
      a.isSingleParent ? "SÍ" : "NO",
      a.parent2Name || "---",
      a.parent2Dni || "---",
      a.parent2Phone || "---",
      a.parent2Email || "---",
      a.emergencyContactName || "---",
      a.emergencyContactPhone || "---",
      a.healthDisabilities || "---",
      a.healthAllergiesMedication || "---",
      a.admissionStatus || "recibida",
      a.admissionNotes || "",
      a.comments || ""
    ]);

    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h}"`).join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Preinscripciones_2027_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWhatsAppUrl = (phone: string, studentName: string, trackingNumber?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.length === 10) clean = "549" + clean;
    else if (clean.length === 11 && clean.startsWith("0")) clean = "549" + clean.substring(1);
    else if (!clean.startsWith("54")) clean = "549" + clean;

    const text = encodeURIComponent(
      `Hola! Nos comunicamos desde la Fundación Educativa Esquel (Escuela 1030 / 1739) respecto a la solicitud de preinscripción de ${studentName}${trackingNumber ? ` (Trámite ${trackingNumber})` : ""}.`
    );
    return `https://wa.me/${clean}?text=${text}`;
  };

  const statusColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    recibida: { bg: "bg-slate-100 dark:bg-slate-800/60", text: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-700", label: "Recibida" },
    entrevista_agendada: { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-900 dark:text-indigo-200", border: "border-indigo-300 dark:border-indigo-800", label: "Entrevista Agendada" },
    entrevista_realizada: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-900 dark:text-blue-200", border: "border-blue-300 dark:border-blue-800", label: "Entrevista Realizada" },
    admitida: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-900 dark:text-emerald-200", border: "border-emerald-300 dark:border-emerald-800", label: "Admitida" },
    lista_espera: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-900 dark:text-amber-200", border: "border-amber-300 dark:border-amber-800", label: "Lista de Espera" },
    no_admitida: { bg: "bg-red-100 dark:bg-red-950/60", text: "text-red-900 dark:text-red-200", border: "border-red-300 dark:border-red-800", label: "No Admitida" },
    desistida: { bg: "bg-zinc-200 dark:bg-zinc-800/60", text: "text-zinc-800 dark:text-zinc-300", border: "border-zinc-300 dark:border-zinc-700", label: "Desistida" }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-blue" />
            Preinscripciones & Admisiones 2027
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Padrón de aspirantes a vacante para Nivel Inicial, Primario (1030) y Secundario (1739).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Modo de Vista (Tarjetas vs Tabla) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "cards" 
                  ? "bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Vista en tarjetas de expediente"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                viewMode === "table" 
                  ? "bg-white dark:bg-slate-700 text-brand-blue dark:text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Vista en tabla compacta"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Aspirantes</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{preinscripcionesList.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Entrevistas Agendadas</span>
          <span className="text-2xl font-black text-indigo-900 dark:text-indigo-300">
            {preinscripcionesList.filter(a => (a.admissionStatus || "recibida") === "entrevista_agendada").length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">Admitidos</span>
          <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300">
            {preinscripcionesList.filter(a => a.admissionStatus === "admitida").length}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 block">Con Criterio Prioridad</span>
          <span className="text-2xl font-black text-amber-900 dark:text-amber-300">
            {preinscripcionesList.filter(a => a.isStaffChild || a.hasSiblingInSchool).length}
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre aspirante, DNI, tutor, teléfono, colegio de origen o N° de trámite..."
              className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-blue font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">Todas las Escuelas</option>
              <option value="Escuela N.º 1030">Escuela N.º 1030 (Inicial y Primario)</option>
              <option value="Escuela N.º 1739">Escuela N.º 1739 (Secundario)</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="recibida">Recibida</option>
              <option value="entrevista_agendada">Entrevista Agendada</option>
              <option value="entrevista_realizada">Entrevista Realizada</option>
              <option value="admitida">Admitida</option>
              <option value="lista_espera">Lista de Espera</option>
              <option value="no_admitida">No Admitida</option>
              <option value="desistida">Desistida</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white font-bold outline-none cursor-pointer"
            >
              <option value="all">Cualquier Prioridad</option>
              <option value="staff">Hijos de Personal FEE</option>
              <option value="sibling">Hermanos en Escuela</option>
            </select>
          </div>
        </div>

        {/* Acciones Masivas en Lote */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              {selectedIds.length} aspirante(s) seleccionado(s)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateAdmissionStatus(selectedIds, "entrevista_realizada")}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Marcar Entrevista Realizada
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateAdmissionStatus(selectedIds, "admitida")}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Admitir Seleccionados
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateAdmissionStatus(selectedIds, "lista_espera")}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Pasar a Lista de Espera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VISTA A: FICHAS / TARJETAS EN CUADRÍCULA (Cards Grid View) */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAspirants.map((a: any) => {
            const isSelected = selectedIds.includes(a.id);
            const currentStatus = a.admissionStatus || "recibida";
            const statusInfo = statusColors[currentStatus] || statusColors.recibida;
            const wa = getWhatsAppUrl(a.parent1Phone || a.tutorPhone, a.studentName, a.trackingNumber);

            return (
              <div 
                key={a.id}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl border p-4.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative",
                  isSelected 
                    ? "border-brand-blue ring-2 ring-brand-blue/30 bg-blue-50/20" 
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {/* Header de la tarjeta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(a.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        title={isSelected ? "Deseleccionar" : "Seleccionar"}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-brand-blue" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className="font-mono text-[11px] font-extrabold text-brand-blue dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/80 dark:border-blue-800">
                        {a.trackingNumber || a.id.substring(0, 8)}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(a.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>

                  {/* Datos del Aspirante */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {a.studentName}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>DNI: <strong className="font-mono text-slate-800 dark:text-slate-200">{a.studentDni}</strong></span>
                      {a.studentBirthDate && <span className="text-slate-400">({a.studentBirthDate})</span>}
                    </div>
                  </div>

                  {/* Grado y Escuela */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-sky-300 border border-brand-blue/20">
                      {a.studentGrade || "Sin sala"}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {a.school || "Escuela N.º 1030"}
                    </span>
                  </div>

                  {/* Prioridades e Inglés (Renderizado seguro sin ceros) */}
                  {(Boolean(a.isStaffChild) || Boolean(a.hasSiblingInSchool) || (a.englishAccreditationType && a.englishAccreditationType !== "ninguno")) ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Boolean(a.isStaffChild) && (
                        <button
                          type="button"
                          onClick={() => handleTogglePriority(a.id, a.priorityVerified)}
                          className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs",
                            a.priorityVerified
                              ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800"
                          )}
                          title="Click para alternar verificación de prioridad"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Hijo Personal {a.priorityVerified ? "✓ Verificado" : "(Pendiente)"}</span>
                        </button>
                      )}

                      {Boolean(a.hasSiblingInSchool) && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 shadow-2xs">
                          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Hermano DNI {a.siblingDni || "---"}
                        </span>
                      )}

                      {a.englishAccreditationType && a.englishAccreditationType !== "ninguno" && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
                          Inglés: {a.englishAccreditationType}
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Origen & Contacto */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                    {a.currentSchool && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          <span className="text-slate-400">Origen:</span> {a.currentSchool}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white truncate">{a.parent1Name || a.tutorName || "Tutor"}</span>
                      </div>
                      {a.parent1Phone && (
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                          {a.parent1Phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer de la tarjeta: Estado y Acciones Organizadas */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Estado:</span>
                    <select
                      value={currentStatus}
                      onChange={e => handleUpdateAdmissionStatus([a.id], e.target.value)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-black rounded-lg border outline-none cursor-pointer flex-1 transition-all",
                        statusInfo.bg,
                        statusInfo.text,
                        statusInfo.border
                      )}
                    >
                      <option value="recibida">Recibida</option>
                      <option value="entrevista_agendada">Entrevista Agendada</option>
                      <option value="entrevista_realizada">Entrevista Realizada</option>
                      <option value="admitida">Admitida</option>
                      <option value="lista_espera">Lista de Espera</option>
                      <option value="no_admitida">No Admitida</option>
                      <option value="desistida">Desistida</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(a)}
                      className="flex-1 px-3 py-2 text-brand-blue dark:text-sky-300 bg-blue-50/80 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-blue-200/80 dark:border-slate-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Ver expediente 360°"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha 360°</span>
                    </button>

                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors shrink-0"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    {a.parent1Email && (
                      <a
                        href={`mailto:${a.parent1Email}`}
                        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
                        title="Enviar correo"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}

                    {isSuperAdmin && onDeleteEnrollment && (
                      <button
                        type="button"
                        onClick={() => onDeleteEnrollment(a.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 transition-colors cursor-pointer shrink-0"
                        title="Eliminar solicitud"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAspirants.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-400">No se encontraron solicitudes de preinscripción</p>
              <p className="text-xs text-slate-400 mt-1">Intente cambiando los filtros de búsqueda o el estado de admisión.</p>
            </div>
          )}
        </div>
      )}

      {/* VISTA B: TABLA TABULAR COMPACTA (Table View) */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-8 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      {selectedIds.length === filteredAspirants.length && filteredAspirants.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-brand-blue" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">N° Trámite / Fecha</th>
                  <th className="py-3 px-3">Aspirante & DNI</th>
                  <th className="py-3 px-3">Curso & Institución</th>
                  <th className="py-3 px-3">Prioridad</th>
                  <th className="py-3 px-3">Contacto Familiar</th>
                  <th className="py-3 px-3">Estado de Admisión</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredAspirants.map((a: any) => {
                  const isSelected = selectedIds.includes(a.id);
                  const currentStatus = a.admissionStatus || "recibida";
                  const statusInfo = statusColors[currentStatus] || statusColors.recibida;

                  return (
                    <tr 
                      key={a.id} 
                      className={cn(
                        "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors",
                        isSelected && "bg-indigo-50/40 dark:bg-indigo-950/40"
                      )}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(a.id)}
                          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-blue" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        <strong className="text-slate-900 dark:text-white block">{a.trackingNumber || a.id.substring(0, 8)}</strong>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {new Date(a.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{a.studentName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          DNI: <strong className="font-mono text-slate-700 dark:text-slate-300">{a.studentDni}</strong>
                          {a.studentBirthDate && <span className="ml-1.5">({a.studentBirthDate})</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{a.studentGrade}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{a.school || "Escuela N.º 1030"}</span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          {Boolean(a.isStaffChild) && (
                            <button
                              type="button"
                              onClick={() => handleTogglePriority(a.id, a.priorityVerified)}
                              className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer",
                                a.priorityVerified
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300"
                              )}
                              title="Click para alternar verificación de prioridad"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Hijo Personal {a.priorityVerified ? "✓" : "(Pendiente)"}</span>
                            </button>
                          )}

                          {Boolean(a.hasSiblingInSchool) && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Hermano DNI {a.siblingDni || "---"}
                            </span>
                          )}

                          {!Boolean(a.isStaffChild) && !Boolean(a.hasSiblingInSchool) && (
                            <span className="text-[10px] text-slate-400">General</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{a.parent1Name || a.tutorName || "---"}</div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{a.parent1Phone || a.tutorPhone || "---"}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={currentStatus}
                          onChange={e => handleUpdateAdmissionStatus([a.id], e.target.value)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-black rounded-lg border outline-none cursor-pointer",
                            statusInfo.bg,
                            statusInfo.text,
                            statusInfo.border
                          )}
                        >
                          <option value="recibida">Recibida</option>
                          <option value="entrevista_agendada">Entrevista Agendada</option>
                          <option value="entrevista_realizada">Entrevista Realizada</option>
                          <option value="admitida">Admitida</option>
                          <option value="lista_espera">Lista de Espera</option>
                          <option value="no_admitida">No Admitida</option>
                          <option value="desistida">Desistida</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(() => {
                            const wa = getWhatsAppUrl(a.parent1Phone || a.tutorPhone, a.studentName, a.trackingNumber);
                            return wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            ) : null;
                          })()}

                          <button
                            type="button"
                            onClick={() => handleOpenModal(a)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isSuperAdmin && onDeleteEnrollment && (
                            <button
                              type="button"
                              onClick={() => onDeleteEnrollment(a.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                              title="Eliminar solicitud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAspirants.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No se encontraron solicitudes de preinscripción con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / POP-UP 360° DE EXPEDIENTE COMPLETO DEL ASPIRANTE */}
      {inspectingAspirant && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-800/60 rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black uppercase text-brand-blue dark:text-sky-400 bg-brand-blue/10 dark:bg-brand-blue/20 px-2.5 py-0.5 rounded-md">
                    Trámite: {inspectingAspirant.trackingNumber || inspectingAspirant.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    • Presentado el {new Date(inspectingAspirant.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {inspectingAspirant.studentName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {inspectingAspirant.studentGrade} • {inspectingAspirant.school || "Escuela N.º 1030"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Imprimir expediente"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingAspirant(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Pestañas de Navegación */}
            <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
              <button
                type="button"
                onClick={() => setModalTab("general")}
                className={cn(
                  "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  modalTab === "general"
                    ? "border-brand-blue text-brand-blue dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Aspirante & Origen</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("prioridades")}
                className={cn(
                  "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  modalTab === "prioridades"
                    ? "border-brand-blue text-brand-blue dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>Prioridades & Inglés</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("familia")}
                className={cn(
                  "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  modalTab === "familia"
                    ? "border-brand-blue text-brand-blue dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <User className="w-4 h-4" />
                <span>Responsables Parentales</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("salud")}
                className={cn(
                  "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  modalTab === "salud"
                    ? "border-brand-blue text-brand-blue dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <HeartPulse className="w-4 h-4" />
                <span>Salud & Emergencias</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab("resolucion")}
                className={cn(
                  "px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  modalTab === "resolucion"
                    ? "border-brand-blue text-brand-blue dark:text-sky-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Resolución & Notas</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {/* TAB 1: ASPIRANTE & ORIGEN */}
              {modalTab === "general" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Datos de Identidad del Aspirante
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <p><strong>Nombre:</strong> {inspectingAspirant.studentName}</p>
                      <p><strong>DNI:</strong> <span className="font-mono font-bold">{inspectingAspirant.studentDni}</span></p>
                      <p><strong>Género:</strong> {inspectingAspirant.studentGender || "No especificado"}</p>
                      <p><strong>F. Nacimiento:</strong> {inspectingAspirant.studentBirthDate || "---"}</p>
                      <p><strong>Nacionalidad:</strong> {inspectingAspirant.studentNationality || "Argentina"}</p>
                      <p><strong>Lugar de Nacimiento:</strong> {inspectingAspirant.studentBirthPlace || "Esquel"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Trayectoria Escolar & Colegio de Origen
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <p><strong>Colegio Actual / Previo:</strong> {inspectingAspirant.currentSchool || "No informado"}</p>
                      <p><strong>Tipo de Gestión:</strong> Escuela {inspectingAspirant.currentSchoolType || "pública"}</p>
                      <p><strong>¿Repitió Grado / Año?:</strong> {inspectingAspirant.hasRepeated ? `SÍ (${inspectingAspirant.repeatedGrade || "No especificado"})` : "NO"}</p>
                      <p><strong>Libre Deuda Financiero:</strong> {inspectingAspirant.hasDebtClearance ? <span className="text-emerald-700 font-bold">✓ Compromiso firmado</span> : "No requerido / pendiente"}</p>
                    </div>
                    {inspectingAspirant.pendingSubjects && (
                      <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                        <strong className="text-amber-900 dark:text-amber-300 block mb-1">Materias Pendientes de Acreditación (Secundario 1739):</strong>
                        <p>{inspectingAspirant.pendingSubjects}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PRIORIDADES & INGLÉS */}
              {modalTab === "prioridades" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Criterios de Prioridad Institucional
                    </span>
                    
                    {/* Hijo de Personal */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 dark:text-white block">Hijo/a de Personal de la FEE:</strong>
                        {inspectingAspirant.isStaffChild ? (
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                            Agente: <strong>{inspectingAspirant.staffMemberName}</strong> (DNI {inspectingAspirant.staffMemberDni})
                          </p>
                        ) : (
                          <p className="text-slate-400">No aplica</p>
                        )}
                      </div>
                      {inspectingAspirant.isStaffChild && (
                        <button
                          type="button"
                          onClick={() => handleTogglePriority(inspectingAspirant.id, inspectingAspirant.priorityVerified)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all",
                            inspectingAspirant.priorityVerified
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-amber-500 text-white shadow-xs"
                          )}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{inspectingAspirant.priorityVerified ? "Prioridad Validada ✓" : "Validar Prioridad"}</span>
                        </button>
                      )}
                    </div>

                    {/* Hermano en Escuela */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <strong className="text-slate-900 dark:text-white block">Hermano/a Regular en la Escuela:</strong>
                      {inspectingAspirant.hasSiblingInSchool ? (
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                          DNI Hermano: <strong className="font-mono">{inspectingAspirant.siblingDni}</strong> {inspectingAspirant.siblingCurrentGrade ? `• Sala/Grado: ${inspectingAspirant.siblingCurrentGrade}` : ""}
                        </p>
                      ) : (
                        <p className="text-slate-400">No aplica</p>
                      )}
                    </div>
                  </div>

                  {/* Acreditación de Inglés */}
                  <div className="bg-purple-50/70 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2">
                    <span className="font-black text-purple-950 dark:text-purple-300 block uppercase text-[10px] tracking-wider">
                      Acreditación de Conocimientos en Idioma Inglés
                    </span>
                    <p><strong>Tipo de Acreditación:</strong> {inspectingAspirant.englishAccreditationType || "Sin acreditación previa"}</p>
                    {inspectingAspirant.englishInstituteName && (
                      <p><strong>Instituto o Escuela de Procedencia:</strong> {inspectingAspirant.englishInstituteName}</p>
                    )}
                    {inspectingAspirant.englishLevelAchieved && (
                      <p><strong>Nivel / Examen Alcanzado:</strong> {inspectingAspirant.englishLevelAchieved}</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FAMILIA & CONTACTO */}
              {modalTab === "familia" && (
                <div className="space-y-4">
                  {/* Responsable 1 */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                        Responsable Parental Principal (1)
                      </span>
                      {(() => {
                        const wa = getWhatsAppUrl(inspectingAspirant.parent1Phone || inspectingAspirant.tutorPhone, inspectingAspirant.studentName, inspectingAspirant.trackingNumber);
                        return wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        ) : null;
                      })()}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <p><strong>Nombre:</strong> {inspectingAspirant.parent1Name || inspectingAspirant.tutorName}</p>
                      <p><strong>DNI:</strong> <span className="font-mono">{inspectingAspirant.parent1Dni || "---"}</span></p>
                      <p><strong>Vínculo:</strong> {inspectingAspirant.parent1Relationship || "Padre/Madre/Tutor"}</p>
                      <p><strong>Teléfono:</strong> {inspectingAspirant.parent1Phone || inspectingAspirant.tutorPhone || "---"}</p>
                      <p><strong>Email:</strong> {inspectingAspirant.parent1Email || inspectingAspirant.tutorEmail || "---"}</p>
                      <p><strong>Ocupación:</strong> {inspectingAspirant.parent1Occupation || "No informada"}</p>
                      <p className="sm:col-span-2"><strong>Domicilio:</strong> {inspectingAspirant.parent1Address || "---"}, {inspectingAspirant.parent1City || "Esquel"} ({inspectingAspirant.parent1PostalCode || "9200"})</p>
                    </div>
                  </div>

                  {/* Responsable 2 */}
                  {!inspectingAspirant.isSingleParent && (inspectingAspirant.parent2Name || inspectingAspirant.parent2Phone) ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                        Responsable Parental Secundario (2)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <p><strong>Nombre:</strong> {inspectingAspirant.parent2Name}</p>
                        <p><strong>DNI:</strong> <span className="font-mono">{inspectingAspirant.parent2Dni || "---"}</span></p>
                        <p><strong>Vínculo:</strong> {inspectingAspirant.parent2Relationship || "Madre/Padre/Tutora"}</p>
                        <p><strong>Teléfono:</strong> {inspectingAspirant.parent2Phone || "---"}</p>
                        <p><strong>Email:</strong> {inspectingAspirant.parent2Email || "---"}</p>
                        <p><strong>Ocupación:</strong> {inspectingAspirant.parent2Occupation || "No informada"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 text-xs italic">
                      Hogar monoparental / Único responsable declarado formalmente.
                    </div>
                  )}

                  {/* Custodia y Retiros */}
                  {(inspectingAspirant.legalCustodyInfo || inspectingAspirant.authorizedPickups) && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                        Aspectos Legales & Retiro del Establecimiento
                      </span>
                      {inspectingAspirant.legalCustodyInfo && (
                        <p><strong>Situación de Custodia / Patria Potestad:</strong> {inspectingAspirant.legalCustodyInfo}</p>
                      )}
                      {inspectingAspirant.authorizedPickups && (
                        <p><strong>Personas Autorizadas a Retirar:</strong> {inspectingAspirant.authorizedPickups}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SALUD & EMERGENCIAS */}
              {modalTab === "salud" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Contactos de Emergencia
                    </span>
                    <p><strong>Nombre de Referencia:</strong> {inspectingAspirant.emergencyContactName || "No informado"}</p>
                    <p><strong>Teléfono de Contacto:</strong> {inspectingAspirant.emergencyContactPhone || "No informado"}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Salud, Apoyos Pedagógicos & Medicación (Ley 25.326)
                    </span>
                    <p><strong>CUD / Acompañamiento / Discapacidad:</strong> {inspectingAspirant.healthDisabilities || "Sin indicaciones declaradas"}</p>
                    <p><strong>Alergias / Tratamientos Médicos Crónicos:</strong> {inspectingAspirant.healthAllergiesMedication || "Sin indicaciones declaradas"}</p>
                  </div>

                  {inspectingAspirant.comments && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1">
                      <span className="font-black text-amber-950 dark:text-amber-300 block uppercase text-[10px] tracking-wider">
                        Consultas u Observaciones Planteadas por la Familia
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 italic">{inspectingAspirant.comments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: RESOLUCIÓN ADMINISTRATIVA & NOTAS DIRECTIVAS */}
              {modalTab === "resolucion" && (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="font-black text-slate-900 dark:text-white block uppercase text-[10px] tracking-wider">
                      Resolución del Estado de Admisión
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Estado Actual:
                      </label>
                      <select
                        value={inspectingAspirant.admissionStatus || "recibida"}
                        onChange={e => handleUpdateAdmissionStatus([inspectingAspirant.id], e.target.value)}
                        className={cn(
                          "px-3 py-2 text-xs font-black rounded-xl border outline-none cursor-pointer",
                          statusColors[inspectingAspirant.admissionStatus || "recibida"]?.bg,
                          statusColors[inspectingAspirant.admissionStatus || "recibida"]?.text,
                          statusColors[inspectingAspirant.admissionStatus || "recibida"]?.border
                        )}
                      >
                        <option value="recibida">Recibida</option>
                        <option value="entrevista_agendada">Entrevista Agendada</option>
                        <option value="entrevista_realizada">Entrevista Realizada</option>
                        <option value="admitida">Admitida</option>
                        <option value="lista_espera">Lista de Espera</option>
                        <option value="no_admitida">No Admitida</option>
                        <option value="desistida">Desistida</option>
                      </select>

                      {inspectingAspirant.decidedBy && (
                        <span className="text-[11px] text-slate-400">
                          (Modificado por: {inspectingAspirant.decidedBy})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                        Notas Internas del Equipo Directivo & Evaluador
                      </span>
                      {notesSaveSuccess && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" /> ¡Guardado!
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      placeholder="Escriba aquí notas de entrevista, ponderación de vacante, diagnósticos o acuerdos específicos con la familia (visible sólo para el personal directivo)..."
                      className="w-full p-3 text-xs border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={handleSaveInternalNotes}
                        className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingNotes ? "Guardando..." : "Guardar Notas"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400">
                Fundación Educativa Esquel • Sistema de Admisiones
              </span>
              <button
                type="button"
                onClick={() => setInspectingAspirant(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

