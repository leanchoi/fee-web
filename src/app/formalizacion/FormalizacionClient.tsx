"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileCheck2, 
  ShieldCheck, 
  Download, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  School, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Sparkles,
  Lock
} from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { downloadFilledContract, EnrollmentContractData, determineLevel, determineSchool } from "@/lib/contractGenerator";

export function FormalizacionClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Formulario de formalización
  const [contractAccepted, setContractAccepted] = useState(false);
  const [dataAccepted, setDataAccepted] = useState(false);
  const [signature1Data, setSignature1Data] = useState<string | null>(null);
  const [signature2Data, setSignature2Data] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No se ha proporcionado un token de formalización válido. Por favor utilizá el enlace recibido en tu correo electrónico.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/formalizacion.php?action=verify&token=${encodeURIComponent(token)}`, {
          cache: "no-store"
        });
        const json = await res.json();

        if (res.ok && json.success) {
          setEnrollment(json.enrollment);
          setAlreadySigned(json.alreadySigned);
          setIsExpired(json.isExpired);
          if (json.alreadySigned && json.enrollment.formalizationSignedAt) {
            setSignedDate(json.enrollment.formalizationSignedAt);
          }
        } else {
          setError(json.error || "El enlace no es válido o ha expirado.");
        }
      } catch (err: any) {
        setError("Error de conexión al verificar el enlace: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleDownloadPdf = () => {
    if (!enrollment) return;

    const contractData: EnrollmentContractData = {
      id: enrollment.id,
      trackingNumber: enrollment.trackingNumber,
      createdAt: signedDate || enrollment.formalizationSignedAt || new Date().toISOString(),
      signedAt: signedDate || enrollment.formalizationSignedAt || new Date().toISOString(),
      studentName: enrollment.studentName,
      studentDni: enrollment.studentDni,
      studentLevel: enrollment.studentLevel,
      school: enrollment.school || determineSchool(enrollment.studentLevel),
      studentGrade: enrollment.studentGrade,
      parent1Name: enrollment.parent1Name,
      parent1Dni: enrollment.parent1Dni,
      parent1Relationship: enrollment.parent1Relationship || "Madre/Padre",
      parent1Phone: enrollment.parent1Phone,
      parent1Email: enrollment.parent1Email,
      parent1Address: enrollment.parent1Address,
      parent1City: enrollment.parent1City || "Esquel",
      parent1PostalCode: enrollment.parent1PostalCode || "9200",
      isSingleParent: enrollment.isSingleParent,
      parent2Name: enrollment.parent2Name,
      parent2Dni: enrollment.parent2Dni,
      parent2Relationship: enrollment.parent2Relationship || "Padre/Madre",
      parent2Phone: enrollment.parent2Phone,
      parent2Email: enrollment.parent2Email,
      billingName: enrollment.billingName || enrollment.parent1Name,
      billingCuit: enrollment.billingCuit || enrollment.parent1Dni,
      billingTaxCondition: enrollment.billingTaxCondition || "Consumidor Final",
      billingEmail: enrollment.billingEmail || enrollment.parent1Email,
      billingAddress: enrollment.billingAddress || enrollment.parent1Address,
      signature1Data: signature1Data || null,
      signature2Data: signature2Data || null,
    };

    downloadFilledContract(contractData);
  };

  const handleSubmitFormalizacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractAccepted || !dataAccepted) {
      alert("Por favor aceptá los términos del contrato y la declaración jurada.");
      return;
    }

    if (!signature1Data) {
      alert("Es obligatoria la firma del responsable titular para formalizar la matrícula.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/formalizacion.php?action=sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          signature1Data: signature1Data,
          signature2Data: signature2Data,
          contractAccepted: true,
          termsAccepted: true,
          billingName: enrollment.billingName,
          billingCuit: enrollment.billingCuit,
          billingTaxCondition: enrollment.billingTaxCondition,
          billingEmail: enrollment.billingEmail,
          billingAddress: enrollment.billingAddress,
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmissionSuccess(true);
        setAlreadySigned(true);
        setSignedDate(json.signedAt || new Date().toISOString());

        // Descargar automáticamente el contrato en PDF
        setTimeout(() => {
          handleDownloadPdf();
        }, 800);
      } else {
        alert(json.error || "No se pudo registrar la formalización. Por favor intente nuevamente.");
      }
    } catch (err: any) {
      alert("Error de conexión: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-sm font-bold uppercase tracking-wider text-slate-700">Validando enlace de formalización...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-xl text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Enlace No Válido</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{error}</p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left">
          <strong>¿Necesitás asistencia?</strong> Podés comunicarte con la Secretaría Administrativa de la Fundación Educativa Esquel a <a href="mailto:administracion@fundacionesquel.edu.ar" className="text-brand-blue font-bold underline">administracion@fundacionesquel.edu.ar</a>.
        </div>
      </div>
    );
  }

  if (isExpired && !alreadySigned) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-amber-200 rounded-3xl shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Plazo de Formalización Vencido</h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          El plazo establecido de 7 días corridos para la formalización digital de la vacante ha expirado. Por favor comunicate a la brevedad con la administración para consultar la disponibilidad en el aula.
        </p>
      </div>
    );
  }

  // Estado de trámite ya firmado previamente o recién completado
  if (alreadySigned || submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border-2 border-emerald-500 rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full mb-2">
          Matrícula Oficializada
        </span>
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Matrícula 2027 Confirmada!</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          La formalización de vacante para <strong>{enrollment.studentName}</strong> en <strong>{enrollment.studentGrade}</strong> ({enrollment.school}) ha sido registrada correctamente en el sistema institucional.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-2 text-xs text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">N° de Trámite:</span>
            <strong className="font-mono">{enrollment.trackingNumber}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estudiante:</span>
            <strong>{enrollment.studentName} (DNI {enrollment.studentDni})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Curso / Aula Asignada:</span>
            <strong>{enrollment.studentGrade} · {enrollment.school}</strong>
          </div>
          {signedDate && (
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha de Formalización:</span>
              <strong>{new Date(signedDate).toLocaleString("es-AR")}</strong>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Download className="w-5 h-5" />
          <span>Descargar Contrato Oficial Firmado (PDF)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
      {/* Banner Superior */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          Vacante Aprobada · Ciclo Lectivo 2027
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Formalización de Matrícula</h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2">
          Revisión de datos y firma digital del Contrato de Servicios Educativos para las Escuelas N.º 1030 y N.º 1739.
        </p>
      </div>

      <form onSubmit={handleSubmitFormalizacion} className="p-6 sm:p-8 space-y-8">
        {/* Ficha Resumen del Alumno */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-blue" />
            Datos del Estudiante y Aula Asignada
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Estudiante:</span>
              <strong className="text-slate-900 text-sm">{enrollment.studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">DNI:</span>
              <strong className="text-slate-900 font-mono text-sm">{enrollment.studentDni}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Curso Solicitado:</span>
              <strong className="text-slate-900 text-sm">{enrollment.studentGrade}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Institución:</span>
              <strong className="text-slate-900 text-sm">{enrollment.school} ({enrollment.studentLevel})</strong>
            </div>
          </div>
        </div>

        {/* Ficha Responsables Parentales */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Responsables Parentales / Tutores Legales
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Responsable Titular:</span>
              <strong className="text-slate-900">{enrollment.parent1Name} (DNI {enrollment.parent1Dni})</strong>
              <span className="text-slate-500 block text-[11px] mt-0.5">{enrollment.parent1Relationship} · Tel: {enrollment.parent1Phone}</span>
            </div>
            {!enrollment.isSingleParent && enrollment.parent2Name ? (
              <div>
                <span className="text-slate-500 block">Segundo Responsable:</span>
                <strong className="text-slate-900">{enrollment.parent2Name} (DNI {enrollment.parent2Dni || "---"})</strong>
                <span className="text-slate-500 block text-[11px] mt-0.5">{enrollment.parent2Relationship} · Tel: {enrollment.parent2Phone || "---"}</span>
              </div>
            ) : (
              <div>
                <span className="text-slate-500 block">Régimen Parental:</span>
                <span className="italic text-slate-600">Único responsable parental declarado.</span>
              </div>
            )}
          </div>
        </div>

        {/* Contrato en Pantalla */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-slate-900 text-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contrato de Prestación de Servicios Educativos (Ciclo Lectivo 2027)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{enrollment.school}</span>
          </div>

          <div className="max-h-60 overflow-y-auto text-xs leading-relaxed text-slate-300 space-y-3 pr-2 scrollbar-thin">
            <p>
              Entre la <strong>Fundación Educativa Esquel</strong>, entidad propietaria de la Escuela N.º 1030 y Escuela N.º 1739, con domicilio legal en Esquel, Provincia del Chubut, en adelante &quot;LA ESCUELA&quot;, y los señores <strong>{enrollment.parent1Name}</strong> y demás responsables parentales, en adelante &quot;LOS RESPONSABLES&quot;, se conviene en celebrar el presente Contrato de Enseñanza:
            </p>
            <p>
              <strong>PRIMERA (Objeto):</strong> LA ESCUELA acepta como alumno/a regular para el Ciclo Lectivo 2027 a <strong>{enrollment.studentName}</strong> para cursar <strong>{enrollment.studentGrade}</strong>, comprometiéndose a impartir la enseñanza de conformidad con los planes de estudio oficiales aprobados y su proyecto pedagógico e institucional bilingüe.
            </p>
            <p>
              <strong>SEGUNDA (Aranceles y Matrícula):</strong> LOS RESPONSABLES se comprometen a abonar en término la matrícula de inscripción correspondiente y las cuotas arancelarias periódicas fijadas por el Consejo de Administración de la Fundación Educativa Esquel para el ciclo lectivo en curso.
            </p>
            <p>
              <strong>TERCERA (Normas de Convivencia):</strong> LOS RESPONSABLES y el/la estudiante declaran conocer y aceptar el Reglamento Interno y el Acuerdo Escolar de Convivencia institucional de la Fundación Educativa Esquel.
            </p>
          </div>
        </div>

        {/* Cláusulas de Aceptación */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={contractAccepted}
              onChange={e => setContractAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-normal">
              He leído y acepto íntegramente las condiciones y cláusulas del <strong>Contrato de Servicios Educativos 2027</strong>.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={dataAccepted}
              onChange={e => setDataAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
            />
            <span className="text-xs text-slate-700 leading-normal">
              Declaro bajo juramento la veracidad y vigencia de la totalidad de los datos declarados.
            </span>
          </label>
        </div>

        {/* Lienzo de Firma Digital */}
        <div className="space-y-6 pt-2 border-t border-slate-200">
          <div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Firma Digital del Responsable Titular ({enrollment.parent1Name})
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Dibujá tu firma en el recuadro con el dedo (en celular/tablet) o con el mouse:
            </p>
            <SignatureCanvas
              onSave={(dataUrl) => setSignature1Data(dataUrl)}
              label={`Firma Responsable 1 - ${enrollment.parent1Name}`}
            />
          </div>

          {!enrollment.isSingleParent && enrollment.parent2Name && (
            <div>
              <h3 className="text-sm font-black text-slate-900 mb-1">
                Firma Digital del Segundo Responsable ({enrollment.parent2Name}) <span className="text-xs font-normal text-slate-500">(Opcional)</span>
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Si está presente, puede firmar a continuación:
              </p>
              <SignatureCanvas
                onSave={(dataUrl) => setSignature2Data(dataUrl)}
                label={`Firma Responsable 2 - ${enrollment.parent2Name}`}
              />
            </div>
          )}
        </div>

        {/* Botón de Envío */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Firma digital encriptada con validez reglamentaria.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !contractAccepted || !dataAccepted || !signature1Data}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando Matrícula...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-5 h-5" />
                <span>Confirmar y Formalizar Matrícula</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
