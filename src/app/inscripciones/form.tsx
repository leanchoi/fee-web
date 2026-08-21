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
  Sparkles
} from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { downloadBlankContract, downloadFilledContract, EnrollmentContractData } from "@/lib/contractGenerator";
import { submitEnrollment } from "@/actions/enrollment";

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

  // Opciones dinámicas de salas/grados según la escuela seleccionada
  const gradeOptions = formData.school === "Escuela N.º 1030" 
    ? [
        "Sala de 3",
        "Sala de 4",
        "Sala de 5",
        "1° Grado",
        "2° Grado",
        "3° Grado",
        "4° Grado",
        "5° Grado",
        "6° Grado"
      ]
    : [
        "1° Año",
        "2° Año",
        "3° Año",
        "4° Año",
        "5° Año",
        "6° Año"
      ];

  const handleSchoolChange = (newSchool: string) => {
    const defaultGrade = newSchool === "Escuela N.º 1030" ? "Sala de 3" : "1° Año";
    setFormData(prev => ({
      ...prev,
      school: newSchool,
      studentGrade: defaultGrade
    }));
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

    if (formData.hasSiblings && !formData.siblingDetails?.trim()) {
      setErrorMessage("Por favor indique el nombre, escuela y curso del/de la hermano/a.");
      return false;
    }

    // 2. Responsable 1
    if (
      !formData.parent1Name.trim() ||
      !formData.parent1Dni.trim() ||
      !formData.parent1Phone.trim() ||
      !formData.parent1Email.trim() ||
      !formData.parent1Address.trim()
    ) {
      setErrorMessage("Por favor complete todos los datos del Responsable Parental 1.");
      return false;
    }

    // 3. Responsable 2 (si no es único)
    if (!formData.isSingleParent) {
      if (
        !formData.parent2Name?.trim() ||
        !formData.parent2Dni?.trim() ||
        !formData.parent2Phone?.trim() ||
        !formData.parent2Email?.trim()
      ) {
        setErrorMessage("Por favor complete los datos del Responsable Parental 2 o marque la casilla de único responsable habilitado.");
        return false;
      }
    }

    // 4. Facturación
    if (!formData.billingName?.trim() || !formData.billingCuit?.trim() || !formData.billingEmail?.trim()) {
      setErrorMessage("Por favor complete los datos del responsable de facturación.");
      return false;
    }

    // 5. Contrato y declaraciones
    if (!contractAccepted || !dataAccepted || !termsAccepted) {
      setErrorMessage("Debe leer y aceptar todas las casillas de conformidad del Contrato Marco para poder continuar.");
      return false;
    }

    // 6. Firmas
    if (!formData.signature1Data) {
      setErrorMessage("La firma en pantalla del Responsable Parental 1 es obligatoria.");
      return false;
    }

    if (!formData.isSingleParent && !formData.signature2Data) {
      setErrorMessage("La firma en pantalla del Responsable Parental 2 es obligatoria (o marque la declaración de único responsable).");
      return false;
    }

    return true;
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsReviewModalOpen(true);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      ...formData,
      contractAccepted: true,
      dataAccepted: true,
      termsAccepted: true,
      signedAt: new Date().toISOString()
    };

    try {
      const res = await fetch("/api/enroll.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        setIsReviewModalOpen(false);
        setSuccessData({
          trackingNumber: result.trackingNumber || "FEE-2027-" + Math.floor(10000 + Math.random() * 90000)
        });
      } else {
        const fallbackRes = await submitEnrollment(payload);
        if (fallbackRes.success) {
          setIsReviewModalOpen(false);
          setSuccessData({
            trackingNumber: fallbackRes.trackingNumber || "FEE-2027-ONLINE"
          });
        } else {
          setErrorMessage(result.error || fallbackRes.error || "Error al registrar la reinscripción.");
          setIsReviewModalOpen(false);
        }
      }
    } catch {
      try {
        const fallbackRes = await submitEnrollment(payload);
        if (fallbackRes.success) {
          setIsReviewModalOpen(false);
          setSuccessData({ trackingNumber: "FEE-2027-LOCAL" });
          return;
        }
      } catch {}
      setErrorMessage("Ocurrió un problema de conexión al enviar el formulario. Por favor reintentá.");
      setIsReviewModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // VISTA DE ÉXITO Y DESCARGA INMEDIATA DEL CONTRATO FIRMADO
  if (successData) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-emerald-100 text-center max-w-2xl mx-auto my-8">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <span className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Trámite N.° {successData.trackingNumber}
        </span>

        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
          ¡Solicitud de Reinscripción Recibida!
        </h3>

        <div className="bg-slate-50 rounded-2xl p-6 text-left text-sm text-slate-700 space-y-3 mb-8 border border-slate-200/80">
          <p className="leading-relaxed">
            Su solicitud de reinscripción para el <strong>Ciclo Lectivo 2027</strong> fue recibida correctamente.
          </p>
          <p className="text-xs text-slate-500 italic border-l-2 border-amber-500 pl-3 py-0.5">
            La presentación del formulario no implica la confirmación automática de la vacante. La Fundación verificará el cumplimiento de los requisitos administrativos y arancelarios y comunicará posteriormente la confirmación de la reinscripción.
          </p>
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div><strong>Estudiante:</strong> {formData.studentName}</div>
            <div><strong>DNI:</strong> {formData.studentDni}</div>
            <div><strong>Escuela:</strong> {formData.school}</div>
            <div><strong>Curso 2027:</strong> {formData.studentGrade}</div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => downloadFilledContract({ ...formData, trackingNumber: successData.trackingNumber, signedAt: new Date().toISOString() })}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            Descargar mi Contrato Firmado (PDF Oficial)
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
              setContractAccepted(false);
              setDataAccepted(false);
              setTermsAccepted(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline block mx-auto pt-2"
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
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-5 text-sm text-blue-950 leading-relaxed space-y-2 shadow-xs">
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
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border border-red-200 text-sm shadow-xs animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. DATOS DEL/DE LA ESTUDIANTE */}
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

          {/* Hermanos en la institución */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              ¿Tiene hermanos/as que asisten a alguna de las escuelas de la Fundación? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="hasSiblings"
                  checked={formData.hasSiblings === true}
                  onChange={() => setFormData({ ...formData, hasSiblings: true })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                Sí
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="hasSiblings"
                  checked={formData.hasSiblings === false}
                  onChange={() => setFormData({ ...formData, hasSiblings: false, siblingDetails: "" })}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                No
              </label>
            </div>

            {formData.hasSiblings && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indique Nombre y Apellido, Escuela y Sala/Grado/Año 2027 del hermano/a <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.siblingDetails || ""}
                  onChange={e => setFormData({ ...formData, siblingDetails: e.target.value })}
                  placeholder="Ej: Juan Pérez - Esc. 1030 - 3° Grado"
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. RESPONSABLE PARENTAL 1 */}
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
                placeholder="DNI sin puntos"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              >
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor/a Legal">Tutor/a Legal</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono celular <span className="text-red-500">*</span>
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
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.parent1Email}
                onChange={e => setFormData({ ...formData, parent1Email: e.target.value })}
                placeholder="email@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domicilio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1Address}
                onChange={e => setFormData({ ...formData, parent1Address: e.target.value })}
                placeholder="Calle y N.°"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Localidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.parent1City}
                onChange={e => setFormData({ ...formData, parent1City: e.target.value })}
                placeholder="Ciudad"
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
                placeholder="CP (ej. 9200)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. RESPONSABLE PARENTAL 2 */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Responsable Parental 2</h3>
            </div>
          </div>

          {/* Declaración de único responsable */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isSingleParent || false}
                onChange={e => setFormData({ ...formData, isSingleParent: e.target.checked })}
                className="mt-0.5 w-5 h-5 text-amber-600 rounded-md focus:ring-amber-500 border-amber-300"
              />
              <div className="text-xs text-amber-950 font-medium leading-relaxed">
                <strong>Declaro ser el/la único/a responsable parental habilitado/a para formalizar la reinscripción.</strong>
                <p className="text-amber-800/80 mt-0.5">
                  Al marcar esta opción, los datos y la firma del segundo responsable no serán requeridos.
                </p>
              </div>
            </label>
          </div>

          {!formData.isSingleParent && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.parent2Name || ""}
                    onChange={e => setFormData({ ...formData, parent2Name: e.target.value })}
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
                    value={formData.parent2Dni || ""}
                    onChange={e => setFormData({ ...formData, parent2Dni: e.target.value })}
                    placeholder="DNI sin puntos"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  >
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Tutor/a Legal">Tutor/a Legal</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.parent2Phone || ""}
                    onChange={e => setFormData({ ...formData, parent2Phone: e.target.value })}
                    placeholder="Ej. +54 9 2945 123456"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.parent2Email || ""}
                    onChange={e => setFormData({ ...formData, parent2Email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domicilio</label>
                  <input
                    type="text"
                    value={formData.parent2Address || ""}
                    onChange={e => setFormData({ ...formData, parent2Address: e.target.value })}
                    placeholder="Calle y N.°"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Localidad</label>
                  <input
                    type="text"
                    value={formData.parent2City || "Esquel"}
                    onChange={e => setFormData({ ...formData, parent2City: e.target.value })}
                    placeholder="Ciudad"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={formData.parent2PostalCode || "9200"}
                    onChange={e => setFormData({ ...formData, parent2PostalCode: e.target.value })}
                    placeholder="CP"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 5. DATOS DE FACTURACIÓN */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Datos de Facturación</h3>
                <p className="text-xs text-slate-500">Designación del responsable a efectos de la facturación</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyParent1ToBilling}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar datos de Responsable 1
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido o Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billingName || ""}
                onChange={e => setFormData({ ...formData, billingName: e.target.value })}
                placeholder="Nombre para la factura"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CUIT / CUIL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billingCuit || ""}
                onChange={e => setFormData({ ...formData, billingCuit: e.target.value })}
                placeholder="Sin guiones"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condición Fiscal <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.billingTaxCondition || "Consumidor Final"}
                onChange={e => setFormData({ ...formData, billingTaxCondition: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              >
                <option value="Consumidor Final">Consumidor Final</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Exento">Exento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico para facturas <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.billingEmail || ""}
                onChange={e => setFormData({ ...formData, billingEmail: e.target.value })}
                placeholder="facturas@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domicilio de facturación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billingAddress || ""}
                onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="Calle, N.° y Ciudad"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-white"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. CONTRATO EDUCATIVO Y ACEPTACIONES */}
        {/* ======================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
              5
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Contrato Marco de Prestación de Servicios Educativos</h3>
              <p className="text-xs text-slate-500">Lectura, descarga de modelo y conformidad legal obligatoria</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Documento Oficial de la Fundación
                </span>
                <p className="text-xs text-slate-600">
                  Podés leer el texto completo de las 23 cláusulas en pantalla o descargar el modelo en formato PDF.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  Leer Contrato en Pantalla
                </button>
                <button
                  type="button"
                  onClick={() => downloadBlankContract()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Descargar Modelo en Blanco (PDF)
                </button>
              </div>
            </div>

            {/* Checkboxes de aceptación */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={contractAccepted}
                  onChange={e => setContractAccepted(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
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
                  className="mt-0.5 w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
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
                  className="mt-0.5 w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-800 leading-relaxed">
                  <strong>Autorizo el tratamiento de los datos proporcionados</strong> para la gestión educativa, administrativa, contractual y arancelaria de la reinscripción. <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. FIRMA DE LOS RESPONSABLES PARENTALES */}
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
                <span>Registro automático de fecha y hora</span>
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
                  <span>Registro automático de fecha y hora</span>
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
        {/* 8. BOTÓN DE REVISIÓN Y ENVÍO */}
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
      {/* MODAL DE LECTURA DEL CONTRATO COMPLETO */}
      {/* ======================================================== */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Descargar Modelo (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido Cláusulas */}
            <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-700 leading-relaxed space-y-5">
              <div className="text-center pb-4 border-b border-slate-100">
                <h5 className="font-bold text-sm text-slate-900">FUNDACIÓN EDUCATIVA ESQUEL</h5>
                <p className="text-slate-500">Chacabuco Nº 1029, Esquel, Chubut</p>
              </div>

              <div>
                <h6 className="font-bold text-slate-900 mb-1">DISPOSICIONES PRELIMINARES</h6>
                <p><strong>Cláusula 1° – Naturaleza del contrato:</strong> El presente constituye un contrato marco de prestación de servicios educativos celebrado entre LA FUNDACIÓN y LOS RESPONSABLES PARENTALES del/de la alumno/a, destinado a regular el vínculo educativo mientras subsista la permanencia del/de la alumno/a en cualquiera de los establecimientos dependientes de LA FUNDACIÓN...</p>
                <p className="mt-2"><strong>Cláusula 2° – Documentación complementaria:</strong> Forman parte integrante del presente contrato los siguientes documentos institucionales: Acuerdo Escolar de Convivencia, Proyecto Educativo Institucional y Planilla de datos administrativos y facturación...</p>
              </div>

              <div>
                <h6 className="font-bold text-slate-900 mb-1">CAPÍTULO I: ASPECTOS INSTITUCIONALES</h6>
                <p><strong>Cláusula 3° – Servicio educativo y marco institucional:</strong> LA FUNDACIÓN se compromete a brindar el servicio educativo conforme a la normativa oficial vigente y planes del Ministerio de Educación de Chubut...</p>
                <p className="mt-2"><strong>Cláusula 4° – Reserva de vacante:</strong> A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones, LA FUNDACIÓN reserva una vacante para el/la alumno/a para el ciclo lectivo 2027...</p>
                <p className="mt-2"><strong>Cláusula 5° – Adhesión al proyecto institucional:</strong> Declaración de adhesión al PEI y Acuerdo de Convivencia...</p>
                <p className="mt-2"><strong>Cláusula 6° – Reinscripción y prestación del servicio educativo.</strong></p>
                <p className="mt-2"><strong>Cláusula 7° – Uso institucional de imágenes.</strong></p>
                <p className="mt-2"><strong>Cláusula 8° – Firma y validez contractual:</strong> Validez plena de suscripción electrónica e integridad del documento.</p>
              </div>

              <div>
                <h6 className="font-bold text-slate-900 mb-1">CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS</h6>
                <p><strong>Cláusula 9° – Aranceles y modalidades de pago:</strong> Costo anual en 11 cuotas mensuales (febrero a diciembre) con vencimiento del 1 al 10 de cada mes...</p>
                <p className="mt-2"><strong>Cláusula 10° – Beneficios de terceros y medios de pago.</strong></p>
                <p className="mt-2"><strong>Cláusula 11° – Descuentos y beneficios arancelarios:</strong> 15% para 2 hijos/as, 25% para 3 o más hijos/as sobre cuota de menor valor...</p>
                <p className="mt-2"><strong>Cláusula 12° – Libre deuda y condición de matrícula:</strong> Condición indispensable para la reserva definitiva no registrar deuda exigible.</p>
                <p className="mt-2"><strong>Cláusula 13° – Reembolsos.</strong></p>
                <p className="mt-2"><strong>Cláusula 14° – Valor de matrícula y formas de pago:</strong> 1,4 veces cuota agosto para alumnos regulares; 1,8 para nuevos ingresantes.</p>
                <p className="mt-2"><strong>Cláusula 15° – Plazos administrativos.</strong></p>
                <p className="mt-2"><strong>Cláusula 16° – Actualización de valores:</strong> Marzo, Junio y Octubre.</p>
                <p className="mt-2"><strong>Cláusula 17° – Becas.</strong></p>
                <p className="mt-2"><strong>Cláusula 18° – Mora y gestión de cobranza.</strong></p>
                <p className="mt-2"><strong>Cláusula 19° – Responsabilidad de pago:</strong> Responsabilidad solidaria de los responsables parentales.</p>
              </div>

              <div>
                <h6 className="font-bold text-slate-900 mb-1">CAPÍTULO III: ASPECTOS ACADÉMICOS, FORMATIVOS Y DE CONVIVENCIA</h6>
                <p><strong>Cláusula 20° – Participación familiar.</strong></p>
                <p className="mt-2"><strong>Cláusula 21° – Actividades institucionales.</strong></p>
                <p className="mt-2"><strong>Cláusula 22° – Equipos técnicos interdisciplinarios.</strong></p>
                <p className="mt-2"><strong>Cláusula 23° – Uso responsable de redes sociales.</strong></p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setContractAccepted(true);
                  setIsContractModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
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
                    <div className="col-span-2 text-slate-600"><strong>Hermanos:</strong> {formData.siblingDetails}</div>
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
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
              >
                Volver a editar
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
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
