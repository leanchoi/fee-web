"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Users, 
  CreditCard, 
  School, 
  ShieldCheck, 
  Copy, 
  Eye, 
  X,
  Sparkles,
  Plus,
  Trash2
} from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { 
  downloadBlankContract, 
  downloadFilledContract, 
  EnrollmentContractData, 
  SiblingData,
  determineLevel,
  determineSchool
} from "@/lib/contractGenerator";
import { submitEnrollment } from "@/actions/enrollment";

const LEVEL_CONFIG = {
  "Nivel Inicial": {
    school: "Escuela N.º 1030",
    grades: ["Sala de 3", "Sala de 4", "Sala de 5"],
    description: "Jardín Maternal y de Infantes (Escuela N.º 1030)"
  },
  "Nivel Primario": {
    school: "Escuela N.º 1030",
    grades: ["1° Grado", "2° Grado", "3° Grado", "4° Grado", "5° Grado", "6° Grado"],
    description: "Educación Primaria (Escuela N.º 1030)"
  },
  "Nivel Secundario": {
    school: "Escuela N.º 1739",
    grades: ["1° Año", "2° Año", "3° Año", "4° Año", "5° Año", "6° Año"],
    description: "Educación Secundaria (Escuela N.º 1739)"
  }
};

export function EnrollmentForm() {
  // Estado del formulario
  const [formData, setFormData] = useState<EnrollmentContractData>({
    studentName: "",
    studentDni: "",
    studentLevel: "Nivel Inicial",
    school: "Escuela N.º 1030",
    studentGrade: "Sala de 3",
    hasSiblings: false,
    siblingDetails: "",

    parent1Name: "",
    parent1Dni: "",
    parent1Relationship: "Madre",
    parent1Phone: "",
    parent1Email: "",
    parent1Address: "",
    parent1City: "Esquel",
    parent1PostalCode: "9200",

    isSingleParent: false,
    parent2Name: "",
    parent2Dni: "",
    parent2Relationship: "Padre",
    parent2Phone: "",
    parent2Email: "",
    parent2Address: "",
    parent2City: "Esquel",
    parent2PostalCode: "9200",

    billingName: "",
    billingCuit: "",
    billingTaxCondition: "Consumidor Final",
    billingEmail: "",
    billingAddress: "",

    signature1Data: null,
    signature2Data: null,
  });

  // Lista tabulada de hermanos (hasta 4)
  const [siblingsList, setSiblingsList] = useState<SiblingData[]>([
    { id: "sib-1", name: "", level: "Nivel Inicial", school: "Escuela N.º 1030", grade: "Sala de 3" }
  ]);

  // Declaraciones legales
  const [contractAccepted, setContractAccepted] = useState(false);
  const [dataAccepted, setDataAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Estados de interfaz y modales
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ trackingNumber: string } | null>(null);

  // Cursos disponibles para el nivel seleccionado
  const currentLevel = (formData.studentLevel as keyof typeof LEVEL_CONFIG) || "Nivel Inicial";
  const gradeOptions = LEVEL_CONFIG[currentLevel]?.grades || LEVEL_CONFIG["Nivel Inicial"].grades;

  const handleLevelChange = (newLevel: string) => {
    const lvlKey = (newLevel as keyof typeof LEVEL_CONFIG) || "Nivel Inicial";
    const cfg = LEVEL_CONFIG[lvlKey];
    setFormData(prev => ({
      ...prev,
      studentLevel: newLevel,
      school: cfg.school,
      studentGrade: cfg.grades[0]
    }));
  };

  // Manejo de hermanos por nivel
  const handleAddSibling = () => {
    if (siblingsList.length >= 4) return;
    const newId = `sib-${Date.now()}`;
    setSiblingsList(prev => [
      ...prev,
      { id: newId, name: "", level: "Nivel Inicial", school: "Escuela N.º 1030", grade: "Sala de 3" }
    ]);
  };

  const handleRemoveSibling = (index: number) => {
    setSiblingsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSiblingLevelChange = (index: number, newLevel: string) => {
    const lvlKey = (newLevel as keyof typeof LEVEL_CONFIG) || "Nivel Inicial";
    const cfg = LEVEL_CONFIG[lvlKey];
    setSiblingsList(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        level: newLevel,
        school: cfg.school,
        grade: cfg.grades[0]
      };
      return updated;
    });
  };

  const handleSiblingFieldChange = (index: number, field: "name" | "grade", value: string) => {
    setSiblingsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCopyParent1ToBilling = () => {
    setFormData(prev => ({
      ...prev,
      billingName: prev.parent1Name,
      billingCuit: prev.parent1Dni,
      billingEmail: prev.parent1Email,
      billingAddress: prev.parent1Address ? `${prev.parent1Address}, ${prev.parent1City}` : prev.billingAddress
    }));
  };

  const validateForm = (): boolean => {
    setErrorMessage(null);

    // 1. Estudiante
    if (!formData.studentName.trim() || !formData.studentDni.trim() || !formData.studentGrade) {
      setErrorMessage("Por favor complete los datos obligatorios del estudiante (Nombre, DNI, Nivel y Curso 2027).");
      return false;
    }

    // 1.1 Hermanos si está activado
    if (formData.hasSiblings) {
      const validSiblings = siblingsList.filter(s => s.name.trim().length > 0);
      if (validSiblings.length === 0) {
        setErrorMessage("Indicó que tiene hermanos/as en la institución. Por favor ingrese al menos el nombre y curso de uno de ellos o seleccione 'No'.");
        return false;
      }
    }

    // 2. Responsable 1
    if (
      !formData.parent1Name.trim() ||
      !formData.parent1Dni.trim() ||
      !formData.parent1Phone.trim() ||
      !formData.parent1Email.trim() ||
      !formData.parent1Address.trim()
    ) {
      setErrorMessage("Por favor complete todos los datos obligatorios del Responsable Parental 1.");
      return false;
    }

    // 3. Responsable 2 (si no es monoparental)
    if (!formData.isSingleParent) {
      if (
        !formData.parent2Name?.trim() ||
        !formData.parent2Dni?.trim() ||
        !formData.parent2Phone?.trim() ||
        !formData.parent2Email?.trim()
      ) {
        setErrorMessage("Por favor complete los datos del Responsable Parental 2 o marque la casilla de único responsable parental.");
        return false;
      }
    }

    // 4. Facturación
    if (!formData.billingName?.trim() || !formData.billingCuit?.trim() || !formData.billingEmail?.trim()) {
      setErrorMessage("Por favor complete los datos obligatorios de Facturación.");
      return false;
    }

    // 5. Casillas legales
    if (!contractAccepted || !dataAccepted || !termsAccepted) {
      setErrorMessage("Debe aceptar las tres declaraciones juradas obligatorias para continuar.");
      return false;
    }

    // 6. Firmas
    if (!formData.signature1Data) {
      setErrorMessage("Debe registrar la firma digital en pantalla del Responsable Parental 1.");
      return false;
    }

    if (!formData.isSingleParent && !formData.signature2Data) {
      setErrorMessage("Debe registrar la firma digital en pantalla del Responsable Parental 2.");
      return false;
    }

    return true;
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Formatear resumen de hermanos para el contrato
      if (formData.hasSiblings) {
        const formattedSiblings = siblingsList
          .filter(s => s.name.trim().length > 0)
          .map(s => `${s.name.trim()} (${s.level || determineLevel(s.grade, s.school)} - ${s.grade})`)
          .join(" | ");
        setFormData(prev => ({
          ...prev,
          siblingDetails: formattedSiblings,
          siblingsList: siblingsList.filter(s => s.name.trim().length > 0)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          siblingDetails: "",
          siblingsList: []
        }));
      }
      setIsReviewModalOpen(true);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitEnrollment({
        ...formData,
        studentLevel: formData.studentLevel || determineLevel(formData.studentGrade, formData.school),
        school: formData.school || determineSchool(formData.studentLevel || "Nivel Primario")
      });

      if (result.success) {
        const tracking = result.trackingNumber || `FEE-2027-${Math.floor(10000 + Math.random() * 90000)}`;
        setSuccessData({ trackingNumber: tracking });
        setIsReviewModalOpen(false);

        // Disparar descarga automática del contrato completado con firmas
        try {
          downloadFilledContract({
            ...formData,
            trackingNumber: tracking,
            signedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error("Error al generar PDF en el cliente:", e);
        }
      } else {
        setErrorMessage(result.error || "Ocurrió un error al enviar la solicitud. Por favor intente nuevamente.");
        setIsReviewModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error de conexión con el servidor.");
      setIsReviewModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de éxito tras el envío
  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-emerald-200">
          Reinscripción 2027 Registrada
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
          ¡Solicitud Presentada con Éxito!
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Hemos recibido la solicitud de reinscripción para el/la estudiante <strong>{formData.studentName}</strong> (DNI {formData.studentDni}) en <strong>{formData.studentLevel} — {formData.studentGrade} ({formData.school})</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Número de Trámite Oficial:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-md text-sm">
              {successData.trackingNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">Nivel & Curso:</span>
            <span className="font-medium text-slate-700">{formData.studentLevel} — {formData.studentGrade}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">Fecha y Hora:</span>
            <span className="font-medium text-slate-700">{new Date().toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
            <span className="text-slate-500 font-semibold">Notificación enviada a:</span>
            <span className="font-medium text-slate-700">{formData.parent1Email}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => downloadFilledContract({
              ...formData,
              trackingNumber: successData.trackingNumber,
              signedAt: new Date().toISOString()
            })}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Copia del Contrato Firmado (PDF)
          </button>

          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setFormData({
                studentName: "",
                studentDni: "",
                studentLevel: "Nivel Inicial",
                school: "Escuela N.º 1030",
                studentGrade: "Sala de 3",
                hasSiblings: false,
                siblingDetails: "",
                parent1Name: "",
                parent1Dni: "",
                parent1Relationship: "Madre",
                parent1Phone: "",
                parent1Email: "",
                parent1Address: "",
                parent1City: "Esquel",
                parent1PostalCode: "9200",
                isSingleParent: false,
                parent2Name: "",
                parent2Dni: "",
                parent2Relationship: "Padre",
                parent2Phone: "",
                parent2Email: "",
                parent2Address: "",
                parent2City: "Esquel",
                parent2PostalCode: "9200",
                billingName: "",
                billingCuit: "",
                billingTaxCondition: "Consumidor Final",
                billingEmail: "",
                billingAddress: "",
                signature1Data: null,
                signature2Data: null,
              });
              setSiblingsList([{ id: "sib-1", name: "", level: "Nivel Inicial", school: "Escuela N.º 1030", grade: "Sala de 3" }]);
              setContractAccepted(false);
              setDataAccepted(false);
              setTermsAccepted(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline block mx-auto pt-2 cursor-pointer"
          >
            Completar reinscripción para otro/a estudiante
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleOpenReview} className="space-y-10">
        {/* Banner de Introducción */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 text-sm text-blue-950 leading-relaxed space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Ciclo Lectivo 2027 — Escuelas N.º 1030 y N.º 1739
          </div>
          <p>
            Complete la información solicitada para iniciar la reinscripción del/de la estudiante para el ciclo lectivo 2027. La presentación de este formulario no implica la confirmación automática de la vacante. La reinscripción quedará sujeta a la verificación del cumplimiento de los requisitos administrativos y arancelarios establecidos por la Fundación.
          </p>
          <p className="text-xs text-blue-800 font-semibold pt-1">
            Los campos obligatorios están identificados con un asterisco (<span className="text-red-500 font-bold">*</span>). Deberá completarse un formulario por cada estudiante.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border border-red-200 text-sm shadow-2xs animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. DATOS DEL/DE LA ESTUDIANTE */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Datos del/de la Estudiante</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentName}
                onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Nombre completo del estudiante"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studentDni}
                onChange={e => setFormData({ ...formData, studentDni: e.target.value })}
                placeholder="Sin puntos (ej. 45123456)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nivel Educativo para el ciclo 2027 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.studentLevel || "Nivel Inicial"}
                onChange={e => handleLevelChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-semibold text-emerald-950 transition-all bg-white"
              >
                <option value="Nivel Inicial">Nivel Inicial — Jardín (Escuela N.º 1030)</option>
                <option value="Nivel Primario">Nivel Primario (Escuela N.º 1030)</option>
                <option value="Nivel Secundario">Nivel Secundario (Escuela N.º 1739)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sala, grado o año que cursará en 2027 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.studentGrade}
                onChange={e => setFormData({ ...formData, studentGrade: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium transition-all bg-white"
              >
                {gradeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hermanos en la institución - Tabulado y estructurado hasta 4 */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                ¿Tiene hermanos/as que asisten a alguna de las escuelas de la Fundación? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="hasSiblings"
                    checked={formData.hasSiblings === true}
                    onChange={() => {
                      setFormData(prev => ({ ...prev, hasSiblings: true }));
                      if (siblingsList.length === 0) {
                        setSiblingsList([{ id: "sib-1", name: "", level: "Nivel Inicial", school: "Escuela N.º 1030", grade: "Sala de 3" }]);
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  Sí
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="hasSiblings"
                    checked={formData.hasSiblings === false}
                    onChange={() => setFormData(prev => ({ ...prev, hasSiblings: false, siblingDetails: "" }))}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  No
                </label>
              </div>
            </div>

            {formData.hasSiblings && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Detalle de Hermanos/as en la institución (hasta 4)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {siblingsList.length} de 4 agregados
                  </span>
                </div>

                <div className="space-y-3">
                  {siblingsList.map((sib, index) => {
                    const sibLevel = (sib.level as keyof typeof LEVEL_CONFIG) || "Nivel Inicial";
                    const sibGrades = LEVEL_CONFIG[sibLevel]?.grades || LEVEL_CONFIG["Nivel Inicial"].grades;

                    return (
                      <div key={sib.id || index} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Hermano/a #{index + 1}
                          </span>
                          {siblingsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSibling(index)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                              title="Quitar este hermano/a"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Quitar
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nombre y Apellido <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sib.name}
                              onChange={e => handleSiblingFieldChange(index, "name", e.target.value)}
                              placeholder="Nombre completo"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nivel 2027 <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={sib.level || "Nivel Inicial"}
                              onChange={e => handleSiblingLevelChange(index, e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                            >
                              <option value="Nivel Inicial">Inicial (Esc. 1030)</option>
                              <option value="Nivel Primario">Primario (Esc. 1030)</option>
                              <option value="Nivel Secundario">Secundario (Esc. 1739)</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Sala / Grado / Año <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={sib.grade}
                              onChange={e => handleSiblingFieldChange(index, "grade", e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                            >
                              {sibGrades.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {siblingsList.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddSibling}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar otro/a hermano/a
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. RESPONSABLE PARENTAL 1 */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Responsable Parental 1 (Principal)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1Name}
                onChange={e => setFormData({ ...formData, parent1Name: e.target.value })}
                placeholder="Nombre completo"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1Dni}
                onChange={e => setFormData({ ...formData, parent1Dni: e.target.value })}
                placeholder="Sin puntos"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vínculo con el/la estudiante <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.parent1Relationship}
                onChange={e => setFormData({ ...formData, parent1Relationship: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium transition-all bg-white"
              >
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor Legal">Tutor Legal</option>
                <option value="Tutora Legal">Tutora Legal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono Celular <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.parent1Phone}
                onChange={e => setFormData({ ...formData, parent1Phone: e.target.value })}
                placeholder="Ej. +54 9 2945 123456"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.parent1Email}
                onChange={e => setFormData({ ...formData, parent1Email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domicilio (Calle y Número) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1Address}
                onChange={e => setFormData({ ...formData, parent1Address: e.target.value })}
                placeholder="Calle y número"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ciudad / Localidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1City}
                onChange={e => setFormData({ ...formData, parent1City: e.target.value })}
                placeholder="Esquel"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1PostalCode}
                onChange={e => setFormData({ ...formData, parent1PostalCode: e.target.value })}
                placeholder="9200"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. RESPONSABLE PARENTAL 2 */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Responsable Parental 2</h3>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSingleParent === true}
                onChange={e => setFormData({ ...formData, isSingleParent: e.target.checked })}
                className="w-5 h-5 shrink-0 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5"
              />
              <span className="text-xs font-semibold text-slate-800 leading-snug">
                Declaro ser el/la único/a responsable parental habilitado/a para formalizar la reinscripción
              </span>
            </label>
          </div>

          {!formData.isSingleParent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!formData.isSingleParent}
                    value={formData.parent2Name || ""}
                    onChange={e => setFormData({ ...formData, parent2Name: e.target.value })}
                    placeholder="Nombre completo del segundo responsable"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={!formData.isSingleParent}
                    value={formData.parent2Dni || ""}
                    onChange={e => setFormData({ ...formData, parent2Dni: e.target.value })}
                    placeholder="Sin puntos"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vínculo con el/la estudiante <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.parent2Relationship || "Padre"}
                    onChange={e => setFormData({ ...formData, parent2Relationship: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium transition-all bg-white"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Tutora Legal">Tutora Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required={!formData.isSingleParent}
                    value={formData.parent2Phone || ""}
                    onChange={e => setFormData({ ...formData, parent2Phone: e.target.value })}
                    placeholder="Ej. +54 9 2945 654321"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required={!formData.isSingleParent}
                    value={formData.parent2Email || ""}
                    onChange={e => setFormData({ ...formData, parent2Email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 4. DATOS DE FACTURACIÓN */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900">Datos de Facturación</h3>
            </div>
            <button
              type="button"
              onClick={handleCopyParent1ToBilling}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar datos de Responsable 1
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido o Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billingName || ""}
                onChange={e => setFormData({ ...formData, billingName: e.target.value })}
                placeholder="Titular de facturación"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CUIT / CUIL / DNI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billingCuit || ""}
                onChange={e => setFormData({ ...formData, billingCuit: e.target.value })}
                placeholder="Sin guiones ni puntos"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condición frente al IVA <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.billingTaxCondition || "Consumidor Final"}
                onChange={e => setFormData({ ...formData, billingTaxCondition: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium transition-all bg-white"
              >
                <option value="Consumidor Final">Consumidor Final</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico para envío de facturación <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.billingEmail || ""}
                onChange={e => setFormData({ ...formData, billingEmail: e.target.value })}
                placeholder="facturacion@correo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Domicilio Fiscal (Opcional)
            </label>
            <input
              type="text"
              value={formData.billingAddress || ""}
              onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Calle, número, ciudad"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. CONTRATO MARCO Y DECLARACIONES JURADAS */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              5
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Contrato Marco de Prestación de Servicios Educativos
            </h3>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Documento Oficial de la Fundación Educativa Esquel
                </span>
                <p className="text-xs text-slate-600">
                  Podés leer el texto íntegro de las 23 cláusulas en pantalla o descargar el modelo en formato PDF.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  Leer Contrato en Pantalla
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlankContract()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar Modelo en Blanco (PDF)
                </button>
              </div>
            </div>

            {/* Checkboxes de aceptación uniformes */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={contractAccepted}
                  onChange={e => setContractAccepted(e.target.checked)}
                  className="w-5 h-5 shrink-0 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5"
                />
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  <strong>Declaro haber leído íntegramente el Contrato Marco de Prestación de Servicios Educativos</strong> de la Fundación Educativa Esquel y manifiesto mi aceptación expresa de sus cláusulas y condiciones. <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={dataAccepted}
                  onChange={e => setDataAccepted(e.target.checked)}
                  className="w-5 h-5 shrink-0 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5"
                />
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  <strong>Declaro que los datos proporcionados en este formulario son completos y verdaderos.</strong> <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 shrink-0 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300 cursor-pointer mt-0.5"
                />
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  <strong>Autorizo el tratamiento de los datos proporcionados</strong> para la gestión educativa, administrativa, contractual y arancelaria de la reinscripción. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. FIRMA DE LOS RESPONSABLES PARENTALES */}
        {/* ======================================================== */}
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              6
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Firmas de Conformidad Digital en Pantalla</h3>
              <p className="text-xs text-slate-500">Trazo con el dedo (celular/tablet) o con el mouse (computadora)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firma Responsable 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <SignatureCanvas
                label={`Firma del/de la ${formData.parent1Relationship || "Responsable 1"}`}
                sublabel={`Aclaración: ${formData.parent1Name || "---"} | DNI: ${formData.parent1Dni || "---"}`}
                required
                onSave={dataUrl => setFormData(prev => ({ ...prev, signature1Data: dataUrl }))}
              />
              <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>DNI: {formData.parent1Dni || "---"}</span>
                <span>Registro digital automático</span>
              </div>
            </div>

            {/* Firma Responsable 2 */}
            {!formData.isSingleParent ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <SignatureCanvas
                  label={`Firma del/de la ${formData.parent2Relationship || "Responsable 2"}`}
                  sublabel={`Aclaración: ${formData.parent2Name || "---"} | DNI: ${formData.parent2Dni || "---"}`}
                  required
                  onSave={dataUrl => setFormData(prev => ({ ...prev, signature2Data: dataUrl }))}
                />
                <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>DNI: {formData.parent2Dni || "---"}</span>
                  <span>Registro digital automático</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <ShieldCheck className="w-8 h-8 text-amber-500 mb-2" />
                <span className="font-semibold text-slate-700">Firma 2 no requerida</span>
                <p className="mt-1">Se declaró único/a responsable parental habilitado/a para formalizar la reinscripción.</p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. BOTÓN DE REVISIÓN Y ENVÍO */}
        {/* ======================================================== */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <button
            type="submit"
            className="w-full py-4 px-8 rounded-2xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Revisar y Enviar Solicitud de Reinscripción 2027
          </button>
          <p className="text-center text-xs text-slate-400">
            Podrás revisar el resumen completo de los datos antes de formalizar la presentación.
          </p>
        </div>
      </form>

      {/* ======================================================== */}
      {/* MODAL DE LECTURA DEL CONTRATO COMPLETO (23 CLÁUSULAS ÍNTEGRAS) */}
      {/* ======================================================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    Contrato Marco de Prestación de Servicios Educativos
                  </h4>
                  <p className="text-xs text-slate-500">Fundación Educativa Esquel — Ciclo Lectivo 2027</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadBlankContract()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar Modelo (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido Cláusulas Íntegras */}
            <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-6">
              <div className="text-center pb-4 border-b border-slate-100">
                <h5 className="font-bold text-sm text-slate-900">FUNDACIÓN EDUCATIVA ESQUEL</h5>
                <p className="text-slate-500">Chacabuco Nº 1029, Esquel, Chubut — Escuelas N.º 1030 y N.º 1739</p>
              </div>

              {/* DISPOSICIONES PRELIMINARES */}
              <div className="space-y-3">
                <h6 className="font-extrabold text-sm text-slate-900 border-b pb-1">DISPOSICIONES PRELIMINARES</h6>
                
                <div>
                  <p className="font-bold text-slate-900">Cláusula 1° – Naturaleza del contrato</p>
                  <p className="mt-1 text-slate-600">
                    El presente constituye un contrato marco de prestación de servicios educativos celebrado entre LA FUNDACIÓN y LOS RESPONSABLES PARENTALES del/de la alumno/a, destinado a regular el vínculo educativo mientras subsista la permanencia del/de la alumno/a en cualquiera de los establecimientos dependientes de LA FUNDACIÓN.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La firma del presente instrumento tendrá vigencia continuada durante toda la trayectoria escolar del/de la alumno/a dentro de LA FUNDACIÓN, sin necesidad de suscribir un nuevo contrato en cada ciclo lectivo, salvo modificación sustancial de las condiciones contractuales o requerimiento expreso de LA FUNDACIÓN.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La matriculación anual, reinscripción y continuidad del/de la alumno/a en cada ciclo lectivo quedarán sujetas al cumplimiento de los requisitos académicos, administrativos, arancelarios y de convivencia establecidos en el presente contrato, en la normativa educativa vigente y en las reglamentaciones institucionales aplicables.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La reserva de vacante y reinscripción anual no operarán de manera automática, quedando supeditadas al cumplimiento de las condiciones vigentes al momento de cada ciclo lectivo, y requerirá la aceptación anual expresa de las condiciones educativas y arancelarias vigentes de los RESPONSABLES PARENTALES.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 2° – Documentación complementaria</p>
                  <p className="mt-1 text-slate-600">Forman parte integrante del presente contrato los siguientes documentos institucionales:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Acuerdo Escolar de Convivencia correspondiente al nivel educativo solicitado.</li>
                    <li>Proyecto Educativo Institucional.</li>
                    <li>Planilla de datos administrativos y de facturación, en la que deberán consignarse los datos de los RESPONSABLES PARENTALES y adjuntarse copia de sus respectivos documentos nacionales de identidad (DNI), así como de un servicio o documentación que permita acreditar y corroborar el domicilio declarado, especificando asimismo cuál de los RESPONSABLES PARENTALES será el designado a efectos de la facturación.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    El RESPONSABLE PARENTAL así identificado y el domicilio informado constituirán, respectivamente, la persona y el domicilio principales a efectos de las comunicaciones y notificaciones que correspondan, incluyendo, entre otras, aquellas vinculadas con situaciones de mora o incumplimiento de obligaciones.
                  </p>
                </div>
              </div>

              {/* CAPÍTULO I */}
              <div className="space-y-3">
                <h6 className="font-extrabold text-sm text-slate-900 border-b pb-1">CAPÍTULO I: ASPECTOS INSTITUCIONALES</h6>
                
                <div>
                  <p className="font-bold text-slate-900">Cláusula 3° – Servicio educativo y marco institucional</p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN se compromete a brindar el servicio educativo conforme a la normativa oficial vigente y de acuerdo con los planes y diseños curriculares aprobados por el Ministerio de Educación de la Provincia del Chubut, incorporando además propuestas pedagógicas complementarias acordes a su ideario institucional.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La actividad educativa se desarrollará conforme al Proyecto Educativo Institucional y al Acuerdo Escolar de Convivencia vigentes, cuyos contenidos estarán disponibles para conocimiento de LOS RESPONSABLES PARENTALES.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La matriculación y permanencia del/de la alumno/a implican el conocimiento y aceptación razonable de dichas reglamentaciones institucionales, en tanto resulten compatibles con la normativa educativa y el ordenamiento jurídico vigente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 4° – Reserva de vacante</p>
                  <p className="mt-1 text-slate-600">
                    A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reservará una vacante para el/la alumno/a individualizado/a en la documentación de matriculación, exclusivamente para el ciclo lectivo correspondiente. La continuidad en ciclos posteriores requerirá completar el procedimiento anual de reinscripción y cumplir las condiciones vigentes para cada ciclo lectivo.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 5° – Adhesión al proyecto institucional</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES declaran conocer y adherir al Proyecto Educativo Institucional, al Acuerdo Escolar de Convivencia y a las reglamentaciones internas vigentes de LA FUNDACIÓN.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Asimismo, aceptan la organización institucional, pedagógica y administrativa dispuesta por LA FUNDACIÓN, incluyendo la distribución horaria, conformación de cursos, reasignación de divisiones y demás adecuaciones razonablemente necesarias para el correcto funcionamiento del servicio educativo. Toda modificación sustancial que pudiera afectar significativamente las condiciones esenciales de prestación del servicio educativo será informada oportunamente mediante los canales institucionales habituales.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 6° – Reinscripción y prestación del servicio educativo</p>
                  <p className="mt-1 text-slate-600">
                    Cumplidas las condiciones académicas, administrativas y arancelarias previstas en el presente contrato, y sujeto a disponibilidad institucional, LA FUNDACIÓN podrá reinscribir al/la alumno/a para el ciclo lectivo siguiente.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Toda decisión de no renovación o negativa de reinscripción deberá fundarse en causas objetivas, razonables y compatibles con la normativa educativa vigente, debiendo ser notificada fehacientemente a LOS RESPONSABLES PARENTALES.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La prestación del servicio educativo comprende:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>a) La enseñanza oficial correspondiente al nivel y año en el que se encuentre matriculado/a el/la alumno/a.</li>
                    <li>b) Las actividades institucionales, pedagógicas y formativas organizadas conforme al Proyecto Educativo Institucional.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    En caso de repitencia, la reinscripción quedará supeditada a la existencia de vacantes disponibles en el curso correspondiente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 7° – Uso institucional de imágenes</p>
                  <p className="mt-1 text-slate-600">
                    La autorización para captar, utilizar o difundir imágenes, fotografías y registros audiovisuales en los que aparezca el/la alumno/a se instrumentará mediante un consentimiento específico, separado y revocable. Dicho consentimiento distinguirá, como mínimo, el uso pedagógico interno, la difusión en el sitio web institucional, las redes sociales oficiales y el material gráfico o audiovisual público. LOS RESPONSABLES PARENTALES podrán revocar la autorización otorgada en cualquier momento mediante comunicación escrita dirigida a la Administración de LA FUNDACIÓN, la que no afectará publicaciones impresas ya distribuidas ni registros históricos institucionales. La negativa o revocación de esta autorización no afectará la matriculación ni la prestación del servicio educativo.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 8° – Firma y validez contractual</p>
                  <p className="mt-1 text-slate-600">
                    El presente contrato podrá suscribirse en soporte papel o mediante mecanismos electrónicos que permitan identificar a los firmantes, registrar la fecha de aceptación y conservar la integridad del documento. LA FUNDACIÓN pondrá a disposición de LOS RESPONSABLES PARENTALES una copia del contrato suscripto o aceptado.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La validez de la matriculación y continuidad del vínculo educativo quedará sujeta al cumplimiento de las condiciones académicas, administrativas, documentales y arancelarias previstas en el presente contrato y en la normativa institucional vigente para cada ciclo lectivo.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Las actualizaciones de valores arancelarios, reglamentaciones internas, cronogramas administrativos y demás condiciones aplicables a cada ciclo lectivo serán informadas con antelación razonable mediante los canales institucionales habituales. Cuando se modifiquen condiciones esenciales del vínculo, su incorporación al contrato requerirá la aceptación expresa de LOS RESPONSABLES PARENTALES en el procedimiento anual de matriculación o reinscripción.
                  </p>
                  <p className="mt-1 text-slate-600">
                    En caso de incumplimiento de los requisitos establecidos para cada ciclo lectivo dentro de los plazos informados, LA FUNDACIÓN podrá disponer de la vacante previa notificación por los medios institucionales habituales.
                  </p>
                </div>
              </div>

              {/* CAPÍTULO II */}
              <div className="space-y-3">
                <h6 className="font-extrabold text-sm text-slate-900 border-b pb-1">CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS</h6>
                
                <div>
                  <p className="font-bold text-slate-900">Cláusula 9° – Aranceles y modalidades de pago</p>
                  <p className="mt-1 text-slate-600">
                    El costo anual del servicio educativo será abonado en once (11) cuotas mensuales y consecutivas de Febrero a Diciembre, con vencimiento entre los días 1 y 10 de cada mes, independientemente de la cantidad de días efectivamente dictados durante el período correspondiente. En caso de tratarse una incorporación una vez iniciado el ciclo lectivo, corresponderá abonar las cuotas mensualizadas de los meses restantes.
                  </p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN habilita los siguientes medios de pago:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Transferencias bancarias inmediatas.</li>
                    <li>Débito automático.</li>
                    <li>Otros medios de pago que pudieran incorporarse en el futuro los que serán debidamente informados, a su debido tiempo.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    A efectos de solicitar la matriculación para el ciclo lectivo siguiente, resultará aplicable el régimen de libre deuda y acuerdos de pago previsto en la Cláusula 12.
                  </p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN no será responsable por alteraciones o imposibilidad de prestación derivadas de supuestos de caso fortuito, fuerza mayor, disposiciones de autoridad competente o circunstancias ajenas razonablemente a su control, conforme a la normativa vigente.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Las partes acuerdan aplicar el principio de esfuerzo compartido frente a procesos inflacionarios, modificaciones regulatorias o variaciones sustanciales de costos que alteren significativamente la ecuación económica del presente contrato.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 10° – Beneficios de terceros y medios de pago</p>
                  <p className="mt-1 text-slate-600">
                    Las promociones, descuentos, reintegros o planes de cuotas ofrecidos por entidades bancarias, emisoras de tarjetas o plataformas de pago se regirán por las condiciones, límites y vigencia establecidos por cada entidad. Los reclamos por beneficios o reintegros no aplicados por causas imputables a la entidad deberán tramitarse ante ésta. LA FUNDACIÓN responderá exclusivamente por la información, cargos y condiciones que ella establezca o comunique directamente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 11° – Descuentos y beneficios arancelarios</p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN podrá otorgar los siguientes beneficios arancelarios, los cuales deberán ser solicitados al inicio de cada ciclo lectivo y no revisten carácter automático ni permanente:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Quince por ciento (15%) de descuento para familias con dos hijos/as matriculados/as, aplicado sobre la cuota de menor valor.</li>
                    <li>Veinticinco por ciento (25%) de descuento para familias con tres o más hijos/as matriculados/as, aplicado sobre la cuota de menor valor.</li>
                    <li>Veinte por ciento (20%) de descuento para hijos/as de empleados de LA FUNDACIÓN.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    Será condición esencial para la conservación de dichos beneficios mantener regularidad en el pago íntegro y oportuno de las obligaciones arancelarias.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Los beneficios podrán ser suspendidos en caso de mora recurrente, entendiéndose por tal la existencia de dos (2) cuotas consecutivas o tres (3) alternadas impagas o abonadas fuera de término durante el mismo ciclo lectivo. La rehabilitación de los beneficios quedará sujeta a evaluación administrativa y podrá efectuarse a partir del siguiente ciclo lectivo.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 12° – Libre deuda y condición de matrícula</p>
                  <p className="mt-1 text-slate-600">
                    Será condición indispensable para completar la matriculación y obtener la reserva definitiva de la vacante no registrar deuda exigible con LA FUNDACIÓN. Las familias que registren deuda deberán cancelarla o formalizar un acuerdo de pago expresamente aceptado por LA FUNDACIÓN. La mera presentación de la solicitud de matriculación no implicará la reserva definitiva de la vacante mientras no se verifique el cumplimiento de esta condición.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Las familias consideradas morosas reincidentes no tendrán derecho automático a acceder a un nuevo acuerdo de pago. Su situación será evaluada por el Consejo de Administración, considerando los antecedentes de pago, los acuerdos previamente incumplidos y las circunstancias particulares debidamente acreditadas. Se considerará que existe mora reincidente cuando LOS RESPONSABLES PARENTALES: a) hayan incumplido dos acuerdos de pago formalizados durante los dos últimos ciclos lectivos; o b) registren tres cuotas consecutivas o cuatro alternadas impagas o abonadas con más de treinta (30) días de atraso y no regularicen su situación luego de una notificación formal de LA FUNDACIÓN. La decisión que se adopte será comunicada a LOS RESPONSABLES PARENTALES.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Para alumnos/as regulares, la Administración verificará internamente la inexistencia de deuda exigible o la existencia de un acuerdo de pago vigente y cumplido. Para nuevos ingresantes se solicitará únicamente la documentación que corresponda conforme al procedimiento de admisión informado por LA FUNDACIÓN.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 13° – Reembolsos</p>
                  <p className="mt-1 text-slate-600">
                    Los importes abonados en concepto de reserva de vacante y/o matrícula podrán reintegrarse de forma parcial o proporcional según el momento de la baja y los gastos administrativos efectivamente incurridos, justificados y verificados administrativamente, conforme a las políticas institucionales vigentes y la normativa aplicable, siempre y cuando no haya iniciado el ciclo lectivo, en cuyo caso no será reintegrable, por cuanto LA FUNDACIÓN mantuvo la reserva de lugar, y se procedió a su utilización.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 14° – Valor de matrícula y formas de pago</p>
                  <p className="mt-1 text-slate-600">
                    El valor de la reserva de vacante/matrícula equivaldrá a:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Uno coma cuatro (1,4) veces el valor de la cuota vigente al mes de agosto para alumnos/as regulares.</li>
                    <li>Uno coma ocho (1,8) veces el valor de la cuota vigente al mes de agosto para nuevos ingresantes.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    La matrícula podrá abonarse mediante transferencia bancaria, tarjeta de crédito, planes de pago u otras modalidades habilitadas e informadas por LA FUNDACIÓN. Las promociones, descuentos, planes de cuotas y costos financieros aplicables serán informados anualmente y deberán ser aceptados al formalizar la matriculación.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 15° – Plazos administrativos</p>
                  <p className="mt-1 text-slate-600">
                    Las fechas de matriculación interna y externa, así como los plazos para completar la documentación y acreditar el cumplimiento de los requisitos correspondientes, serán establecidos anualmente por LA FUNDACIÓN y comunicados mediante los canales institucionales habituales.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 16° – Actualización de valores</p>
                  <p className="mt-1 text-slate-600">
                    Los valores de las cuotas podrán ser actualizados durante los meses de Marzo, Junio y Octubre de cada ciclo lectivo, juntamente con la tasa correspondiente a intereses punitorios.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Asimismo, podrán efectuarse modificaciones extraordinarias cuando se produzcan variaciones sustanciales en costos salariales, cargas sociales, servicios, impuestos, regulaciones estatales u otros factores que impacten significativamente en la estructura económica del servicio educativo.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Toda modificación arancelaria será informada a LOS RESPONSABLES PARENTALES mediante los canales institucionales habituales con antelación razonable.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 17° – Becas</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES podrán solicitar becas o ayudas económicas conforme al Reglamento General de Becas vigente en la Administración de LA FUNDACIÓN.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La presentación de la solicitud no genera derecho automático a su otorgamiento, renovación ni continuidad, quedando sujeta a evaluación institucional conforme a los criterios establecidos en la reglamentación correspondiente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 18° – Mora y gestión de cobranza</p>
                  <p className="mt-1 text-slate-600">
                    El pago efectuado con posterioridad a la fecha de vencimiento devengará, desde dicha fecha y hasta su efectivo pago, la tasa de intereses punitorios que determine LA FUNDACIÓN, que no podrá ser superior a la tasa activa del Banco del Chubut con hasta una sobretasa del 10% (DIEZ) de la misma, y los cuales serán informados al inicio de cada ciclo lectivo y/o al momento de comunicarse modificaciones arancelarias.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La falta de pago de uno o más aranceles facultará a LA FUNDACIÓN a reclamar las sumas adeudadas, con más los intereses correspondientes y los gastos razonables de cobranza judicial o extrajudicial que resulten procedentes conforme a la normativa vigente.
                  </p>
                  <p className="mt-1 text-slate-600">
                    En caso de mora reiterada o persistente, y previa intimación fehaciente al domicilio constituido por LOS RESPONSABLES PARENTALES, LA FUNDACIÓN podrá iniciar las acciones legales tendientes al cobro de las sumas adeudadas.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Asimismo, la mora persistente podrá constituir causal suficiente para que LA FUNDACIÓN decida no renovar la matrícula o resolver el presente contrato para futuros ciclos lectivos, de conformidad con la normativa educativa aplicable y previa notificación fehaciente.
                  </p>
                  <p className="mt-1 text-slate-600">
                    En caso de no renovación para un ciclo lectivo futuro, LA FUNDACIÓN notificará la decisión con antelación suficiente y brindará la documentación necesaria para facilitar la continuidad educativa y el pase institucional del/de la alumno/a, de conformidad con la normativa aplicable.
                  </p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES reconocen el carácter arancelario y exigible de las obligaciones económicas asumidas. Las liquidaciones y certificaciones emitidas por la Administración podrán ser observadas mediante impugnación fundada o acreditación de error material, sin perjuicio de las acciones y procedimientos de cobro que legalmente correspondan.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Las partes acuerdan que dichas constancias podrán ser utilizadas como instrumento suficiente para promover las acciones judiciales de cobro que correspondan, incluyendo, en su caso, la vía ejecutiva prevista por la normativa procesal aplicable.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 19° – Responsabilidad de pago</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES asumen en forma solidaria la obligación de pago de la totalidad de los aranceles, cuotas, matrículas, intereses y demás conceptos derivados del presente contrato, independientemente de su situación personal, familiar, laboral o económica.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Dicha obligación subsiste durante toda la vigencia del vínculo educativo y hasta la cancelación total de las sumas adeudadas.
                  </p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN no asume responsabilidad ni intervención alguna en las situaciones particulares de índole familiar, económica o personal de LOS RESPONSABLES PARENTALES, las cuales no afectan la validez, exigibilidad ni cumplimiento de las obligaciones asumidas en el presente contrato.
                  </p>
                  <p className="mt-1 text-slate-600">
                    Sin perjuicio de ello, LA FUNDACIÓN podrá, a su exclusivo criterio institucional y conforme a sus políticas vigentes, evaluar situaciones particulares y eventualmente otorgar facilidades de pago o beneficios, sin que ello implique renuncia, modificación o novación de las obligaciones contractuales.
                  </p>
                </div>
              </div>

              {/* CAPÍTULO III */}
              <div className="space-y-3">
                <h6 className="font-extrabold text-sm text-slate-900 border-b pb-1">CAPÍTULO III: ASPECTOS ACADÉMICOS, FORMATIVOS Y DE CONVIVENCIA</h6>
                
                <div>
                  <p className="font-bold text-slate-900">Cláusula 20° – Participación familiar</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES reconocen que la educación constituye una tarea conjunta entre familia e institución y se comprometen a participar en las convocatorias institucionales que LA FUNDACIÓN considere necesarias u obligatorias.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 21° – Actividades institucionales</p>
                  <p className="mt-1 text-slate-600">
                    Las actividades recreativas, deportivas, convivencias, torneos y salidas educativas forman parte integrante del Proyecto Educativo Institucional.
                  </p>
                  <p className="mt-1 text-slate-600">
                    La participación en dichas actividades implica aceptación de las decisiones organizativas y pedagógicas adoptadas por LA FUNDACIÓN.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 22° – Equipos técnicos interdisciplinarios</p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN podrá dar intervención a sus equipos institucionales cuando resulte necesario para acompañar la trayectoria escolar o atender necesidades educativas del/la alumno(a). La intervención de profesionales externos y el tratamiento o comunicación de información sensible se realizarán con conocimiento de LOS RESPONSABLES PARENTALES y, cuando corresponda, mediante consentimiento específico, resguardando la privacidad, confidencialidad y autonomía progresiva del/de (la) alumno(a).
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 23° – Uso responsable de redes sociales</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES asumen la responsabilidad de promover el uso adecuado y responsable de redes sociales y plataformas digitales por parte de sus hijos/as o tutelados/as, comprometiéndose a colaborar con LA FUNDACIÓN en la prevención de situaciones que afecten la convivencia y bienestar de la comunidad educativa.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t text-slate-500 italic text-[11px]">
                Las partes constituyen domicilio especial en los indicados en el encabezado y acuerdan someter cualquier controversia a los Tribunales Ordinarios de la ciudad de Esquel.
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-3xl">
              <button
                type="button"
                onClick={() => downloadBlankContract()}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar Modelo PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setContractAccepted(true);
                  setIsContractModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Entendido y Aceptar Cláusulas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE REVISIÓN PREVIA ANTES DE ENVIAR */}
      {/* ======================================================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Revisión de Solicitud de Reinscripción 2027</h4>
                  <p className="text-xs text-slate-500">Por favor verifique que los datos ingresados sean correctos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs space-y-4 text-slate-700">
              {/* Estudiante */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block mb-2">Estudiante</span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Nombre:</strong> {formData.studentName}</div>
                  <div><strong>DNI:</strong> {formData.studentDni}</div>
                  <div><strong>Nivel:</strong> {formData.studentLevel}</div>
                  <div><strong>Curso 2027:</strong> {formData.studentGrade} ({formData.school})</div>
                  {formData.hasSiblings && (
                    <div className="col-span-2 text-slate-600"><strong>Hermanos/as:</strong> {formData.siblingDetails || "Registrados en el formulario"}</div>
                  )}
                </div>
              </div>

              {/* Responsable 1 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block mb-2">Responsable Parental 1</span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Nombre:</strong> {formData.parent1Name} ({formData.parent1Relationship})</div>
                  <div><strong>DNI:</strong> {formData.parent1Dni}</div>
                  <div><strong>Celular:</strong> {formData.parent1Phone}</div>
                  <div><strong>Email:</strong> {formData.parent1Email}</div>
                  <div className="col-span-2"><strong>Domicilio:</strong> {formData.parent1Address}, {formData.parent1City} (CP: {formData.parent1PostalCode})</div>
                </div>
              </div>

              {/* Responsable 2 */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block mb-2">Responsable Parental 2</span>
                {formData.isSingleParent ? (
                  <p className="text-amber-800 italic">Declarado/a como único/a responsable parental habilitado/a.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Nombre:</strong> {formData.parent2Name} ({formData.parent2Relationship})</div>
                    <div><strong>DNI:</strong> {formData.parent2Dni}</div>
                    <div><strong>Celular:</strong> {formData.parent2Phone}</div>
                    <div><strong>Email:</strong> {formData.parent2Email}</div>
                  </div>
                )}
              </div>

              {/* Facturación */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider block mb-2">Facturación</span>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Titular:</strong> {formData.billingName}</div>
                  <div><strong>CUIT/CUIL:</strong> {formData.billingCuit}</div>
                  <div><strong>Condición:</strong> {formData.billingTaxCondition}</div>
                  <div><strong>Email facturas:</strong> {formData.billingEmail}</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
              >
                Volver a editar
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando y generando contrato...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Firmar y Enviar Solicitud de Reinscripción
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
