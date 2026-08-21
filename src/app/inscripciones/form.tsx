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
import { downloadBlankContract, downloadFilledContract, EnrollmentContractData, SiblingData } from "@/lib/contractGenerator";
import { submitEnrollment } from "@/actions/enrollment";

const GRADE_OPTIONS_1030 = [
  "Sala de 3",
  "Sala de 4",
  "Sala de 5",
  "1° Grado",
  "2° Grado",
  "3° Grado",
  "4° Grado",
  "5° Grado",
  "6° Grado"
];

const GRADE_OPTIONS_1739 = [
  "1° Año",
  "2° Año",
  "3° Año",
  "4° Año",
  "5° Año",
  "6° Año"
];

export function EnrollmentForm() {
  // Estado del formulario
  const [formData, setFormData] = useState<EnrollmentContractData>({
    studentName: "",
    studentDni: "",
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
    { id: "sib-1", name: "", school: "Escuela N.º 1030", grade: "Sala de 3" }
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

  // Opciones dinámicas de salas/grados según la escuela del estudiante principal
  const gradeOptions = formData.school === "Escuela N.º 1030" 
    ? GRADE_OPTIONS_1030 
    : GRADE_OPTIONS_1739;

  const handleSchoolChange = (newSchool: string) => {
    const defaultGrade = newSchool === "Escuela N.º 1030" ? "Sala de 3" : "1° Año";
    setFormData(prev => ({
      ...prev,
      school: newSchool,
      studentGrade: defaultGrade
    }));
  };

  // Manejo de hermanos
  const handleAddSibling = () => {
    if (siblingsList.length >= 4) return;
    const newId = `sib-${Date.now()}`;
    setSiblingsList(prev => [
      ...prev,
      { id: newId, name: "", school: "Escuela N.º 1030", grade: "Sala de 3" }
    ]);
  };

  const handleRemoveSibling = (index: number) => {
    setSiblingsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSiblingChange = (index: number, field: keyof SiblingData, value: string) => {
    setSiblingsList(prev => {
      const updated = [...prev];
      if (field === "school") {
        const defaultGrade = value === "Escuela N.º 1030" ? "Sala de 3" : "1° Año";
        updated[index] = { ...updated[index], school: value, grade: defaultGrade };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
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
      setErrorMessage("Por favor complete los datos obligatorios del estudiante (Nombre, DNI y Curso 2027).");
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
          .map(s => `${s.name.trim()} (${s.school} - ${s.grade})`)
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
      const result = await submitEnrollment(formData);

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
          Hemos recibido la solicitud de reinscripción para el/la estudiante <strong>{formData.studentName}</strong> (DNI {formData.studentDni}) en <strong>{formData.school} — {formData.studentGrade}</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-semibold">Número de Trámite Oficial:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2.5 py-1 rounded-md text-sm">
              {successData.trackingNumber}
            </span>
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
              setSiblingsList([{ id: "sib-1", name: "", school: "Escuela N.º 1030", grade: "Sala de 3" }]);
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
                Escuela en la que solicita la reinscripción para 2027 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.school}
                onChange={e => handleSchoolChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-medium transition-all bg-white"
              >
                <option value="Escuela N.º 1030">Escuela N.º 1030 (Jardín y Primaria)</option>
                <option value="Escuela N.º 1739">Escuela N.º 1739 (Secundaria)</option>
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
                        setSiblingsList([{ id: "sib-1", name: "", school: "Escuela N.º 1030", grade: "Sala de 3" }]);
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
                    const siblingGrades = sib.school === "Escuela N.º 1030" 
                      ? GRADE_OPTIONS_1030 
                      : GRADE_OPTIONS_1739;

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
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Nombre y Apellido <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sib.name}
                              onChange={e => handleSiblingChange(index, "name", e.target.value)}
                              placeholder="Nombre completo"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Escuela 2027 <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={sib.school}
                              onChange={e => handleSiblingChange(index, "school", e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                            >
                              <option value="Escuela N.º 1030">Esc. 1030</option>
                              <option value="Escuela N.º 1739">Esc. 1739</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Sala/Grado/Año <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={sib.grade}
                              onChange={e => handleSiblingChange(index, "grade", e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium"
                            >
                              {siblingGrades.map(g => (
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
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 7° – Uso institucional de imágenes</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES autorizan a LA FUNDACIÓN a utilizar imágenes y registros audiovisuales del/de la alumno/a obtenidos en actividades escolares, pedagógicas, recreativas, culturales e institucionales, con fines exclusivamente pedagógicos, divulgativos e institucionales, en publicaciones oficiales, plataformas educativas, sitio web y redes sociales de LA FUNDACIÓN, sin fines de lucro comercial y en el marco de la normativa de protección de datos personales y de la niñez y adolescencia. Dicha autorización podrá ser revocada o limitada en cualquier momento mediante notificación expresa y fehaciente por escrito.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 8° – Firma y validez contractual</p>
                  <p className="mt-1 text-slate-600">
                    El presente contrato podrá ser suscripto en soporte papel mediante firma ológrafa o a través de medios electrónicos mediante firma electrónica, reconociendo ambas partes su plena validez, eficacia jurídica y fuerza obligatoria.
                  </p>
                </div>
              </div>

              {/* CAPÍTULO II */}
              <div className="space-y-3">
                <h6 className="font-extrabold text-sm text-slate-900 border-b pb-1">CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS</h6>
                
                <div>
                  <p className="font-bold text-slate-900">Cláusula 9° – Aranceles y modalidades de pago</p>
                  <p className="mt-1 text-slate-600">
                    El costo del servicio educativo correspondiente a cada ciclo lectivo se compone de un arancel anual que se divide, a los efectos de su pago, en ONCE (11) cuotas mensuales y consecutivas, correspondientes a los meses de FEBRERO a DICIEMBRE inclusive de cada año. Las cuotas mensuales vencerán del día 1 al 10 de cada mes. En caso de que el día 10 fuera inhábil o feriado, el vencimiento operará el primer día hábil posterior.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 10° – Beneficios de terceros y medios de pago</p>
                  <p className="mt-1 text-slate-600">
                    Los descuentos, promociones, reintegros o beneficios derivados de convenios celebrados con entidades bancarias o financieras serán de exclusiva responsabilidad de dichas entidades, no asumiendo LA FUNDACIÓN responsabilidad alguna por su otorgamiento, modificación o suspensión.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 11° – Descuentos y beneficios arancelarios</p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN otorga beneficios arancelarios a familias con más de un/a hijo/a matriculado/a en sus establecimientos:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Familias con dos (2) hijos/as: 15% de descuento sobre el valor de la cuota mensual del arancel de menor valor.</li>
                    <li>Familias con tres (3) o más hijos/as: 25% de descuento sobre el valor de las cuotas mensuales de los aranceles de menor valor.</li>
                  </ul>
                  <p className="mt-1 text-slate-600">
                    Estos descuentos no son acumulables con otros beneficios arancelarios y caducarán automáticamente en caso de mora en el pago de cualquiera de las cuotas mensuales.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 12° – Libre deuda y condición de matrícula</p>
                  <p className="mt-1 text-slate-600">
                    Es condición indispensable para formalizar la matriculación inicial, la reinscripción en cada ciclo lectivo posterior y la reserva definitiva de vacante no registrar deuda exigible por ningún concepto con LA FUNDACIÓN al momento de efectivizarse el trámite correspondiente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 13° – Reembolsos</p>
                  <p className="mt-1 text-slate-600">
                    Los importes abonados en concepto de matrícula y cuotas mensuales no serán reintegrables, excepto cuando el/la aspirante no hubiera obtenido vacante por causas no imputables a LOS RESPONSABLES PARENTALES, o mediara cancelación formal de la vacante solicitada con una antelación mínima de diez (10) días corridos previos al inicio del ciclo lectivo correspondiente.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 14° – Valor de matrícula y formas de pago</p>
                  <p className="mt-1 text-slate-600">
                    El valor de la matrícula para cada ciclo lectivo se fijará conforme a las siguientes pautas:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 pl-2">
                    <li>Alumnos/as regulares: 1,4 veces el valor de la cuota mensual vigente al mes de agosto del año en curso.</li>
                    <li>Nuevos/as ingresantes: 1,8 veces el valor de la cuota mensual vigente al mes de agosto del año en curso.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 15° – Requisitos adicionales para nuevos/as ingresantes</p>
                  <p className="mt-1 text-slate-600">
                    Para los/as alumnos/as que ingresen por primera vez a LA FUNDACIÓN, además de los requisitos generales, será condición necesaria para la matriculación definitiva la acreditación de la documentación académica previa y la aprobación de los procesos de admisión institucional.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 16° – Modificación de aranceles</p>
                  <p className="mt-1 text-slate-600">
                    Los valores de las cuotas podrán ser actualizados durante los meses de Marzo, Junio y Octubre de cada ciclo lectivo, juntamente con la tasa correspondiente a intereses punitorios, y de forma extraordinaria ante variaciones sustanciales en costos salariales o normativas.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 17° – Becas</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES podrán solicitar becas o ayudas económicas conforme al Reglamento General de Becas vigente en la Administración de LA FUNDACIÓN.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 18° – Mora y gestión de cobranza</p>
                  <p className="mt-1 text-slate-600">
                    El pago efectuado con posterioridad a la fecha de vencimiento devengará intereses punitorios. En caso de mora reiterada o persistente, previa intimación fehaciente, LA FUNDACIÓN podrá iniciar las acciones legales tendientes al cobro de las sumas adeudadas y/o decidir no renovar la matrícula para futuros ciclos lectivos.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 19° – Responsabilidad de pago</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES asumen en forma solidaria la obligación de pago de la totalidad de los aranceles, cuotas, matrículas, intereses y demás conceptos derivados del presente contrato, independientemente de su situación personal, familiar, laboral o económica.
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
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 22° – Equipos técnicos interdisciplinarios</p>
                  <p className="mt-1 text-slate-600">
                    LA FUNDACIÓN podrá dar intervención a sus equipos institucionales cuando resulte necesario para acompañar la trayectoria escolar o atender necesidades educativas del/la alumno/a, resguardando la privacidad y confidencialidad.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Cláusula 23° – Uso responsable de redes sociales</p>
                  <p className="mt-1 text-slate-600">
                    LOS RESPONSABLES PARENTALES asumen la responsabilidad de promover el uso adecuado y responsable de redes sociales y plataformas digitales por parte de sus hijos/as o tutelados/as.
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
                  <div><strong>Escuela:</strong> {formData.school}</div>
                  <div><strong>Curso 2027:</strong> {formData.studentGrade}</div>
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
