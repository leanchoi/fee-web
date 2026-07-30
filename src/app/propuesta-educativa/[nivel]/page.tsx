import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdmissionYear } from "@/lib/dateUtils";
import { CAMPUSES, MAIN_CAMPUS } from "@/lib/site";

const docentePerfilStandard =
  "Nuestros equipos docentes enseñan desde propuestas pedagógicas contextualizadas y significativas, adaptando sus estrategias a la diversidad de trayectorias escolares. Acompañan de manera personalizada los procesos de aprendizaje, respetando los tiempos y necesidades de cada estudiante, y promueven vínculos basados en el respeto, la confianza y los valores institucionales. Sostienen una comunicación permanente con las familias y trabajan junto al Equipo de Orientación Escolar (EOE).";

/**
 * El contenido se modela como texto introductorio + lista.
 *
 * Antes las viñetas iban dentro de un único string con `•` y saltos de línea,
 * renderizado con `whitespace-pre-line`: visualmente parecía una lista pero
 * para un lector de pantalla era un párrafo corrido, sin cantidad de ítems ni
 * posibilidad de navegar entre ellos.
 */
interface SectionItem {
  /** Título en negrita del ítem, cuando la viñeta lo lleva. */
  term?: string;
  description: string;
}

interface Section {
  heading: string;
  text?: string;
  items?: SectionItem[];
}

interface NivelData {
  /** Texto del selector de niveles. */
  label: string;
  /** Sede donde funciona el nivel; se cruza con CAMPUSES. */
  campusId: string;
  title: string;
  subtitle: string;
  color: "brand-yellow" | "brand-green" | "brand-blue";
  content: Section[];
}

type NivelKey = "inicial" | "primario" | "secundario";

const proyectosInstitucionales: SectionItem[] = [
  {
    term: "Acuerdos Escolares de Convivencia (AEC)",
    description:
      "Herramienta central para la educación en valores, el fortalecimiento de los vínculos pedagógicos y la construcción de una convivencia democrática.",
  },
  {
    term: "Mejora institucional continua",
    description:
      "Capacitación permanente del equipo docente, proyectos pedagógicos innovadores y actualización en línea con el Diseño Curricular Provincial y la normativa vigente.",
  },
];

const nivelesData: Record<NivelKey, NivelData> = {
  inicial: {
    label: "Nivel Inicial",
    campusId: "1030",
    title: "Nivel Inicial",
    subtitle:
      "Salas de 3, 4 y 5 años. Aprendizaje significativo basado en el juego, la exploración y la contención afectiva.",
    color: "brand-yellow",
    content: [
      {
        heading: "El juego y el aprender haciendo",
        text: "El juego es el motor del aprendizaje: potencia la creatividad, la imaginación, la autonomía y la comprensión del mundo, en un marco de contención y respeto por los tiempos de cada niño y niña.",
      },
      { heading: "Proyectos institucionales y convivencia", items: proyectosInstitucionales },
      {
        heading: "Perfil del egresado",
        text: "Formamos niños y niñas sociables, curiosos, solidarios y seguros de sí mismos. Al finalizar el nivel:",
        items: [
          { description: "Se expresan con claridad en lenguaje verbal, plástico, corporal y sonoro." },
          { description: "Desarrollan hábitos de autonomía, cooperación y cuidado ambiental." },
          { description: "Comprenden y respetan normas simples de convivencia democrática." },
          {
            description:
              "Se inician de forma natural en la lectura, la matemática y la experiencia del inglés.",
          },
        ],
      },
      { heading: "Perfil docente", text: docentePerfilStandard },
    ],
  },
  primario: {
    label: "Nivel Primario",
    campusId: "1030",
    title: "Nivel Primario",
    subtitle:
      "Excelencia académica con enfoque en valores, educación personalizada e inglés intensivo.",
    color: "brand-green",
    content: [
      {
        heading: "Propuesta pedagógica y vínculo educativo",
        text: "Entendemos que cada estudiante recorre una trayectoria escolar única. Fomentamos el aprendizaje contextualizado y el pensamiento crítico, integrando la tecnología como herramienta pedagógica y estimulando la curiosidad científica y humanística.",
      },
      { heading: "Proyectos institucionales y convivencia", items: proyectosInstitucionales },
      {
        heading: "Perfil del egresado",
        text: "El egresado del Nivel Primario es autónomo, reflexivo y comprometido con su comunidad:",
        items: [
          {
            description:
              "Maneja competencias lingüísticas avanzadas en español y consolidadas en inglés.",
          },
          {
            description:
              "Aplica el pensamiento matemático y científico a la resolución de problemas cotidianos.",
          },
          {
            description:
              "Practica la empatía, el trabajo en equipo y la resolución pacífica de conflictos según los AEC.",
          },
          { description: "Hace un uso responsable de la tecnología y cuida el medio ambiente." },
        ],
      },
      { heading: "Perfil docente", text: docentePerfilStandard },
    ],
  },
  secundario: {
    label: "Nivel Secundario",
    campusId: "1739",
    title: "Nivel Secundario",
    subtitle:
      "Orientación en Ciencias Naturales, formación ciudadana, pensamiento crítico y preparación para estudios superiores.",
    color: "brand-blue",
    content: [
      {
        heading: "Propuesta educativa institucional",
        text: "Ofrecemos un Ciclo Básico Común y un Ciclo Orientado en Ciencias Naturales. La formación se caracteriza por la cultura del diálogo, el rigor académico, el acompañamiento en la diversidad y la articulación con los estudios superiores y el mundo del trabajo.",
      },
      { heading: "Proyectos institucionales y convivencia", items: proyectosInstitucionales },
      {
        heading: "Perfil del egresado",
        text: "Egresados capaces de conducir su proyecto de vida con autonomía y responsabilidad ética:",
        items: [
          {
            description:
              "Ejercen el pensamiento crítico, con dominio tecnológico y sólida base científica.",
          },
          {
            description:
              "Demuestran alta competencia en inglés para ámbitos académicos e internacionales.",
          },
          {
            description:
              "Asumen un compromiso con la inclusión, la ciudadanía democrática y el desarrollo sustentable de la Patagonia.",
          },
        ],
      },
      { heading: "Perfil docente y trabajo colaborativo", text: docentePerfilStandard },
    ],
  },
};

