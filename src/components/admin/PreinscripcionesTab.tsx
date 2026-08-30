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
  Sparkles
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
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<"all" | "Escuela N.º 1030" | "Escuela N.º 1739">("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "inicial" | "primario" | "secundario">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "staff" | "sibling">("all");

  // Selección múltiple para acciones en lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal para detalle completo de aspirante
  const [inspectingAspirant, setInspectingAspirant] = useState<any | null>(null);

  // Helper para CSRF token
  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/(?:^|;\s*)fee_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
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
          e.comments
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
  const handleUpdateAdmissionStatus = async (ids: string[], newStatus: string) => {
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
          admissionStatus: newStatus
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSelectedIds([]);
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
      "Comentarios"
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

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    recibida: { bg: "bg-slate-100", text: "text-slate-800", label: "Recibida" },
    entrevista_agendada: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Entrevista Agendada" },
    entrevista_realizada: { bg: "bg-blue-100", text: "text-blue-900", label: "Entrevista Realizada" },
    admitida: { bg: "bg-emerald-100", text: "text-emerald-900", label: "Admitida" },
    lista_espera: { bg: "bg-amber-100", text: "text-amber-900", label: "Lista de Espera" },
    no_admitida: { bg: "bg-red-100", text: "text-red-900", label: "No Admitida" },
    desistida: { bg: "bg-zinc-200", text: "text-zinc-800", label: "Desistida" }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand-blue" />
            Preinscripciones & Admisiones 2027
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Padrón de aspirantes a vacante para Nivel Inicial, Primario (1030) y Secundario (1739).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV (Excel)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-slate-500 block">Total Aspirantes</span>
          <span className="text-2xl font-black text-slate-900">{preinscripcionesList.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-indigo-600 block">Entrevistas Agendadas</span>
          <span className="text-2xl font-black text-indigo-900">
            {preinscripcionesList.filter(a => (a.admissionStatus || "recibida") === "entrevista_agendada").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-emerald-600 block">Admitidos</span>
          <span className="text-2xl font-black text-emerald-900">
            {preinscripcionesList.filter(a => a.admissionStatus === "admitida").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase text-amber-600 block">Con Criterio Prioridad</span>
          <span className="text-2xl font-black text-amber-900">
            {preinscripcionesList.filter(a => a.isStaffChild || a.hasSiblingInSchool).length}
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre aspirante, DNI, tutor, teléfono, colegio de origen o N° de trámite..."
              className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl bg-white outline-none focus:ring-2 focus:ring-brand-blue font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border rounded-xl bg-white font-bold outline-none"
            >
              <option value="all">Todas las Escuelas</option>
              <option value="Escuela N.º 1030">Escuela N.º 1030 (Inicial y Primario)</option>
              <option value="Escuela N.º 1739">Escuela N.º 1739 (Secundario)</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs border rounded-xl bg-white font-bold outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="recibida">Recibida</option>
              <option value="entrevista_agendada">Entrevista Agendada</option>
              <option value="entrevista_realizada">Entrevista Realizada</option>
              <option value="admitida">Admitida</option>
              <option value="lista_espera">Lista de Espera</option>
              <option value="no_admitida">No Admitida</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border rounded-xl bg-white font-bold outline-none"
            >
              <option value="all">Cualquier Prioridad</option>
              <option value="staff">Hijos de Personal FEE</option>
              <option value="sibling">Hermanos en Escuela</option>
            </select>
          </div>
        </div>

        {/* Acciones Masivas en Lote */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-700" />
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

      {/* Tabla Tabular Compacta */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-8 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
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
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAspirants.map((a: any) => {
                const isSelected = selectedIds.includes(a.id);
                const currentStatus = a.admissionStatus || "recibida";
                const statusInfo = statusColors[currentStatus] || statusColors.recibida;

                return (
                  <tr 
                    key={a.id} 
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors",
                      isSelected && "bg-indigo-50/40"
                    )}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(a.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-brand-blue" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <strong className="text-slate-900 block">{a.trackingNumber || a.id.substring(0, 8)}</strong>
                      <span className="text-[10px] text-slate-400 font-sans">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-sm leading-tight">{a.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        DNI: <strong className="font-mono text-slate-700">{a.studentDni}</strong>
                        {a.studentBirthDate && <span className="ml-1.5">({a.studentBirthDate})</span>}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{a.studentGrade}</span>
                      <span className="text-[11px] text-slate-500">{a.school || "Escuela N.º 1030"}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        {a.isStaffChild && (
                          <button
                            type="button"
                            onClick={() => handleTogglePriority(a.id, a.priorityVerified)}
                            className={cn(
                              "text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer",
                              a.priorityVerified
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                : "bg-amber-100 text-amber-900 border-amber-300"
                            )}
                            title="Click para alternar verificación de prioridad"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Hijo Personal {a.priorityVerified ? "✓" : "(Pendiente)"}</span>
                          </button>
                        )}

                        {a.hasSiblingInSchool && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                            Hermano DNI {a.siblingDni || "---"}
                          </span>
                        )}

                        {!a.isStaffChild && !a.hasSiblingInSchool && (
                          <span className="text-[10px] text-slate-400">General</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-[11px]">
                      <div className="font-bold text-slate-800">{a.parent1Name || a.tutorName || "---"}</div>
                      <div className="text-slate-500 flex items-center gap-1">
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
                          statusInfo.text
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
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : null;
                        })()}

                        <button
                          type="button"
                          onClick={() => setInspectingAspirant(a)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Ver ficha completa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isSuperAdmin && onDeleteEnrollment && (
                          <button
                            type="button"
                            onClick={() => onDeleteEnrollment(a.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
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

      {/* MODAL DE FICHA COMPLETA DE ASPIRANTE */}
      {inspectingAspirant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Trámite: {inspectingAspirant.trackingNumber || inspectingAspirant.id}
                </span>
                <h3 className="text-lg font-black text-slate-900">{inspectingAspirant.studentName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingAspirant(null)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border space-y-1.5">
                <span className="font-black text-slate-900 block uppercase text-[10px]">Datos del Aspirante:</span>
                <p><strong>DNI:</strong> {inspectingAspirant.studentDni} • <strong>F. Nacimiento:</strong> {inspectingAspirant.studentBirthDate || "---"} ({inspectingAspirant.studentNationality || "Argentina"})</p>
                <p><strong>Curso Solicitado:</strong> {inspectingAspirant.studentGrade} ({inspectingAspirant.school || "Escuela N.º 1030"})</p>
                <p><strong>Colegio de Origen:</strong> {inspectingAspirant.currentSchool || "---"} (Gestión {inspectingAspirant.currentSchoolType || "publica"})</p>
                {inspectingAspirant.hasDebtClearance && <p className="text-emerald-800 font-bold">✓ Compromiso de presentación de Libre Deuda asumido.</p>}
              </div>

              {/* Inglés */}
              {inspectingAspirant.englishAccreditationType && inspectingAspirant.englishAccreditationType !== "ninguno" && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-1">
                  <span className="font-black text-indigo-950 block uppercase text-[10px]">Acreditación de Idioma Inglés:</span>
                  <p><strong>Tipo:</strong> {inspectingAspirant.englishAccreditationType}</p>
                  <p><strong>Instituto / Colegio:</strong> {inspectingAspirant.englishInstituteName || "---"}</p>
                  <p><strong>Nivel Alcanzado:</strong> {inspectingAspirant.englishLevelAchieved || "---"}</p>
                </div>
              )}

              {/* Responsables */}
              <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                <span className="font-black text-slate-900 block uppercase text-[10px]">Responsables Parentales:</span>
                <p><strong>Resp 1:</strong> {inspectingAspirant.parent1Name || inspectingAspirant.tutorName} (DNI {inspectingAspirant.parent1Dni}) • Tel: {inspectingAspirant.parent1Phone || inspectingAspirant.tutorPhone}</p>
                <p><strong>Email:</strong> {inspectingAspirant.parent1Email || inspectingAspirant.tutorEmail}</p>
                <p><strong>Domicilio:</strong> {inspectingAspirant.parent1Address}, {inspectingAspirant.parent1City}</p>
                {inspectingAspirant.parent2Name && (
                  <p><strong>Resp 2:</strong> {inspectingAspirant.parent2Name} (DNI {inspectingAspirant.parent2Dni}) • Tel: {inspectingAspirant.parent2Phone}</p>
                )}
              </div>

              {/* Salud y Contactos */}
              {(inspectingAspirant.healthDisabilities || inspectingAspirant.healthAllergiesMedication || inspectingAspirant.emergencyContactName) && (
                <div className="bg-slate-50 p-4 rounded-xl border space-y-1.5">
                  <span className="font-black text-slate-900 block uppercase text-[10px]">Salud & Emergencias (Ley 25.326):</span>
                  {inspectingAspirant.emergencyContactName && <p><strong>Contacto Emergencia:</strong> {inspectingAspirant.emergencyContactName} ({inspectingAspirant.emergencyContactPhone})</p>}
                  {inspectingAspirant.healthDisabilities && <p><strong>CUD / Apoyo:</strong> {inspectingAspirant.healthDisabilities}</p>}
                  {inspectingAspirant.healthAllergiesMedication && <p><strong>Alergias / Tratamiento:</strong> {inspectingAspirant.healthAllergiesMedication}</p>}
                </div>
              )}

              {inspectingAspirant.comments && (
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200">
                  <span className="font-black text-amber-900 block uppercase text-[10px]">Comentarios / Observaciones:</span>
                  <p className="text-slate-800">{inspectingAspirant.comments}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingAspirant(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
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
