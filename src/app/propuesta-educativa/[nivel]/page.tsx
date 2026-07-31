import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";

const docentePerfilStandard = `Nuestros equipos docentes enseñan desde propuestas pedagógicas contextualizadas y significativas, adaptando sus estrategias a la diversidad de trayectorias escolares. Acompañan de manera personalizada los procesos de aprendizaje, respetando los tiempos y necesidades de cada estudiante, y promueven vínculos basados en el respeto, la confianza y los valores institucionales. Sostienen una comunicación permanente con las familias y trabajan colaborativamente con el Equipo de Orientación Escolar (EOE).`;

const nivelesData = {
  inicial: {
    slug: "inicial",
    title: "Nivel Inicial (Escuela N° 1030)",
    subtitle: "Salas de 3, 4 y 5 años. Aprendizaje significativo basado en el juego, la exploración y la contención afectiva.",
    color: "brand-yellow",
    image: "/nivel-inicial.png",
    ejeCentral: "El juego es el motor del aprendizaje: potencia la creatividad, la imaginación, la autonomía y la comprensión del mundo en un marco de contención y respeto por los tiempos de cada niño y niña.",
    egresadoTitle: "Perfil del Egresado (Inicial)",
    egresadoPoints: [
      "Se expresan con claridad a través del lenguaje verbal, plástico, corporal y sonoro.",
      "Desarrollan hábitos de autonomía, cooperación y cuidado ambiental.",
      "Comprenden y respetan normas simples de convivencia democrática.",
      "Se inician de forma natural en la lectura, la matemática y la experiencia del inglés."
    ],
  },
  primario: {
    slug: "primario",
    title: "Nivel Primario (Escuela N° 1030)",
    subtitle: "Excelencia académica con enfoque en valores, educación personalizada e inglés intensivo.",
    color: "brand-green",
    image: "/nivel-primario.png",
    ejeCentral: "En el Nivel Primario entendemos que cada estudiante recorre una trayectoria escolar única. Fomentamos el aprendizaje contextualizado y el desarrollo del pensamiento crítico, integrando la tecnología como herramienta pedagógica y estimulando la curiosidad científica y humanística.",
    egresadoTitle: "Perfil del Estudiante Egresado (Primario)",
    egresadoPoints: [
      "Maneja competencias lingüísticas avanzadas en español y competencias consolidadas en inglés.",
      "Aplica el pensamiento matemático y científico a la resolución de problemas cotidianos.",
      "Practica la empatía, el trabajo en equipo y la resolución pacífica de conflictos basada en los AEC.",
      "Hace un uso responsable de las tecnologías y respeta el medio ambiente."
    ],
  },
  secundario: {
    slug: "secundario",
    title: "Nivel Secundario (Escuela N° 1739)",
    subtitle: "Orientación en Ciencias Naturales, formación ciudadana, pensamiento crítico y preparación académica superior.",
    color: "brand-blue",
    image: "/nivel-secundario.png",
    ejeCentral: "Ofrece un Ciclo Básico Común y un Ciclo Orientado en Ciencias Naturales. Brinda una formación integral caracterizada por la cultura del diálogo, el rigor académico, el acompañamiento en la diversidad y la articulación con estudios superiores y el mundo laboral.",
    egresadoTitle: "Perfil del Estudiante Egresado (Secundario)",
    egresadoPoints: [
      "Poseen pensamiento crítico, dominio tecnológico y sólida fundamentación científica.",
      "Demuestran alta competencia en el idioma inglés para ámbitos académicos e internacionales.",
      "Compromiso con la inclusión, la ciudadanía democrática y el desarrollo sustentable de la Patagonia.",
      "Preparados para la transición universitaria y proyectos de vida profesionales con ética."
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

export function generateStaticParams() {
  return [{ nivel: "inicial" }, { nivel: "primario" }, { nivel: "secundario" }];
}

export default async function NivelPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const nivel = resolvedParams.nivel;
  const data = nivelesData[nivel as keyof typeof nivelesData];

  if (!data) notFound();

  const currentYear = new Date().getFullYear();

  const colorBgMap = {
    "brand-yellow": "bg-brand-yellow text-brand-blue",
    "brand-green": "bg-brand-green text-white",
    "brand-blue": "bg-brand-blue text-white",
  };

  return (
    <div className="bg-background pb-24">
      {/* Dynamic Header */}
      <section className={`pt-32 pb-20 ${colorBgMap[data.color as keyof typeof colorBgMap]}`}>
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-4xl">
          <span className="font-bold uppercase tracking-widest text-xs mb-4 block opacity-80">
            Oferta Pedagógica
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {data.title}
          </h1>
          <p className="text-xl max-w-2xl mx-auto leading-relaxed opacity-95 font-medium">
            {data.subtitle}
          </p>
        </div>
      </section>

      {/* Main Grid: Image Hero & Eje Central (Balanced 2-Column Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Image Frame */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-brand-gray/10 aspect-video lg:aspect-[4/3]">
              <img 
                src={data.image} 
                alt={data.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block mb-2">
                  Vivencia Institucional
                </span>
                <p className="text-sm font-semibold text-white/90">
                  Formación integral y contención afectiva en Esquel.
                </p>
              </div>
            </div>

            {/* Eje Central & Call to action */}
            <div className="flex flex-col justify-between h-full space-y-6">
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm">
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Propuesta Principal</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Eje Pedagógico Central</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base">
                  {data.ejeCentral}
                </p>
              </div>

              {/* Vacantes Box */}
              <div className="bg-brand-blue text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold text-brand-yellow mb-1">
                    Admisiones {currentYear + 1}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    Proceso de admisión disponible para {data.title}.
                  </p>
                </div>
                <Link 
                  href="/inscripciones" 
                  className="shrink-0 bg-brand-yellow text-brand-blue font-bold px-6 py-3.5 rounded-full hover:bg-white transition-all shadow-md text-sm flex items-center gap-2"
                >
                  Postularse <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Profiles Grid (Student Profile vs Teacher Profile) */}
      <section className="py-16 bg-brand-gray/5 border-y border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-brand-blue">Acompañamiento y Desarrollo</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">La sinergia entre la formación del estudiante y el rol docente</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Student Profile Card */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">{data.egresadoTitle}</h3>
                <ul className="space-y-3.5 text-sm text-brand-foreground/80 font-medium">
                  {data.egresadoPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Teacher Profile Card */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">Perfil Docente Profesional</h3>
                <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                  {docentePerfilStandard}
                </p>
              </div>
              <div className="mt-8 bg-brand-blue/5 p-4 rounded-xl text-xs text-brand-blue font-semibold text-center border border-brand-blue/10">
                Trabajo articulado en red con el Equipo de Orientación Escolar (EOE).
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Institutional Projects (Symmetrical Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Compromiso Normativo</span>
            <h2 className="text-3xl font-bold text-brand-blue">Proyectos Institucionales y Convivencia</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-brand-yellow/10 p-8 rounded-[2rem] border border-brand-yellow/20">
              <h3 className="text-xl font-bold text-brand-blue mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-blue" />
                Acuerdos Escolares de Convivencia (AEC)
              </h3>
              <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                Herramienta fundamental para promover la educación en valores, el fortalecimiento de los vínculos pedagógicos y la construcción de una convivencia democrática respetuosa en el aula.
              </p>
            </div>

            <div className="bg-brand-green/5 p-8 rounded-[2rem] border border-brand-green/20">
              <h3 className="text-xl font-bold text-brand-green mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-green" />
                Mejora Institucional Continua
              </h3>
              <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                Capacitaciones permanentes del equipo docente, proyectos pedagógicos innovadores y actualización continua en línea con el Diseño Curricular Provincial y la normativa vigente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Level Switcher Navigation Bar */}
      <section className="container mx-auto px-6 lg:px-12 mt-8">
        <div className="bg-white p-6 rounded-[2rem] border border-brand-gray/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-sm text-brand-blue">Conocé otros niveles:</span>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/propuesta-educativa/inicial" 
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${nivel === 'inicial' ? 'bg-brand-yellow text-brand-blue shadow-sm' : 'bg-brand-gray/10 text-brand-foreground/70 hover:bg-brand-yellow/20'}`}
            >
              Nivel Inicial
            </Link>
            <Link 
              href="/propuesta-educativa/primario" 
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${nivel === 'primario' ? 'bg-brand-green text-white shadow-sm' : 'bg-brand-gray/10 text-brand-foreground/70 hover:bg-brand-green/20'}`}
            >
              Nivel Primario
            </Link>
            <Link 
              href="/propuesta-educativa/secundario" 
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${nivel === 'secundario' ? 'bg-brand-blue text-white shadow-sm' : 'bg-brand-gray/10 text-brand-foreground/70 hover:bg-brand-blue/20'}`}
            >
              Nivel Secundario
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