type Params = { nivel: string };

const NIVEL_ORDER: NivelKey[] = ["inicial", "primario", "secundario"];

const HEADER_CLASSES: Record<string, string> = {
  "brand-yellow": "bg-brand-yellow text-brand-blue",
  "brand-green": "bg-brand-green text-white",
  "brand-blue": "bg-brand-blue text-white",
};

const CTA_CLASSES: Record<string, string> = {
  "brand-yellow": "bg-brand-yellow text-brand-blue hover:bg-brand-yellow-dark hover:text-white",
  "brand-green": "bg-brand-green text-white hover:bg-brand-blue",
  "brand-blue": "bg-brand-blue text-white hover:bg-brand-green",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { nivel } = await params;
  const data = nivelesData[nivel as NivelKey];

  if (!data) return { title: "Nivel no encontrado" };

  return {
    title: data.title,
    description: data.subtitle,
    alternates: { canonical: `/propuesta-educativa/${nivel}` },
  };
}

export function generateStaticParams() {
  return NIVEL_ORDER.map((nivel) => ({ nivel }));
}

export default async function NivelPage({ params }: { params: Promise<Params> }) {
  const { nivel } = await params;
  const data = nivelesData[nivel as NivelKey];

  if (!data) notFound();

  const campus = CAMPUSES.find((item) => item.id === data.campusId) ?? MAIN_CAMPUS;
  const admissionYear = getAdmissionYear();

  return (
    <div className="bg-background pb-24">
      <section className={cn("pb-20 pt-32", HEADER_CLASSES[data.color])}>
        <div className="container relative z-10 mx-auto px-6 lg:px-12">
          <p className="mb-4 block text-sm font-bold uppercase tracking-widest opacity-80">
            Propuesta educativa
          </p>
          <h1 className="mb-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            {data.title}
          </h1>
          <p className="mb-6 text-sm font-semibold uppercase tracking-wide opacity-75">
            {campus.name} · {campus.street}
          </p>
          <p className="max-w-2xl text-xl leading-relaxed opacity-90">{data.subtitle}</p>
        </div>
      </section>

      {/* Cambio de nivel.
          Sin esto había que volver a la home o al pie para pasar de Inicial a
          Primario, cuando comparar los tres niveles es justamente lo que hace
          una familia que está eligiendo escuela. */}
      <nav
        aria-label="Niveles educativos"
        className="sticky top-[68px] z-30 border-b border-brand-gray/15 bg-white/95 backdrop-blur-md"
      >
        <div className="container mx-auto flex gap-2 overflow-x-auto px-6 py-3 lg:px-12">
          {NIVEL_ORDER.map((key) => {
            const item = nivelesData[key];
            const active = key === nivel;
            return (
              <Link
                key={key}
                href={`/propuesta-educativa/${key}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-brand-blue text-white"
                    : "text-brand-blue hover:bg-brand-gray/10"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 items-start gap-8 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
          <div className="flex flex-col gap-12">
            {data.content.map((block) => (
              <div key={block.heading} className="group">
                <div
                  className="mb-6 h-1 w-12 bg-brand-green opacity-30 transition-all duration-300 group-hover:w-24"
                  aria-hidden="true"
                />
                <h2 className="mb-4 text-2xl font-bold text-brand-blue md:text-3xl">
                  {block.heading}
                </h2>
                {block.text && (
                  <p className="text-lg leading-relaxed text-foreground/80">{block.text}</p>
                )}
                {block.items && (
                  <ul className="mt-4 space-y-3">
                    {block.items.map((item) => (
                      <li key={item.description} className="flex items-start gap-3">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                          aria-hidden="true"
                        />
                        <span className="leading-relaxed text-foreground/80">
                          {item.term && (
                            <strong className="text-brand-blue">{item.term}: </strong>
                          )}
                          {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <aside className="flex flex-col gap-8 lg:sticky lg:top-32">
            <div className="rounded-[2rem] border border-brand-gray/10 bg-white p-8 shadow-xl md:p-10">
              <h2 className="mb-4 text-2xl font-bold text-brand-blue">
                Vacantes {admissionYear}
              </h2>
              <p className="mb-8 text-foreground/75">
                La preinscripción para {data.label} se recibe durante todo el año. Registrá el
                interés de tu familia y el equipo de admisiones se comunicará con vos.
              </p>
              {/* Era un `<a>`: forzaba una recarga completa dentro de la misma
                  aplicación. */}
              <Link
                href="/inscripciones"
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-center font-bold shadow-md transition-all hover:-translate-y-1",
                  CTA_CLASSES[data.color]
                )}
              >
                Completar preinscripción
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-brand-gray/10 bg-brand-gray/5 p-8 md:p-10">
              <p className="mb-3 block text-sm font-bold uppercase tracking-wider text-brand-lightblue-dark">
                Contacto directo
              </p>
              <p className="mb-4 font-bold text-brand-blue">{campus.name}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                  <a
                    href={`mailto:${campus.email}`}
                    className="break-all text-brand-green hover:underline"
                  >
                    {campus.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                  <a
                    href={`tel:${campus.phoneHref}`}
                    className="text-brand-green hover:underline"
                  >
                    {campus.phone}
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
