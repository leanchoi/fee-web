"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  School, 
  Sparkles,
  Calendar,
  MessageSquare
} from "lucide-react";
import { submitEnrollment } from "@/actions/enrollment";

export function PreinscripcionForm() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentLevel: "Nivel Primario",
    studentGrade: "1° Grado",
    tutorName: "",
    tutorEmail: "",
    tutorPhone: "",
    comments: "",
    type: "preinscripcion_general"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string } | null>(null);

  const levelGradeOptions: Record<string, string[]> = {
    "Nivel Inicial": ["Sala de 3", "Sala de 4", "Sala de 5"],
    "Nivel Primario": ["1° Grado", "2° Grado", "3° Grado", "4° Grado", "5° Grado", "6° Grado"],
    "Nivel Secundario": ["1° Año", "2° Año", "3° Año", "4° Año", "5° Año", "6° Año"]
  };

  const handleLevelChange = (lvl: string) => {
    const defaultGrade = levelGradeOptions[lvl]?.[0] || "1° Grado";
    setFormData(prev => ({
      ...prev,
      studentLevel: lvl,
      studentGrade: defaultGrade
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitEnrollment(formData);
      if (res.success) {
        setSuccessData({ id: res.id || `PRE-${Date.now()}` });
      } else {
        setErrorMessage(res.error || "Ocurrió un error al procesar tu solicitud.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-blue-200">
          Preinscripción Registrada
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
          ¡Solicitud de Admisión Recibida!
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Hemos registrado la solicitud de preinscripción para <strong>{formData.studentName}</strong> en <strong>{formData.studentLevel} ({formData.studentGrade})</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2 mb-6 text-left">
          <p>• Los datos han quedado incorporados a la lista de aspirantes de la Fundación Educativa Esquel.</p>
          <p>• Nuestro equipo directivo se comunicará al correo <strong>{formData.tutorEmail}</strong> o teléfono <strong>{formData.tutorPhone}</strong> ante la disponibilidad de vacantes.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSuccessData(null);
            setFormData({
              studentName: "",
              studentLevel: "Nivel Primario",
              studentGrade: "1° Grado",
              tutorName: "",
              tutorEmail: "",
              tutorPhone: "",
              comments: "",
              type: "preinscripcion_general"
            });
          }}
          className="text-xs font-semibold text-brand-blue hover:underline cursor-pointer"
        >
          Registrar otra solicitud de preinscripción
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border border-red-200 text-sm shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Datos del Aspirante */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
          <School className="w-4 h-4 text-brand-blue" /> Datos del Aspirante
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre y Apellido del Aspirante <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.studentName}
            onChange={e => setFormData({ ...formData, studentName: e.target.value })}
            placeholder="Nombre completo"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nivel Educativo Deseado <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentLevel}
              onChange={e => handleLevelChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium bg-white"
            >
              <option value="Nivel Inicial">Nivel Inicial (Jardín)</option>
              <option value="Nivel Primario">Nivel Primario (Esc. 1030)</option>
              <option value="Nivel Secundario">Nivel Secundario (Esc. 1739)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sala / Grado / Año <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.studentGrade}
              onChange={e => setFormData({ ...formData, studentGrade: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm font-medium bg-white"
            >
              {(levelGradeOptions[formData.studentLevel] || []).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Datos del Tutor / Familia */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" /> Datos de Contacto de la Familia
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre y Apellido de la Madre / Padre / Tutor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.tutorName}
            onChange={e => setFormData({ ...formData, tutorName: e.target.value })}
            placeholder="Nombre y apellido del adulto responsable"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.tutorEmail}
              onChange={e => setFormData({ ...formData, tutorEmail: e.target.value })}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono Celular <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.tutorPhone}
              onChange={e => setFormData({ ...formData, tutorPhone: e.target.value })}
              placeholder="+54 9 2945 123456"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Comentarios o Información de Interés (Opcional)
          </label>
          <textarea
            rows={3}
            value={formData.comments}
            onChange={e => setFormData({ ...formData, comments: e.target.value })}
            placeholder="Mencione si tiene hermanos en la escuela, procedencia o consultas específicas..."
            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-blue outline-none text-sm bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-8 rounded-2xl bg-brand-blue hover:bg-brand-green text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Registrando solicitud...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-brand-yellow" /> Enviar Solicitud de Preinscripción
          </>
        )}
      </button>
    </form>
  );
}
