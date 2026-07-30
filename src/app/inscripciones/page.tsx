import type { Metadata } from "next";
import { EnrollmentForm } from "./form";
import { getAdmissionYear } from "@/lib/dateUtils";
import { CAMPUSES, ORG } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const year = getAdmissionYear();
  return {
    title: `Preinscripción ${year}`,
    description: `Formulario de preinscripción al ciclo lectivo ${year} en la ${ORG.legalName}: Nivel Inicial, Primario y Secundario en ${ORG.city}.`,
    alternates: { canonical: "/inscripciones" },
  };
}

/**
 * Los pasos son una secuencia real, así que la numeración informa algo: el
 * orden en que ocurren. El número vivía dos veces en cada tarjeta —en el
 * círculo y otra vez al principio del título—, de modo que en pantalla se leía
 * "1 1. Registro de solicitud".
 */
const STEPS = [
  {
    title: "Registro de la solicitud",
    description:
      "Completás el formulario en línea con los datos de la familia y del aspirante. Se recibe durante todo el año.",
    badge: "bg-brand-green text-white",
  },
  {
    title: "Entrevista institucional",
    description:
      "Un encuentro para compartir el Proyecto Educativo Institucional (PEI) y conocernos mutuamente.",
    badge: "bg-brand-yellow text-brand-blue",
  },
  {
    title: "Confirmación de vacantes",
    description:
      "El proceso principal comienza en septiembre y la confirmación oficial se comunica en octubre.",
    badge: "bg-brand-blue text-white",
  },
];

export default function InscripcionesPage() {
  const year = getAdmissionYear();

  return (
    <div className="bg-background pb-24">
      <section className="relative bg-brand-green pb-20 pt-32 text-white">
        <div className="container relative z-10 mx-auto px-6 text-center lg:px-12">
          <p className="mb-4 block text-sm font-bold uppercase tracking-widest text-brand-yellow-light">
            Ciclo lectivo {year}
          </p>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Solicitud de preinscripción
          </h1>
          <p className="mx-auto max-w-3xl text-lg font-medium leading-relaxed opacity-90 md:text-xl">
            La preinscripción se recibe durante todo el año y registra el interés de tu familia ante
            una eventual vacante en Nivel Inicial, Primario o Secundario. No garantiza el ingreso:
            es el primer paso del proceso.
          </p>
        </div>
      </section>

      <section className="border-b border-brand-gray/10 bg-white py-12">
        <div className="container mx-auto max-w-5xl px-6 lg:px-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-blue">
            Cómo sigue después de enviar el formulario
          </h2>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-brand-gray/10 bg-brand-gray/5 p-6"
              >
                <span
                  className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step.badge}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="mb-2 text-lg font-bold text-brand-blue">{step.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/75">{step.description}</p>
              </li>
            ))}
          </ol>

          <p className="mt-8 text-center text-sm text-foreground/70">
            Ante cualquier duda podés escribir a{" "}
            {CAMPUSES.map((campus, index) => (
              <span key={campus.id}>
                {index > 0 && " o "}
                <a
                  href={`mailto:${campus.email}`}
                  className="font-semibold text-brand-green hover:underline"
                >
                  {campus.email}
                </a>{" "}
                <span className="text-foreground/70">({campus.levels})</span>
              </span>
            ))}
            .
          </p>
        </div>
      </section>

      <section className="relative z-20 py-16">
        <div className="container mx-auto max-w-4xl px-6 lg:px-12">
          <div className="rounded-[2rem] border border-brand-gray/10 bg-white p-8 shadow-2xl md:p-12">
            <h2 className="mb-2 border-b border-brand-gray/15 pb-4 text-3xl font-bold text-brand-blue">
              Formulario de preinscripción {year}
            </h2>
            <p className="mb-8 text-sm text-foreground/70">
              Los datos se tratan con estricta confidencialidad y se usan únicamente para gestionar
              la admisión.
            </p>
            <EnrollmentForm />
          </div>
        </div>
      </section>
    </div>
  );
}
