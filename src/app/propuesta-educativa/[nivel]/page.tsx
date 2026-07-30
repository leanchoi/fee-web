import { notFound } from "next/navigation";
import { Metadata } from "next";

const docentePerfilStandard = `Nuestros equipos docentes enseñan desde propuestas pedagógicas contextualizadas y significativas, adaptando sus estrategias a la diversidad de trayectorias escolares. Acompañan de manera personalizada los procesos de aprendizaje, respetando los tiempos y necesidades de cada estudiante, y promueven vínculos basados en el respeto, la confianza y los valores institucionales. Sostienen una comunicación permanente con las familias y trabajan colaborativamente con el Equipo de Orientación Escolar (EOE).`;

const proyectosInstitucionalesStandard = `• Acuerdos Escolares de Convivencia (AEC): Herramienta fundamental para promover la educación en valores, el fortalecimiento de los vínculos pedagógicos y la construcción de una convivencia democrática.\n• Mejora Institucional Continua: Capacitaciones permanentes del equipo docente, proyectos pedagógicos innovadores y actualización continua en línea con el Diseño Curricular Provincial y la normativa vigente.`;

const nivelesData = {
  inicial: {
    title: "Nivel Inicial (Escuela N° 1030)",
    subtitle: "Salas de 3, 4 y 5 años. Aprendizaje significativo basado en el juego, la exploración y la contención afectiva.",
    color: "brand-yellow",
    content: [
      {
        heading: "Eje central: el juego y el aprender haciendo",
        text: "El juego es el motor del aprendizaje: potencia la creatividad, la imaginación, la autonomía y la comprensión del mundo en un marco de contención y respeto por los tiempos de cada niño y niña.",
      },
      {
        heading: "Proyectos Institucionales y Convivencia",
        text: proyectosInstitucionalesStandard,
      },
      {
        heading: "Perfil del Egresado",
        text: "Formamos niños y niñas sociables, curiosos, solidarios y seguros de sí mismos. Al finalizar el nivel:\n• Se expresan con claridad a través del lenguaje verbal, plástico, corporal y sonoro.\n• Desarrollan hábitos de autonomía, cooperación y cuidado ambiental.\n• Comprenden y respetan normas simples de convivencia democrática.\n• Se inician de forma natural en la lectura, la matemática y la experiencia del inglés.",
      },
      {
        heading: "Perfil Docente Profesional",
        text: docentePerfilStandard,
      },
    ],
  },
  primario: {
    title: "Nivel Primario (Escuela N° 1030)",
    subtitle: "Excelencia académica con enfoque en valores, educación personalizada e inglés intensivo.",
    color: "brand-green",
    content: [
      {
        heading: "Propuesta Pedagógica y Vínculo Educativo",
        text: "En el Nivel Primario entendemos que cada estudiante recorre una trayectoria escolar única. Fomentamos el aprendizaje contextualizado y el desarrollo del pensamiento crítico, integrando la tecnología como herramienta pedagógica y estimulando la curiosidad científica y humanística.",
      },
      {
        heading: "Proyectos Institucionales y Convivencia",
        text: proyectosInstitucionalesStandard,
      },
      {
        heading: "Perfil del Estudiante Egresado",
        text: "El egresado del Nivel Primario es un estudiante autónomo, reflexivo y comprometido con su comunidad:\n• Maneja competencias lingüísticas avanzadas en español y competencias consolidadas en inglés.\n• Aplica el pensamiento matemático y científico a la resolución de problemas cotidianos.\n• Practica la empatía, el trabajo en equipo y la resolución pacífica de conflictos basada en los AEC.\n• Hace un uso responsable de las tecnologías y respeta el medio ambiente.",
      },
      {
        heading: "Perfil Docente Profesional",
        text: docentePerfilStandard,
      },
    ],
  },
  secundario: {
    title: "Nivel Secundario (Escuela N° 1739)",
    subtitle: "Orientación en Ciencias Naturales, formación ciudadana, pensamiento crítico y preparación académica superior.",
    color: "brand-blue",
    content: [
      {
        heading: "Propuesta Educativa Institucional",
        text: "Ofrece un Ciclo Básico Común y un Ciclo Orientado en Ciencias Naturales. Brinda una formación integral caracterizada por la cultura del diálogo, el rigor académico, el acompañamiento en la diversidad y la articulación con estudios superiores y el mundo laboral.",
      },
      {
        heading: "Proyectos Institucionales y Convivencia",
        text: proyectosInstitucionalesStandard,
      },
      {
        heading: "Perfil del Estudiante Egresado",
        text: "Egresados capaces de liderar su proyecto de vida con autonomía y responsabilidad ética:\n• Poseen pensamiento crítico, dominio tecnológico y sólida fundamentación científica.\n• Demuestran alta competencia en el idioma inglés para ámbitos académicos e internacionales.\n• Compromiso con la inclusión, la ciudadanía democrática y el desarrollo sustentable de la Patagonia.",
      },
      {
        heading: "Perfil Docente Profesional y Trabajo Colaborativo",
        text: docentePerfilStandard,
      },
    ],
  },
};

