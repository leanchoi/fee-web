"use client";

import React, { useState, useEffect } from "react";
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  RefreshCw, 
  Save, 
  FolderArchive, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Layers,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvocatoriasSettingsProps {
  userRole?: string;
  isSuperAdmin?: boolean;
  session?: any;
  onRefreshData?: () => void;
}

export function ConvocatoriasSettingsTab({ 
  userRole = "EDITOR", 
  isSuperAdmin: propIsSuperAdmin, 
  session, 
  onRefreshData 
}: ConvocatoriasSettingsProps) {
  const isSuperAdmin = propIsSuperAdmin !== undefined ? propIsSuperAdmin : (userRole === "SUPER_ADMIN" || session?.role === "SUPER_ADMIN");

  const [settings, setSettings] = useState<any>(null);
  const [cohortsList, setCohortsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [activeMode, setActiveMode] = useState<"reinscripciones" | "preinscripciones" | "cerrado">("reinscripciones");
  const [cohortYear, setCohortYear] = useState<number>(2027);
  const [vigenciaFechas, setVigenciaFechas] = useState<string>("");
  const [interviewNotice, setInterviewNotice] = useState<string>("");
  const [closedMsgRe, setClosedMsgRe] = useState<string>("");
  const [closedMsgPre, setClosedMsgPre] = useState<string>("");

  const [pendingModeChange, setPendingModeChange] = useState<{
    targetMode: "reinscripciones" | "preinscripciones" | "cerrado";
    title: string;
    description: string;
  } | null>(null);

  const [showCloseCohortModal, setShowCloseCohortModal] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isProcessingClose, setIsProcessingClose] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("fee_admin_token") : "";
    const match = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)fee_csrf=([^;]+)/) : null;
    const csrf = match ? decodeURIComponent(match[1]) : "";
    
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["X-Authorization"] = `Bearer ${token}`;
    }
    if (csrf) headers["X-CSRF-Token"] = csrf;
    return headers;
  };

  const fetchSettingsAndCohorts = async () => {
    setIsLoading(true);
    try {
      const resSet = await fetch("/api/settings.php", { 
        headers: getAuthHeaders(),
        credentials: "same-origin" 
      });
      const dataSet = await resSet.json();
      if (dataSet && (dataSet.reinscripciones || dataSet.success)) {
        setSettings(dataSet);
        const currentMode = dataSet.mode || (dataSet.reinscripciones?.isOpen ? "reinscripciones" : (dataSet.preinscripciones?.isOpen ? "preinscripciones" : "cerrado"));
        setActiveMode(currentMode);
        
        const yr = dataSet.reinscripciones?.cohort || dataSet.preinscripciones?.cohort || 2027;
        setCohortYear(yr);
        
        setVigenciaFechas(dataSet.vigencia_fechas || "");
        setInterviewNotice(dataSet.preinscripciones?.interviewNotice || "");
        setClosedMsgRe(dataSet.reinscripciones?.closedMessage || "");
        setClosedMsgPre(dataSet.preinscripciones?.closedMessage || "");
      }

      const resCoh = await fetch("/api/cohorts.php", { 
        headers: getAuthHeaders(),
        credentials: "same-origin" 
      });
      const dataCoh = await resCoh.json();
      if (dataCoh && Array.isArray(dataCoh.cohorts)) {
        setCohortsList(dataCoh.cohorts);
      }
    } catch (e: any) {
      setStatusMessage({ text: "Error al cargar configuración: " + e.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndCohorts();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings.php", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify({
          mode: activeMode,
          cohort: cohortYear,
          vigencia_fechas: vigenciaFechas,
          preinscripciones_interview_notice: interviewNotice,
          reinscripciones_closed_message: closedMsgRe,
          preinscripciones_closed_message: closedMsgPre
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({ text: "Configuraciones guardadas y actualizadas en toda la web.", type: "success" });
        fetchSettingsAndCohorts();
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMessage({ text: json.error || "Error al guardar configuraciones.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Error de conexión.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyModeChange = async (targetMode: "reinscripciones" | "preinscripciones" | "cerrado") => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings.php", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify({
          mode: targetMode,
          cohort: cohortYear,
          vigencia_fechas: vigenciaFechas,
          preinscripciones_interview_notice: interviewNotice,
          reinscripciones_closed_message: closedMsgRe,
          preinscripciones_closed_message: closedMsgPre
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setActiveMode(targetMode);
        setPendingModeChange(null);
        setStatusMessage({ 
          text: targetMode === "reinscripciones" ? `¡Convocatoria de Reinscripción ${cohortYear} habilitada con éxito! (Preinscripción cerrada)` : (targetMode === "preinscripciones" ? `¡Convocatoria de Preinscripción ${cohortYear} habilitada con éxito! (Reinscripción cerrada)` : "Convocatorias puestas en pausa (Ambas cerradas)."),
          type: "success" 
        });
        fetchSettingsAndCohorts();
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMessage({ text: json.error || "Error al actualizar modo.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Error de conexión.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirmation !== String(cohortYear)) {
      alert(`Debe escribir exactamente '${cohortYear}' para confirmar el cierre de la cohorte.`);
      return;
    }

    setIsProcessingClose(true);
    try {
      const res = await fetch("/api/cohorts.php", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "same-origin",
        body: JSON.stringify({
          action: "close",
          year: cohortYear,
          type: activeMode === "preinscripciones" ? "preinscripcion" : "reinscripcion",
          confirmation: String(cohortYear)
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setShowCloseCohortModal(false);
        setTypedConfirmation("");
        setStatusMessage({ text: json.message || "Cohorte archivada exitosamente.", type: "success" });
        fetchSettingsAndCohorts();
        if (onRefreshData) onRefreshData();
      } else {
        alert(json.error || "Ocurrió un error al cerrar la cohorte.");
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setIsProcessingClose(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500 flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Cargando configuraciones y estado de admisiones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-emerald-700" />
            Configuración & Gobernanza de Convocatorias
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Control de apertura exclusiva, ciclos lectivos multianuales y textos institucionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={activeMode === "preinscripciones" ? "/preinscripciones" : (activeMode === "reinscripciones" ? "/reinscripciones" : "/inscripciones")}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-300 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" /> Previsualizar en la Web
          </a>

          <button
            type="button"
            onClick={fetchSettingsAndCohorts}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Estado
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border shadow-xs animate-in fade-in duration-200",
          statusMessage.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-300" 
            : "bg-red-50 text-red-900 border-red-300"
        )}>
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Modo de Convocatoria Activo en el Sitio Web (Exclusivo)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Solo puede haber un proceso activo a la vez: al habilitar uno, el otro se deshabilita automáticamente.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 self-start sm:self-auto">
            {isSuperAdmin ? "Permiso SUPER_ADMIN Activo" : "Solo Lectura (Requiere SUPER_ADMIN)"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => {
              if (isSuperAdmin && activeMode !== "reinscripciones") {
                setPendingModeChange({
                  targetMode: "reinscripciones",
                  title: `Habilitar Reinscripciones Ciclo ${cohortYear}`,
                  description: `Se abrirá el formulario de reinscripción con contratos y firmas digitales para alumnos actuales. El proceso de preinscripción quedará cerrado automáticamente.`
                });
              }
            }}
            className={cn(
              "p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer",
              activeMode === "reinscripciones"
                ? "bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
            )}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Alumnos Regulares</span>
                <span className={cn("w-3 h-3 rounded-full shrink-0", activeMode === "reinscripciones" ? "bg-emerald-600 ring-4 ring-emerald-200" : "bg-slate-300")} />
              </div>
              <h3 className="text-base font-black text-slate-900">Reinscripciones {cohortYear}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Formulario digital con firmas y contratos PDF individuales por alumno.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              {activeMode === "reinscripciones" ? <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700"><CheckCircle2 className="w-4 h-4" /> ● ACTIVO EN LA WEB</span> : <button type="button" disabled={!isSuperAdmin} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40">Activar Reinscripciones</button>}
            </div>
          </div>

          <div 
            onClick={() => {
              if (isSuperAdmin && activeMode !== "preinscripciones") {
                setPendingModeChange({
                  targetMode: "preinscripciones",
                  title: `Habilitar Preinscripciones Ciclo ${cohortYear}`,
                  description: `Se abrirá el formulario unificado de 5 pasos para nuevos aspirantes. El proceso de reinscripción quedará cerrado automáticamente.`
                });
              }
            }}
            className={cn(
              "p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer",
              activeMode === "preinscripciones"
                ? "bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
            )}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">Nuevos Aspirantes</span>
                <span className={cn("w-3 h-3 rounded-full shrink-0", activeMode === "preinscripciones" ? "bg-blue-600 ring-4 ring-blue-200" : "bg-slate-300")} />
              </div>
              <h3 className="text-base font-black text-slate-900">Preinscripciones {cohortYear}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Formulario de 5 pasos con criterios de prioridad y agenda de entrevistas.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              {activeMode === "preinscripciones" ? <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700"><CheckCircle2 className="w-4 h-4" /> ● ACTIVO EN LA WEB</span> : <button type="button" disabled={!isSuperAdmin} className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40">Activar Preinscripciones</button>}
            </div>
          </div>

          <div 
            onClick={() => {
              if (isSuperAdmin && activeMode !== "cerrado") {
                setPendingModeChange({
                  targetMode: "cerrado",
                  title: "Poner en Pausa las Convocatorias",
                  description: "Ambos formularios quedarán deshabilitados para el público general."
                });
              }
            }}
            className={cn(
              "p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer",
              activeMode === "cerrado"
                ? "bg-amber-50/80 border-amber-600 shadow-md ring-2 ring-amber-500/20"
                : "bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
            )}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Administración</span>
                <span className={cn("w-3 h-3 rounded-full shrink-0", activeMode === "cerrado" ? "bg-amber-600 ring-4 ring-amber-200" : "bg-slate-300")} />
              </div>
              <h3 className="text-base font-black text-slate-900">Pausa Administrativa</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Deshabilita el ingreso público a ambos formularios.</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60">
              {activeMode === "cerrado" ? <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800"><Lock className="w-4 h-4" /> ● AMBAS CERRADAS</span> : <button type="button" disabled={!isSuperAdmin} className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40">Pausar Convocatorias</button>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-black text-slate-900">Ciclo Lectivo Activo (Año):</label>
            <div className="flex items-center gap-3">
              <input type="number" min="2024" max="2040" value={cohortYear} onChange={e => setCohortYear(parseInt(e.target.value, 10) || 2027)} className="w-32 px-3.5 py-2 text-sm font-black font-mono border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <p className="text-[11px] text-slate-500">* Actualiza títulos y metadatos del ciclo {cohortYear}.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-black text-slate-900">Período de Vigencia / Plazos:</label>
            <input type="text" value={vigenciaFechas} onChange={e => setVigenciaFechas(e.target.value)} placeholder="Ej: Del 1 al 15 de Septiembre" className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><Save className="w-4 h-4 text-emerald-700" /> Textos Institucionales</h3>
            <p className="text-xs text-slate-500 mt-0.5">Personalizá avisos y mensajes de cierre.</p>
          </div>
          <button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Textos</span>
          </button>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-800 mb-1">Citación Presencial:</label>
          <textarea rows={3} value={interviewNotice} onChange={e => setInterviewNotice(e.target.value)} className="w-full p-3 text-xs rounded-xl border border-slate-300 outline-none font-medium" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Cierre Reinscripción:</label>
            <textarea rows={3} value={closedMsgRe} onChange={e => setClosedMsgRe(e.target.value)} className="w-full p-3 text-xs rounded-xl border border-slate-300 outline-none font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Cierre Preinscripción:</label>
            <textarea rows={3} value={closedMsgPre} onChange={e => setClosedMsgPre(e.target.value)} className="w-full p-3 text-xs rounded-xl border border-slate-300 outline-none font-medium" />
          </div>
        </div>
      </form>

      {isSuperAdmin && (
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
            <FolderArchive className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Cierre Oficial & Archivo Inmutable de Cohorte {cohortYear}</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">El cierre de cohorte congelará los trámites en un snapshot inmutable.</p>
          <button type="button" onClick={() => setShowCloseCohortModal(true)} className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer">
            <FolderArchive className="w-4 h-4" /> Cerrar y Archivar Cohorte {cohortYear}
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-700" /> Historial de Cohortes</h3>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-900 px-3 py-1 rounded-full border border-indigo-200">{cohortsList.length} registradas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black border-b">
                <th className="py-2.5 px-3">Ciclo</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {cohortsList.map((c: any) => (
                <tr key={c.id || `${c.year}-${c.type}`} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.year}</td>
                  <td className="py-2.5 px-3 capitalize">{c.type}</td>
                  <td className="py-2.5 px-3"><span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", c.status === "abierta" ? "bg-emerald-100" : "bg-slate-200")}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingModeChange && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-900">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-amber-700" /></div>
              <div>
                <h3 className="font-black text-base text-slate-900">{pendingModeChange.title}</h3>
                <span className="text-[11px] text-slate-500">Confirmación de cambio de modo</span>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl">{pendingModeChange.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPendingModeChange(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancelar</button>
              <button type="button" onClick={() => handleApplyModeChange(pendingModeChange.targetMode)} disabled={isSaving} className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white shadow-md cursor-pointer">Confirmar y Activar</button>
            </div>
          </div>
        </div>
      )}

      {showCloseCohortModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCloseCohortSubmit} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0"><FolderArchive className="w-5 h-5" /></div>
              <div>
                <h3 className="font-black text-base text-slate-900">Cierre Definitivo de Cohorte {cohortYear}</h3>
                <span className="text-[11px] text-slate-500">Acción protegida</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">Para confirmar, escriba el número {cohortYear}:</p>
            <input type="text" required value={typedConfirmation} onChange={e => setTypedConfirmation(e.target.value.trim())} className="w-full px-3 py-2 text-sm font-mono font-bold border rounded-xl outline-none text-center" />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setShowCloseCohortModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={typedConfirmation !== String(cohortYear) || isProcessingClose} className="px-6 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white cursor-pointer">Confirmar Cierre</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
