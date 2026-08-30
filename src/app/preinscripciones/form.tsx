"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  School, 
  Calendar,
  Clock,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";

interface InterviewSlotOption {
  id: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: number;
}

export function PreinscripcionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ id: string; trackingNumber: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<InterviewSlotOption[]>([]);
  const [interviewNotice, setInterviewNotice] = useState<string>("");
  const [isConvocatoriaAbierta, setIsConvocatoriaAbierta] = useState<boolean>(true);
  const [closedMessage, setClosedMessage] = useState<string>("");

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Aspirante
    studentName: "",
    studentDni: "",
    studentGender: "Femenino",
    studentBirthDate: "",
    studentNationality: "Argentina",
    studentBirthPlace: "Esquel",
    school: "Escuela N.º 1030",
    studentLevel: "Nivel Primario",
    studentGrade: "1° Grado",
    parent1Address: "",
    parent1City: "Esquel",
    parent1PostalCode: "9200",

    // Paso 2: Trayectoria e Inglés
    currentSchool: "",
    currentSchoolType: "publica" as "publica" | "privada" | "otra",
    hasDebtClearance: false,
    hasRepeated: false,
    repeatedGrade: "",
    pendingSubjects: "",
    englishAccreditationType: "ninguno" as "ninguno" | "instituto" | "escuela_bilingue" | "particular" | "otro",
    englishInstituteName: "",
    englishLevelAchieved: "",

    // Paso 3: Prioridades
    isStaffChild: false,
    staffMemberName: "",
    staffMemberDni: "",
    hasSiblingInSchool: false,
    siblingDni: "",
    siblingCurrentGrade: "",

    // Paso 4: Responsables y Salud
    parent1Name: "",
    parent1Dni: "",
    parent1Relationship: "Madre/Padre/Tutor",
    parent1Phone: "",
    parent1Email: "",
    parent1EmailConfirm: "",
    parent1Occupation: "",

    isSingleParent: false,
    parent2Name: "",
    parent2Dni: "",
    parent2Relationship: "Madre/Padre/Tutora",
    parent2Phone: "",
    parent2Email: "",
    parent2Occupation: "",

    emergencyContactName: "",
    emergencyContactPhone: "",
    legalCustodyInfo: "",
    authorizedPickups: "",
    healthDisabilities: "",
    healthAllergiesMedication: "",

    // Paso 5: Turno y Consentimientos
    interviewSlotId: "" as string | number,
    acceptsTerms: false,
    acceptsDataPolicy: false,
    acceptsImagePolicy: false,
    comments: "",

    // UUID idempotente
    submissionUuid: ""
  });

  // Opciones de grados según nivel y escuela
  const gradeOptions: Record<string, string[]> = {
    "Nivel Inicial": ["Sala de 3", "Sala de 4", "Sala de 5"],
    "Nivel Primario": ["1° Grado", "2° Grado", "3° Grado", "4° Grado", "5° Grado", "6° Grado"],
    "Nivel Secundario": ["1° Año", "2° Año", "3° Año", "4° Año (Cs. Naturales)", "4° Año (Economía)", "5° Año (Cs. Naturales)", "5° Año (Economía)", "6° Año (Cs. Naturales)", "6° Año (Economía)"]
  };

  // Cargar estado de la convocatoria, slots y borrador local
  useEffect(() => {
    // 1. Cargar borrador local guardado si existe
    try {
      const saved = localStorage.getItem("fee_preinscripcion_draft_2027");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    // 2. Generar UUID idempotente si no existe
    setFormData(prev => ({
      ...prev,
      submissionUuid: prev.submissionUuid || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "uuid-" + Date.now())
    }));

    // 3. Fetch configuraciones y slots de entrevistas
    fetch("/api/settings.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data && data.preinscripciones) {
          setIsConvocatoriaAbierta(data.preinscripciones.isOpen);
          setClosedMessage(data.preinscripciones.closedMessage || "El período de preinscripción está cerrado.");
          setInterviewNotice(data.preinscripciones.interviewNotice || "");
          if (Array.isArray(data.preinscripciones.availableSlots)) {
            setAvailableSlots(data.preinscripciones.availableSlots);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Guardar en localStorage con cada cambio
  useEffect(() => {
    try {
      localStorage.setItem("fee_preinscripcion_draft_2027", JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const handleLevelChange = (lvl: string) => {
    let sch = "Escuela N.º 1030";
    if (lvl === "Nivel Secundario") {
      sch = "Escuela N.º 1739";
    }
    const defaultGrade = gradeOptions[lvl]?.[0] || "1° Grado";
    setFormData(prev => ({
      ...prev,
      studentLevel: lvl,
      school: sch,
      studentGrade: defaultGrade
    }));
  };

  const isPrimaryThirdToSixth = () => {
    if (formData.studentLevel !== "Nivel Primario") return false;
    const g = formData.studentGrade;
    return g.includes("3°") || g.includes("4°") || g.includes("5°") || g.includes("6°");
  };

  // Validaciones por paso
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!formData.studentName.trim() || !formData.studentDni.trim()) {
        setErrorMessage("Por favor completá el nombre y DNI del aspirante.");
        return false;
      }
      const dniClean = formData.studentDni.replace(/[^0-9]/g, "");
      if (dniClean.length < 7 || dniClean.length > 8) {
        setErrorMessage("El DNI del aspirante debe contener 7 u 8 dígitos.");
        return false;
      }
      if (!formData.studentBirthDate) {
        setErrorMessage("La fecha de nacimiento es obligatoria.");
        return false;
      }
      if (!formData.parent1Address.trim()) {
        setErrorMessage("Por favor indicá el domicilio de residencia.");
        return false;
      }
    }

    if (step === 2) {
      if (formData.currentSchoolType === "privada" && !formData.hasDebtClearance) {
        setErrorMessage("Para escuelas de gestión privada, debe comprometerse a presentar el certificado de libre deuda.");
        return false;
      }
      if (formData.hasRepeated && !formData.repeatedGrade.trim()) {
        setErrorMessage("Por favor especificá qué sala/grado/año repitió.");
        return false;
      }
    }

    if (step === 3) {
      if (formData.isStaffChild && !formData.staffMemberName.trim()) {
        setErrorMessage("Por favor indicá el nombre del personal docente o no docente.");
        return false;
      }
      if (formData.hasSiblingInSchool && !formData.siblingDni.trim()) {
        setErrorMessage("Por favor ingresá el DNI del hermano que concurre a la escuela para verificar la prioridad.");
        return false;
      }
    }

    if (step === 4) {
      if (!formData.parent1Name.trim() || !formData.parent1Dni.trim() || !formData.parent1Phone.trim() || !formData.parent1Email.trim()) {
        setErrorMessage("Todos los datos del Responsable Parental 1 son obligatorios.");
        return false;
      }
      if (formData.parent1Email.trim().toLowerCase() !== formData.parent1EmailConfirm.trim().toLowerCase()) {
        setErrorMessage("Los correos electrónicos ingresados para el Responsable 1 no coinciden.");
        return false;
      }
      if (!formData.isSingleParent) {
        if (!formData.parent2Name.trim() || !formData.parent2Dni.trim() || !formData.parent2Phone.trim()) {
          setErrorMessage("Por favor completá los datos del Responsable Parental 2 o marcá la casilla de 'Único Responsable Parental'.");
          return false;
        }
      }
    }

    if (step === 5) {
      if (!formData.acceptsTerms) {
        setErrorMessage("Debés aceptar la declaración de que la preinscripción no garantiza vacante automática.");
        return false;
      }
      if (!formData.acceptsDataPolicy) {
        setErrorMessage("Debés aceptar el consentimiento de tratamiento de datos personales.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/enroll.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...formData,
          type: "preinscripcion_2027",
          cohortYear: 2027
        })
      });

      let json: any = null;
      try {
        const text = await res.text();
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (res.ok && json && json.success) {
        setSuccessData({
          id: json.id,
          trackingNumber: json.trackingNumber
        });
        localStorage.removeItem("fee_preinscripcion_draft_2027");
      } else {
        setErrorMessage(json?.error || "Ocurrió un error al procesar la preinscripción.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descarga de Comprobante Oficial en PDF
  const downloadReceiptPdf = () => {
    if (!successData) return;
    const doc = new jsPDF();
    
    doc.setFillColor(23, 42, 69); // #172A45
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FUNDACIÓN EDUCATIVA ESQUEL", 105, 14, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Comprobante Oficial de Solicitud de Preinscripción — Ciclo Lectivo 2027", 105, 22, { align: "center" });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`N° DE TRÁMITE: ${successData.trackingNumber}`, 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha y Hora de Emisión: ${new Date().toLocaleString("es-AR")}`, 20, 52);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 56, 190, 56);

    doc.setFont("helvetica", "bold");
    doc.text("1. DATOS DEL ASPIRANTE", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Aspirante: ${formData.studentName}`, 25, 73);
    doc.text(`DNI: ${formData.studentDni}`, 25, 80);
    doc.text(`Fecha de Nacimiento: ${formData.studentBirthDate} (${formData.studentNationality})`, 25, 87);
    doc.text(`Institución Solicitada: ${formData.school}`, 25, 94);
    doc.text(`Nivel y Curso/Sala: ${formData.studentLevel} — ${formData.studentGrade}`, 25, 101);

    doc.setFont("helvetica", "bold");
    doc.text("2. RESPONSABLES Y CONTACTO", 20, 115);
    doc.setFont("helvetica", "normal");
    doc.text(`Responsable 1: ${formData.parent1Name} (DNI ${formData.parent1Dni}) • Tel: ${formData.parent1Phone}`, 25, 123);
    doc.text(`Email: ${formData.parent1Email}`, 25, 130);
    doc.text(`Domicilio: ${formData.parent1Address}, ${formData.parent1City}`, 25, 137);

    // Citación a entrevistas
    doc.setFillColor(240, 253, 244);
    doc.rect(20, 150, 170, 35, "F");
    doc.setDrawColor(34, 197, 94);
    doc.rect(20, 150, 170, 35, "D");

    doc.setTextColor(20, 83, 45);
    doc.setFont("helvetica", "bold");
    doc.text("CITACIÓN PRESENCIAL OBLIGATORIA (ESCUELA N.º 1030)", 25, 158);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Días: 7 y 8 de Septiembre | Horarios: 09:00 a 12:00 hs y 14:30 a 16:00 hs", 25, 166);
    doc.text("Lugar: Sede Escuela N.º 1030 (Esquel)", 25, 173);
    doc.text("Finalidad: Entrevista diagnóstica, ponderación de inglés y charla informativa.", 25, 180);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text("* La presentación de esta solicitud no garantiza el otorgamiento de vacante, sujeta a cupos disponibles.", 20, 200);

    doc.save(`COMPROBANTE_PREINSCRIPCION_${formData.studentDni}_2027.pdf`);
  };

  // Pantalla si la convocatoria está cerrada
  if (!isConvocatoriaAbierta && !successData) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 text-center max-w-xl mx-auto space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto shadow-md">
          <Clock className="w-8 h-8" />
        </div>
        <span className="inline-block bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-amber-300">
          Convocatoria Cerrada
        </span>
        <h2 className="text-2xl font-black text-slate-900">Período de Preinscripción No Activo</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{closedMessage}</p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1 text-left">
          <p className="font-bold text-slate-800">Canales de Contacto Directo:</p>
          <p>• Escuela N.º 1030 (Inicial y Primario): +54 2945 45-1030</p>
          <p>• Escuela N.º 1739 (Secundario): +54 2945 45-1739</p>
          <p>• Email: contacto@fundacionesquel.edu.ar</p>
        </div>
      </div>
    );
  }

  // Pantalla de Éxito
  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300 space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-block bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-300">
          Preinscripción Registrada Exitosamente
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          ¡Solicitud de Admisión 2027 Recibida!
        </h2>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">N° de Trámite:</span>
            <span className="font-mono text-sm font-black text-slate-900">{successData.trackingNumber}</span>
          </div>
          <div className="text-xs text-slate-700 pt-1 space-y-1">
            <p><strong>Aspirante:</strong> {formData.studentName} (DNI {formData.studentDni})</p>
            <p><strong>Nivel y Curso:</strong> {formData.studentLevel} — {formData.studentGrade}</p>
            <p><strong>Institución:</strong> {formData.school}</p>
            <p><strong>Contacto Declarado:</strong> {formData.parent1Phone} • {formData.parent1Email}</p>
          </div>
        </div>

        {/* Citación a Entrevistas Destacada */}
        <div className="bg-emerald-50/90 border-2 border-emerald-400 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
            <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>CITACIÓN PRESENCIAL OBLIGATORIA EN ESCUELA N.º 1030</span>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Se solicita que concurran a la <strong>Escuela N.º 1030</strong> los días <strong>7 y 8 de septiembre</strong> en los horarios de <strong>09:00 a 12:00 hs</strong> y de <strong>14:30 a 16:00 hs</strong>.
          </p>
          <ul className="list-disc list-inside text-xs text-emerald-800 space-y-1 pl-1 font-medium">
            <li><strong>Nivel Inicial:</strong> Acordar días y horarios de entrevista diagnóstica.</li>
            <li><strong>Primaria (3.º a 6.º Grado):</strong> Coordinar el examen de ponderación de inglés.</li>
            <li><strong>Primaria (1.º y 2.º Grado):</strong> Charla informativa obligatoria sobre funcionamiento y exigencias de la escuela.</li>
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={downloadReceiptPdf}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Comprobante Oficial (PDF)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setSuccessData(null);
            setCurrentStep(1);
          }}
          className="text-xs text-slate-500 hover:underline pt-2 inline-block cursor-pointer"
        >
          Registrar otra solicitud de preinscripción
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Barra de Progreso de 5 Pasos */}
      <div className="mb-8">
        <div className="flex justify-between items-center text-xs font-black text-slate-500 mb-2">
          <span>Paso {currentStep} de 5: {
            currentStep === 1 ? "Datos del Aspirante" :
            currentStep === 2 ? "Trayectoria & Requisitos" :
            currentStep === 3 ? "Criterios de Prioridad" :
            currentStep === 4 ? "Responsables & Salud" : "Agenda & Confirmación"
          }</span>
          <span className="text-emerald-700">{currentStep * 20}% completado</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
            style={{ width: `${currentStep * 20}%` }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-800 p-4 rounded-2xl flex items-center gap-3 border border-red-200 text-xs font-semibold shadow-2xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 1: DATOS DEL ASPIRANTE */}
      {/* =================================================================== */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> 1. Datos Personales del Aspirante
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Información identificatoria del estudiante que solicita la vacante.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre y Apellido Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.studentName}
              onChange={e => setFormData({ ...formData, studentName: e.target.value })}
              placeholder="Ej: Sofía Valentina Gómez"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                DNI del Aspirante <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={formData.studentDni}
                onChange={e => setFormData({ ...formData, studentDni: e.target.value.replace(/[^0-9]/g, "") })}
                placeholder="7 u 8 dígitos sin puntos"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Género / Sexo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.studentGender}
                onChange={e => setFormData({ ...formData, studentGender: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold"
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Nacimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.studentBirthDate}
                onChange={e => setFormData({ ...formData, studentBirthDate: e.target.value })}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nacionalidad</label>
              <input
                type="text"
                value={formData.studentNationality}
                onChange={e => setFormData({ ...formData, studentNationality: e.target.value })}
                placeholder="Ej: Argentina"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lugar de Nacimiento</label>
              <input
                type="text"
                value={formData.studentBirthPlace}
                onChange={e => setFormData({ ...formData, studentBirthPlace: e.target.value })}
                placeholder="Ej: Esquel, Chubut"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              />
            </div>
          </div>

          {/* Nivel y Grado Deseado */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
              Institución y Nivel al que se Postula:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivel Educativo</label>
                <select
                  value={formData.studentLevel}
                  onChange={e => handleLevelChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                >
                  <option value="Nivel Inicial">Nivel Inicial (Escuela N.º 1030)</option>
                  <option value="Nivel Primario">Nivel Primario (Escuela N.º 1030)</option>
                  <option value="Nivel Secundario">Nivel Secundario (Escuela N.º 1739)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sala / Grado / Año a Cursar (2027)</label>
                <select
                  value={formData.studentGrade}
                  onChange={e => setFormData({ ...formData, studentGrade: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                >
                  {(gradeOptions[formData.studentLevel] || []).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Domicilio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Domicilio de Residencia (Calle, N° y Barrio) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.parent1Address}
              onChange={e => setFormData({ ...formData, parent1Address: e.target.value })}
              placeholder="Ej: Av. Alvear 1234, Barrio Centro"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 2: TRAYECTORIA ESCOLAR & INGLÉS */}
      {/* =================================================================== */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-600" /> 2. Trayectoria Escolar & Idioma Inglés
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Establecimiento de procedencia y antecedentes académicos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Establecimiento Educativo al que concurre actualmente
              </label>
              <input
                type="text"
                value={formData.currentSchool}
                onChange={e => setFormData({ ...formData, currentSchool: e.target.value })}
                placeholder="Nombre de la escuela o jardín actual"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Gestión</label>
              <select
                value={formData.currentSchoolType}
                onChange={e => setFormData({ ...formData, currentSchoolType: e.target.value as any })}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold"
              >
                <option value="publica">Gestión Estatal / Pública</option>
                <option value="privada">Gestión Privada</option>
                <option value="otra">Otra / No escolarizado aún</option>
              </select>
            </div>
          </div>

          {/* Alerta Libre Deuda para Gestión Privada */}
          {formData.currentSchoolType === "privada" && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Requisito para Establecimientos de Gestión Privada:</span>
              </div>
              <p className="text-xs text-amber-900">
                Las familias que provengan de instituciones privadas deberán presentar el <strong>Certificado de Libre Deuda</strong> correspondiente para formalizar la admisión definitiva.
              </p>
              <label className="flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.hasDebtClearance}
                  onChange={e => setFormData({ ...formData, hasDebtClearance: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span>Comprendo y me comprometo a presentar el certificado de libre deuda.</span>
              </label>
            </div>
          )}

          {/* Repitencia */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasRepeated}
                onChange={e => setFormData({ ...formData, hasRepeated: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>¿El aspirante ha repetido algún curso, grado o sala anteriormente?</span>
            </label>

            {formData.hasRepeated && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Indicar qué grado/año repitió:</label>
                <input
                  type="text"
                  value={formData.repeatedGrade}
                  onChange={e => setFormData({ ...formData, repeatedGrade: e.target.value })}
                  placeholder="Ej: 2° Grado"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
            )}
          </div>

          {/* Requisitos de Inglés para 3° a 6° Grado Primaria */}
          {isPrimaryThirdToSixth() && (
            <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-xs">
                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Acreditación de Idioma Inglés (Aspirantes de 3.º a 6.º Grado Primaria):</span>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">
                <strong>NOTA INSTITUCIONAL:</strong> A partir de 3.º grado se solicita nivel de inglés acreditado por boletín o libreta de instituto. Además se tomará <strong>examen de ponderación</strong> para evaluar el nivel y asignación de grupo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">Formación previa en inglés</label>
                  <select
                    value={formData.englishAccreditationType}
                    onChange={e => setFormData({ ...formData, englishAccreditationType: e.target.value as any })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border bg-white font-medium"
                  >
                    <option value="ninguno">Sin formación previa / Escolar básica</option>
                    <option value="instituto">Instituto de Inglés Privado</option>
                    <option value="escuela_bilingue">Colegio Bilingüe Anterior</option>
                    <option value="particular">Clases Particulares / Examen Internacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">Nombre del Instituto / Escuela</label>
                  <input
                    type="text"
                    value={formData.englishInstituteName}
                    onChange={e => setFormData({ ...formData, englishInstituteName: e.target.value })}
                    placeholder="Ej: Cultural Inglesa, Saint George"
                    className="w-full px-2.5 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-1">Nivel Alcanzado / Acreditado</label>
                  <select
                    value={formData.englishLevelAchieved}
                    onChange={e => setFormData({ ...formData, englishLevelAchieved: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border bg-white"
                  >
                    <option value="">Seleccionar nivel...</option>
                    <option value="A1 (Beginner / Starters)">A1 (Beginner / Starters)</option>
                    <option value="A2 (Elementary / Movers / Flyers)">A2 (Elementary / Movers / Flyers)</option>
                    <option value="B1 (Pre-Intermediate / KET / PET)">B1 (Pre-Intermediate / KET / PET)</option>
                    <option value="B2 (Intermediate / FCE)">B2 (Intermediate / FCE)</option>
                    <option value="Nivel 1 (1° año instituto)">Nivel 1 (1° año instituto)</option>
                    <option value="Nivel 2 (2° año instituto)">Nivel 2 (2° año instituto)</option>
                    <option value="Nivel 3 (3° año instituto)">Nivel 3 (3° año instituto)</option>
                    <option value="Nivel 4 o superior">Nivel 4 o superior</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 3: CRITERIOS DE PRIORIDAD */}
      {/* =================================================================== */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> 3. Criterios de Prioridad Institucional
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Vínculos institucionales para la ponderación y asignación de vacantes.</p>
          </div>

          {/* Hijo de Personal */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isStaffChild}
                onChange={e => setFormData({ ...formData, isStaffChild: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>¿El aspirante es hijo/a de personal docente o no docente de la Fundación?</span>
            </label>

            {formData.isStaffChild && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Personal de la FEE:</label>
                  <input
                    type="text"
                    value={formData.staffMemberName}
                    onChange={e => setFormData({ ...formData, staffMemberName: e.target.value })}
                    placeholder="Nombre y Apellido del agente"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI del Personal:</label>
                  <input
                    type="text"
                    value={formData.staffMemberDni}
                    onChange={e => setFormData({ ...formData, staffMemberDni: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="DNI del agente"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hermano en la Escuela */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasSiblingInSchool}
                onChange={e => setFormData({ ...formData, hasSiblingInSchool: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>¿Tiene hermanos/as que concurren actualmente a la Escuela N.º 1030 o 1739?</span>
            </label>

            {formData.hasSiblingInSchool && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI del Hermano/a Alumno/a Regular:</label>
                  <input
                    type="text"
                    value={formData.siblingDni}
                    onChange={e => setFormData({ ...formData, siblingDni: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="DNI para cruce automático con padrón"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Curso / Grado actual del hermano:</label>
                  <input
                    type="text"
                    value={formData.siblingCurrentGrade}
                    onChange={e => setFormData({ ...formData, siblingCurrentGrade: e.target.value })}
                    placeholder="Ej: 4° Grado Escuela 1030"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 4: RESPONSABLES & SALUD */}
      {/* =================================================================== */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" /> 4. Responsables Parentales, Contactos & Salud
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Información de contacto, situación legal y salud (Ley 25.326).</p>
          </div>

          {/* Responsable 1 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Responsable Parental 1 (Contacto Principal)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.parent1Name}
                  onChange={e => setFormData({ ...formData, parent1Name: e.target.value })}
                  placeholder="Nombre y Apellido"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={formData.parent1Dni}
                  onChange={e => setFormData({ ...formData, parent1Dni: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="Sin puntos"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ocupación / Profesión</label>
                <input
                  type="text"
                  value={formData.parent1Occupation}
                  onChange={e => setFormData({ ...formData, parent1Occupation: e.target.value })}
                  placeholder="Ocupación"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Celular (con código de área) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.parent1Phone}
                  onChange={e => setFormData({ ...formData, parent1Phone: e.target.value })}
                  placeholder="Ej: 2945 123456"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.parent1Email}
                  onChange={e => setFormData({ ...formData, parent1Email: e.target.value })}
                  placeholder="ejemplo@email.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirmar Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.parent1EmailConfirm}
                  onChange={e => setFormData({ ...formData, parent1EmailConfirm: e.target.value })}
                  placeholder="Reingrese el mismo email"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
            </div>
          </div>

          {/* Único Responsable Toggle */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl">
            <label className="flex items-center gap-2.5 text-xs font-bold text-emerald-950 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSingleParent}
                onChange={e => setFormData({ ...formData, isSingleParent: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Único Responsable Parental Declarado (Monoparental / Exclusivo)</span>
            </label>
          </div>

          {/* Responsable 2 */}
          {!formData.isSingleParent && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Responsable Parental 2 (Padre / Madre / Tutor)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required={!formData.isSingleParent}
                    value={formData.parent2Name}
                    onChange={e => setFormData({ ...formData, parent2Name: e.target.value })}
                    placeholder="Nombre y Apellido"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required={!formData.isSingleParent}
                    maxLength={8}
                    value={formData.parent2Dni}
                    onChange={e => setFormData({ ...formData, parent2Dni: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="Sin puntos"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ocupación / Profesión</label>
                  <input
                    type="text"
                    value={formData.parent2Occupation}
                    onChange={e => setFormData({ ...formData, parent2Occupation: e.target.value })}
                    placeholder="Ocupación"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Celular <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required={!formData.isSingleParent}
                    value={formData.parent2Phone}
                    onChange={e => setFormData({ ...formData, parent2Phone: e.target.value })}
                    placeholder="Celular"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.parent2Email}
                    onChange={e => setFormData({ ...formData, parent2Email: e.target.value })}
                    placeholder="ejemplo@email.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contacto de Emergencia y Situación Legal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contacto de Emergencia Alternativo</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="Nombre y vínculo (ej: Abuela Marta)"
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Emergencia</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="Teléfono alternativo"
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Personas Autorizadas a Retirar al Estudiante (Nombre y DNI):
            </label>
            <input
              type="text"
              value={formData.authorizedPickups}
              onChange={e => setFormData({ ...formData, authorizedPickups: e.target.value })}
              placeholder="Ej: Juan Pérez (DNI 20...), María López (DNI 25...)"
              className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
            />
          </div>

          {/* Datos de Salud (Ley 25.326) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Información Médica / Salud Relevante (Ley 25.326):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">CUD / Acompañamiento / Discapacidad</label>
                <input
                  type="text"
                  value={formData.healthDisabilities}
                  onChange={e => setFormData({ ...formData, healthDisabilities: e.target.value })}
                  placeholder="Indicar si posee CUD o requiere apoyo escolar"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Alergias / Medicación Habitual</label>
                <input
                  type="text"
                  value={formData.healthAllergiesMedication}
                  onChange={e => setFormData({ ...formData, healthAllergiesMedication: e.target.value })}
                  placeholder="Alergias severas o tratamientos crónicos"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PASO 5: AGENDA DE ENTREVISTAS & CONFIRMACIÓN */}
      {/* =================================================================== */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" /> 5. Agenda de Entrevistas & Confirmación
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Citación presencial del 7 y 8 de septiembre y aceptación de términos.</p>
          </div>

          {/* Citación Presencial Oficial */}
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
              <Calendar className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>CITACIÓN PRESENCIAL OBLIGATORIA (ESCUELA N.º 1030)</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {interviewNotice || "Se solicita que quienes hayan realizado la preinscripción concurran a la Escuela N.º 1030 los días 7 y 8 de septiembre de 09:00 a 12:00 hs y de 14:30 a 16:00 hs para acordar entrevistas en Nivel Inicial, la ponderación de inglés de 3° a 6° grado y la charla informativa de 1° y 2° grado."}
            </p>
          </div>

          {/* Grilla de Selección de Turnos con Cupo */}
          {availableSlots.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Seleccionar Franja Horaria Preferida de Entrevista / Charla (Cupos Limitados):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {availableSlots.map(slot => {
                  const isSelected = String(formData.interviewSlotId) === String(slot.id);
                  const is7Sept = slot.slotDate.includes("09-07");
                  const dateLabel = is7Sept ? "Lunes 7 de Septiembre" : "Martes 8 de Septiembre";
                  const timeLabel = `${slot.startTime.substring(0, 5)} a ${slot.endTime.substring(0, 5)} hs`;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, interviewSlotId: slot.id })}
                      className={cn(
                        "p-3 rounded-xl border text-left text-xs transition-all cursor-pointer",
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                      )}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{dateLabel}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-black", isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>
                          {slot.available} cupos
                        </span>
                      </div>
                      <div className="text-[11px] mt-1 opacity-90">{timeLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Términos y Consentimientos */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              Declaraciones y Consentimientos Obligatorios:
            </span>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.acceptsTerms}
                onChange={e => setFormData({ ...formData, acceptsTerms: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded shrink-0 mt-0.5"
              />
              <span>
                <strong>Aviso Legal de Preinscripción:</strong> Comprendo y acepto que la presente solicitud de preinscripción <strong>no garantiza el otorgamiento automático de una vacante</strong> escolar, estando sujeta al proceso evaluativo, prioridades y disponibilidad de cupos institucionales. <span className="text-red-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={formData.acceptsDataPolicy}
                onChange={e => setFormData({ ...formData, acceptsDataPolicy: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded shrink-0 mt-0.5"
              />
              <span>
                Consiento el tratamiento de los datos personales y de salud informados exclusivamente para fines administrativos, diagnósticos y académicos de la Fundación Educativa Esquel (Ley 25.326). <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones o Consultas Adicionales (Opcional):</label>
            <textarea
              rows={2}
              value={formData.comments}
              onChange={e => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Comentarios adicionales que considere pertinentes..."
              className="w-full px-3 py-2 text-xs rounded-xl border bg-white outline-none"
            />
          </div>
        </div>
      )}

      {/* Botones de Navegación */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
        ) : <div />}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando Preinscripción...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Confirmar y Enviar Preinscripción</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
