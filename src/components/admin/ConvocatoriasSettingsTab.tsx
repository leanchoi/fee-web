"use client";

import React, { useState, useEffect } from "react";
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Save, 
  Lock, 
  FolderArchive, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  Eye,
  Calendar,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvocatoriasSettingsProps {
  isSuperAdmin: boolean;
  session: any;
  onRefreshData?: () => void;
}

export function ConvocatoriasSettingsTab({ isSuperAdmin, session, onRefreshData }: ConvocatoriasSettingsProps) {
  const [settings, setSettings] = useState<{
    mode: string;
    reinscripciones: { cohort: number; status: string; isOpen: boolean; closedMessage: string };
    preinscripciones: { cohort: number; status: string; isOpen: boolean; interviewNotice: string; closedMessage: string };
  } | null>(null);

  const [cohorts, setCohortsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [interviewNotice, setInterviewNotice] = useState("");
  const [closedMsgRe, setClosedMsgRe] = useState("");
  const [closedMsgPre, setClosedMsgPre] = useState("");

  // Modal de confirmación para switches
  const [pendingToggle, setPendingToggle] = useState<{
    type: "reinscripcion" | "preinscripcion";
    targetStatus: "abierta" | "cerrada";
    title: string;
    warning: string;
  } | null>(null);

  // Modal de Cierre Definitivo de Cohorte
  const [showCloseCohortModal, setShowCloseCohortModal] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isProcessingClose, setIsProcessingClose] = useState(false);

  // Cargar settings y cohortes desde API
  const fetchSettingsAndCohorts = async () => {
    setIsLoading(true);
    try {
      const resSet = await fetch("/api/settings.php", { credentials: "same-origin" });
      const dataSet = await resSet.json();
      if (dataSet && dataSet.reinscripciones) {
        setSettings(dataSet);
        setInterviewNotice(dataSet.preinscripciones?.interviewNotice || "");
        setClosedMsgRe(dataSet.reinscripciones?.closedMessage || "");
        setClosedMsgPre(dataSet.preinscripciones?.closedMessage || "");
      }

      const resCoh = await fetch("/api/cohorts.php", { credentials: "same-origin" });
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

  // Helper para obtener cookie fee_csrf
  const getCsrfToken = () => {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(/(?:^|;\s*)fee_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  };

  // Guardar Textos Institucionales
  const handleSaveTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          preinscripciones_interview_notice: interviewNotice,
          reinscripciones_closed_message: closedMsgRe,
          preinscripciones_closed_message: closedMsgPre
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({ text: "Textos institucionales actualizados correctamente.", type: "success" });
        fetchSettingsAndCohorts();
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMessage({ text: json.error || "Error al guardar textos.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Error de conexión.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Ejecutar cambio de estado de convocatoria confirmado
  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;
    setIsSaving(true);
    setStatusMessage(null);

    const payload: any = {};
    if (pendingToggle.type === "reinscripcion") {
      payload.reinscripciones_status = pendingToggle.targetStatus;
      payload.reinscripciones_cohort = settings?.reinscripciones?.cohort || 2027;
    } else {
      payload.preinscripciones_status = pendingToggle.targetStatus;
      payload.preinscripciones_cohort = settings?.preinscripciones?.cohort || 2027;
    }

    try {
      const res = await fetch("/api/settings.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({ text: `Estado de ${pendingToggle.type} actualizado a "${pendingToggle.targetStatus}".`, type: "success" });
        setPendingToggle(null);
        fetchSettingsAndCohorts();
        if (onRefreshData) onRefreshData();
      } else {
        setStatusMessage({ text: json.error || "Error al actualizar estado.", type: "error" });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Error de conexión.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Ejecutar Cierre Definitivo de Cohorte
  const handleCloseCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirmation !== "2027") {
      alert("Debe escribir exactamente '2027' para confirmar el cierre de la cohorte.");
      return;
    }

    setIsProcessingClose(true);
    try {
      const res = await fetch("/api/cohorts.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken()
        },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "close",
          year: 2027,
          type: "reinscripcion",
          confirmation: "2027"
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
        <span>Cargando configuraciones y estado de cohortes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-emerald-700" />
            Configuración & Gobernanza de Convocatorias
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Control de apertura/cierre de formularios públicos, citaciones y ciclos lectivos multianuales.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettingsAndCohorts}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar Estado
        </button>
      </div>

      {statusMessage && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border",
          statusMessage.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-300" 
            : "bg-red-50 text-red-900 border-red-300"
        )}>
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. SECCIÓN: SWITCHES DE ESTADO PÚBLICO */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Control de Apertura en Vivo en el Sitio Web
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {isSuperAdmin ? "Permiso SUPER_ADMIN Activo" : "Solo Lectura (Requiere SUPER_ADMIN)"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Reinscripciones */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Alumnos Regulares</span>
                <h3 className="text-base font-black text-slate-900">Reinscripciones Ciclo {settings?.reinscripciones?.cohort || 2027}</h3>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                settings?.reinscripciones?.isOpen
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              )}>
                {settings?.reinscripciones?.isOpen ? "● ABIERTA" : "○ CERRADA"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gobierna el formulario con firmas digitales y contratos PDF para familias regulares.
            </p>

            {isSuperAdmin && (
              <div className="pt-2 border-t">
                {settings?.reinscripciones?.isOpen ? (
                  <button
                    type="button"
                    onClick={() => setPendingToggle({
                      type: "reinscripcion",
                      targetStatus: "cerrada",
                      title: "Cerrar Período de Reinscripciones 2027",
                      warning: "Al cerrar la convocatoria, los padres verán el cartel de 'Convocatoria Finalizada' y no podrán enviar nuevos contratos."
                    })}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Deshabilitar / Cerrar Reinscripciones
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingToggle({
                      type: "reinscripcion",
                      targetStatus: "abierta",
                      title: "Reabrir Período de Reinscripciones 2027",
                      warning: "El formulario de reinscripciones volverá a estar disponible públicamente en la web."
                    })}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Abrir / Habilitar Reinscripciones
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card Preinscripciones */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Nuevos Ingresantes</span>
                <h3 className="text-base font-black text-slate-900">Preinscripciones Ciclo {settings?.preinscripciones?.cohort || 2027}</h3>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                settings?.preinscripciones?.isOpen
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 border border-slate-300"
              )}>
                {settings?.preinscripciones?.isOpen ? "● ABIERTA" : "○ CERRADA"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gobierna el formulario de 5 pasos para aspirantes de Inicial, Primaria (1030) y Secundaria (1739) con agenda del 7 y 8 de septiembre.
            </p>

            {isSuperAdmin && (
              <div className="pt-2 border-t">
                {settings?.preinscripciones?.isOpen ? (
                  <button
                    type="button"
                    onClick={() => setPendingToggle({
                      type: "preinscripcion",
                      targetStatus: "cerrada",
                      title: "Cerrar Período de Preinscripciones 2027",
                      warning: "Al cerrar la convocatoria, los aspirantes no podrán registrar nuevas solicitudes."
                    })}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Deshabilitar / Cerrar Preinscripciones
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingToggle({
                      type: "preinscripcion",
                      targetStatus: "abierta",
                      title: "Abrir Período de Preinscripciones 2027",
                      warning: "El formulario de nuevos ingresantes 2027 quedará activo de inmediato en /preinscripciones."
                    })}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Abrir / Habilitar Preinscripciones
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: CIERRE Y ARCHIVO DE COHORTE */}
      {isSuperAdmin && (
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
            <FolderArchive className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Cierre Oficial & Archivo Inmutable de Cohorte 2027</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Cuando la administración escolar termine de procesar todas las solicitudes del ciclo 2027, el cierre de cohorte congelará los trámites en un <strong>snapshot inmutable con checksum SHA256</strong>, archivará la cohorte en el historial y habilitará la preparación del ciclo 2028.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCloseCohortModal(true)}
              className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderArchive className="w-4 h-4" />
              Cerrar y Archivar Cohorte 2027
            </button>
            <span className="text-[11px] text-amber-800/80 font-medium">
              * Acción reversible dentro de una ventana de seguridad de 72 horas.
            </span>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN: EDITOR DE TEXTOS INSTITUCIONALES */}
      <form onSubmit={handleSaveTexts} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
        <div className="border-b pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-700" />
            Textos Institucionales, Citaciones y Avisos Públicos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Podés modificar los mensajes que se muestran a las familias en la página web y comprobantes.
          </p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-800 mb-1">
            Texto de Citación Presencial Obligatoria (Preinscripciones 7 y 8 de Septiembre):
          </label>
          <textarea
            rows={3}
            value={interviewNotice}
            onChange={e => setInterviewNotice(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-medium leading-relaxed"
            placeholder="Texto que verán los aspirantes al solicitar la vacante y en el comprobante PDF..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mensaje cuando Reinscripciones está cerrada:
            </label>
            <textarea
              rows={3}
              value={closedMsgRe}
              onChange={e => setClosedMsgRe(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Mensaje cuando Preinscripciones está cerrada:
            </label>
            <textarea
              rows={3}
              value={closedMsgPre}
              onChange={e => setClosedMsgPre(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Textos Institucionales</span>
          </button>
        </div>
      </form>

      {/* 4. SECCIÓN: HISTORIAL DE COHORTES */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-700" />
              Historial de Cohortes y Ciclos Lectivos Registrados
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Registro auditado de cohortes de reinscripción y preinscripción.</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-900 px-3 py-1 rounded-full border border-indigo-200">
            {cohorts.length} cohortes registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-black border-b">
                <th className="py-2.5 px-3">Año / Ciclo</th>
                <th className="py-2.5 px-3">Tipo Convocatoria</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Trámites Totales</th>
                <th className="py-2.5 px-3">Estudiantes Únicos</th>
                <th className="py-2.5 px-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {cohorts.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.year}</td>
                  <td className="py-2.5 px-3 capitalize">{c.type}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                      c.status === "abierta" ? "bg-emerald-100 text-emerald-900" :
                      c.status === "cerrada" ? "bg-amber-100 text-amber-900" :
                      c.status === "archivada" ? "bg-slate-200 text-slate-800" : "bg-blue-100 text-blue-900"
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">{c.totalSubmissions || 0}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{c.uniqueStudents || 0}</td>
                  <td className="py-2.5 px-3 text-slate-500">{c.notes || "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA TOGGLE */}
      {pendingToggle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-900">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">{pendingToggle.title}</h3>
                <span className="text-[11px] text-slate-500">Confirmación de cambio de estado en vivo</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl">
              {pendingToggle.warning}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingToggle(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Confirmar Cambio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CIERRE DEFINITIVO DE COHORTE */}
      {showCloseCohortModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCloseCohortSubmit} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Cierre Definitivo de Cohorte 2027</h3>
                <span className="text-[11px] text-slate-500">Acción protegida con confirmación tipeada</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción archivará de manera inmutable todos los trámites del ciclo 2027 en la base de datos y generará automáticamente la cohorte 2028 en borrador.
            </p>

            <div className="bg-slate-50 border p-3.5 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Para confirmar, por favor escriba el número de cohorte (<strong className="text-red-600 font-black">2027</strong>):
              </label>
              <input
                type="text"
                required
                value={typedConfirmation}
                onChange={e => setTypedConfirmation(e.target.value.trim())}
                placeholder="2027"
                className="w-full px-3 py-2 text-sm font-mono font-bold border rounded-xl bg-white outline-none focus:ring-2 focus:ring-red-500 text-center"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowCloseCohortModal(false);
                  setTypedConfirmation("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={typedConfirmation !== "2027" || isProcessingClose}
                className="px-6 py-2 rounded-xl text-xs font-black bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white shadow-md cursor-pointer"
              >
                {isProcessingClose ? "Cerrando Cohorte..." : "Confirmar Cierre de Cohorte 2027"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