type Params = { nivel: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const data = nivelesData[resolvedParams.nivel as keyof typeof nivelesData];
  if (!data) return { title: "No encontrado" };
  return {
    title: `${data.title} | Fundación Educativa Esquel`,
    description: data.subtitle,
  };
}

// Para SSG (Static Site Generation)
export function generateStaticParams() {
  return [{ nivel: "inicial" }, { nivel: "primario" }, { nivel: "secundario" }];
}

export default async function NivelPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const nivel = resolvedParams.nivel;
  const data = nivelesData[nivel as keyof typeof nivelesData];

  if (!data) notFound();

  const colorClassMap = {
    "brand-yellow": "bg-brand-yellow text-brand-blue",
    "brand-green": "bg-brand-green text-white",
    "brand-blue": "bg-brand-blue text-white",
  };

  return (
    <div className="bg-background pb-24">
      {/* Dynamic Header */}
      <section className={`pt-32 pb-20 ${colorClassMap[data.color as keyof typeof colorClassMap]}`}>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <span className="font-bold uppercase tracking-widest text-sm mb-4 block opacity-80">
            Propuesta Educativa
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl leading-tight">
            {data.title}
          </h1>
          <p className="text-xl max-w-2xl leading-relaxed opacity-90">
            {data.subtitle}
          </p>
        </div>
      </section>

      {/* Content Blocks */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          <div className="flex flex-col gap-12">
            {data.content.map((block, i) => (
              <div key={i} className="group">
                <div className="h-1 w-12 bg-current opacity-20 mb-6 group-hover:w-24 transition-all duration-300" />
                <h2 className="text-3xl font-bold text-brand-blue mb-4">
                  {block.heading}
                </h2>
                <p className="text-lg text-brand-foreground/80 leading-relaxed whitespace-pre-line">
                  {block.text}
                </p>
              </div>
            ))}
          </div>

          <div className="sticky top-32 flex flex-col gap-8">
            <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-brand-gray/5">
              <h3 className="text-2xl font-bold text-brand-blue mb-4">
                Consulta por Vacantes {new Date().getFullYear() + 1}
              </h3>
              <p className="text-brand-foreground/70 mb-8">
                El proceso de admisión para {data.title} se encuentra abierto a toda la comunidad de Esquel y zona de influencia. Te invitamos a postularte.
              </p>
              <a href="/inscripciones" className={`inline-block w-full text-center px-6 py-4 rounded-full font-bold shadow-md hover:-translate-y-1 transition-all ${colorClassMap[data.color as keyof typeof colorClassMap]}`}>
                Llenar Formulario de Admisión
              </a>
            </div>

            <div className="bg-brand-gray/5 p-12 rounded-[2rem] text-center border border-brand-gray/10">
              <span className="text-brand-lightblue text-sm font-bold uppercase tracking-wider mb-2 block">Contacto Directo</span>
              <p className="font-semibold text-brand-blue">escuelafeesquel@gmail.com</p>
              <p className="text-brand-foreground/70 text-sm mt-2">(02945) 456053</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
