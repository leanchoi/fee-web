import { Metadata } from "next";
import { EnrollmentForm } from "./form";
import { getAdmissionYear } from "@/lib/dateUtils";

export async function generateMetadata(): Promise<Metadata> {
  const year = getAdmissionYear();
  return {
    title: `Inscripciones ${year} | Fundación Educativa Esquel`,
    description: `Formulario de admisión para el ciclo lectivo ${year}.`,
  };
}

export default function InscripcionesPage() {
  const year = getAdmissionYear();
  
  return (
    <div className="bg-background pb-24">
      {/* Header */}
      <section className="pt-32 pb-20 bg-brand-green text-white relative">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="text-brand-yellow font-bold uppercase tracking-widest text-sm mb-4 block">
            Ingreso Lectivo {year}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Solicitud de Preinscripción
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 leading-relaxed font-medium">
            La preinscripción puede realizarse durante todo el año para registrar el interés de su familia ante una eventual vacante en Nivel Inicial, Primario o Secundario.
          </p>
        </div>
      </section>

      {/* Process Stages Information */}
      <section className="py-12 bg-white border-b border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <h2 className="text-2xl font-bold text-brand-blue mb-6 text-center">
            Etapas del Proceso de Inscripción
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-gray/5 p-6 rounded-2xl border border-brand-gray/10 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-brand-green text-white font-bold flex items-center justify-center text-sm mb-3">1</span>
                <h3 className="font-bold text-brand-blue text-lg mb-2">1. Registro de Solicitud</h3>
                <p className="text-sm text-brand-foreground/75 leading-relaxed">
                  Completen el formulario en línea con los datos de la familia y el aspirante. Se recepta durante todo el año.
                </p>
              </div>
            </div>

            <div className="bg-brand-gray/5 p-6 rounded-2xl border border-brand-gray/10 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-blue font-bold flex items-center justify-center text-sm mb-3">2</span>
                <h3 className="font-bold text-brand-blue text-lg mb-2">2. Entrevista Institucional</h3>
                <p className="text-sm text-brand-foreground/75 leading-relaxed">
                  Espacio de encuentro pedagógico para compartir el Proyecto Educativo Institucional (PEI) y conocer el perfil de la escuela.
                </p>
              </div>
            </div>

            <div className="bg-brand-gray/5 p-6 rounded-2xl border border-brand-gray/10 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-sm mb-3">3</span>
                <h3 className="font-bold text-brand-blue text-lg mb-2">3. Confirmación de Vacantes</h3>
                <p className="text-sm text-brand-foreground/75 leading-relaxed">
                  El proceso principal se inicia en <strong>Septiembre</strong> y la confirmación oficial de vacantes se comunica en <strong>Octubre</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Container */}
      <section className="py-16 relative z-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-brand-gray/10">
            <h2 className="text-3xl font-bold text-brand-blue mb-2 border-b pb-4">
              Formulario de Preinscripción ({year})
            </h2>
            <p className="text-sm text-brand-foreground/70 mb-8">
              Por favor ingrese la información solicitada. Los datos enviados se tratarán con estricta confidencialidad institucional.
            </p>
            <EnrollmentForm />
          </div>
        </div>
      </section>

    </div>
  );
}
