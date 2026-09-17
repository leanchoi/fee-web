"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  MessageCircle, 
  Link as LinkIcon, 
  Check, 
  Send, 
  Eye, 
  FileText, 
  Download,
  MoreVertical,
  ChevronDown,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AulaStudentItem {
  id: string;
  studentName: string;
  studentDni: string;
  studentGrade: string;
  studentLevel: string;
  school: string;
  formKind: "reinscripcion" | "preinscripcion";
  admissionStatus?: string; // recibida, entrevista_agendada, entrevista_realizada, admitida, aprobada_pendiente_firma, confirmada, lista_espera
  formalizationToken?: string;
  formalizationSignedAt?: string;
  isStaffChild?: boolean;
  hasSiblingInSchool?: boolean;
  englishLevelAchieved?: string;
  parent1Name: string;
  parent1Phone?: string;
  parent1Email?: string;
  raw: any;
}

interface AulaStudentCardProps {
  student: AulaStudentItem;
  onInspect: (student: AulaStudentItem) => void;
  onUpdateStatus?: (id: string, newStatus: string) => Promise<void>;
  onResendEmail?: (id: string) => Promise<void>;
  isSuperAdmin?: boolean;
  onDelete?: (student: AulaStudentItem) => void;
}

export function AulaStudentCard({
  student,
  onInspect,
  onUpdateStatus,
  onResendEmail,
  isSuperAdmin,
  onDelete
}: AulaStudentCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Clasificar tipo visual según el ciclo de vida
  const isRegular = student.formKind === "reinscripcion";
  const status = student.admissionStatus || "recibida";

  let cardTheme = {
    bg: "bg-amber-50/80 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-950 dark:text-amber-100",
    badgeBg: "bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700",
    label: "Aspirante en Evaluación",
    icon: Clock,
    type: "yellow"
  };

  if (isRegular) {
    cardTheme = {
      bg: "bg-blue-50/80 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-950 dark:text-blue-100",
      badgeBg: "bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
      label: "Regular Reinscripto",
      icon: ShieldCheck,
      type: "blue"
    };
  } else if (status === "confirmada" || student.formalizationSignedAt) {
    cardTheme = {
      bg: "bg-gradient-to-r from-emerald-50/90 to-blue-50/90 dark:from-emerald-950/40 dark:to-blue-950/40",
      border: "border-blue-400 dark:border-blue-600",
      text: "text-slate-900 dark:text-slate-100",
      badgeBg: "bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/60 dark:to-blue-900/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
      label: "Matrícula Formalizada",
      icon: CheckCircle2,
      type: "green-blue"
    };
  } else if (status === "admitida" || status === "aprobada_pendiente_firma") {
    cardTheme = {
      bg: "bg-gradient-to-r from-amber-50/90 to-emerald-50/90 dark:from-amber-950/40 dark:to-emerald-950/40",
      border: "border-emerald-300 dark:border-emerald-700",
      text: "text-emerald-950 dark:text-emerald-100",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
      label: "Vacante Reservada · Pendiente Firma",
      icon: Sparkles,
      type: "yellow-green"
    };
  } else if (status === "lista_espera") {
    cardTheme = {
      bg: "bg-rose-50/80 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800",
      text: "text-rose-950 dark:text-rose-100",
      badgeBg: "bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700",
      label: "Lista de Espera",
      icon: AlertCircle,
      type: "red"
    };
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!student.formalizationToken) return;
    const url = `${window.location.origin}/formalizacion?token=${encodeURIComponent(student.formalizationToken)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getWhatsAppUrl = () => {
    if (!student.parent1Phone) return null;
    let clean = student.parent1Phone.replace(/[^0-9]/g, "");
    if (clean.length === 10) clean = "549" + clean;
    else if (clean.length === 11 && clean.startsWith("0")) clean = "549" + clean.substring(1);
    else if (!clean.startsWith("54")) clean = "549" + clean;

    let msg = `Hola ${student.parent1Name}, nos comunicamos desde la Fundación Educativa Esquel respecto a la vacante de ${student.studentName} para ${student.studentGrade}.`;
    if (student.formalizationToken) {
      msg += ` Podés ingresar a firmar el contrato de matrícula desde este enlace: ${window.location.origin}/formalizacion?token=${encodeURIComponent(student.formalizationToken)}`;
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  const handleStatusChange = async (e: React.MouseEvent, newSt: string) => {
    e.stopPropagation();
    if (!onUpdateStatus) return;
    setShowStatusMenu(false);
    setIsUpdating(true);
    try {
      await onUpdateStatus(student.id, newSt);
    } finally {
      setIsUpdating(false);
    }
  };

  const waUrl = getWhatsAppUrl();

  return (
    <div 
      className={cn(
        "p-3.5 rounded-2xl border transition-all duration-200 relative group text-left",
        cardTheme.bg,
        cardTheme.border,
        "hover:shadow-md hover:border-slate-400/50"
      )}
    >
      {/* Cabecera de la Tarjeta */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border", cardTheme.badgeBg)}>
              <cardTheme.icon className="w-3 h-3" />
              {cardTheme.label}
            </span>

            {/* Etiquetas de Prioridad */}
            {student.isStaffChild && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-300">
                Personal
              </span>
            )}
            {student.hasSiblingInSchool && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-300">
                Hermano/a
              </span>
            )}
            {student.englishLevelAchieved && student.englishLevelAchieved !== "ninguno" && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-300">
                Inglés {student.englishLevelAchieved}
              </span>
            )}
          </div>

          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
            {student.studentName}
          </h4>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            DNI {student.studentDni}
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-0.5">
          {isSuperAdmin && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(student);
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Eliminar alumno definitivamente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Botón Ver Ficha 360° */}
          <button
            type="button"
            onClick={() => onInspect(student)}
            className="p-1.5 text-slate-500 hover:text-brand-blue hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Ver expediente completo"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tutor y Contacto */}
      <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 line-clamp-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{student.parent1Name}</span>
        {student.parent1Phone && <span> · {student.parent1Phone}</span>}
      </div>

      {/* Barra de Acciones Rápidas */}
      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1">
          {/* WhatsApp Directo con stopPropagation */}
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 text-emerald-600 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 rounded-md transition-colors cursor-pointer"
              title="Abrir WhatsApp con tutor"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Copiar Enlace de Firma si está aprobado o formalizado */}
          {student.formalizationToken && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer"
              title="Copiar enlace directo de formalización"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Reenviar Email si está en estado pendiente de firma */}
          {(status === "admitida" || status === "aprobada_pendiente_firma") && onResendEmail && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm(`¿Reenviar invitación de formalización por correo a ${student.parent1Email || "la familia"}?`)) {
                  await onResendEmail(student.id);
                }
              }}
              className="p-1 text-amber-600 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 rounded-md transition-colors cursor-pointer"
              title="Reenviar correo de formalización"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desplegable de Cambio de Estado Rápido para Aspirantes */}
        {!isRegular && onUpdateStatus && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span>Estado</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStatusMenu && (
              <div 
                onClick={e => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, "aprobada_pendiente_firma")}
                  className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aprobar y Enviar Firma</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, "lista_espera")}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center gap-2 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Pasar a Lista de Espera</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, "entrevista_agendada")}
                  className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center gap-2 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Entrevista Agendada</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStatusChange(e, "recibida")}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-2 cursor-pointer"
                >
                  <span>Volver a En Evaluación</span>
                </button>

                {isSuperAdmin && onDelete && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusMenu(false);
                        onDelete(student);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Alumno</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
