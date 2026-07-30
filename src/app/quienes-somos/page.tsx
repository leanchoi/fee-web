import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Historia, ideario, misión, visión y valores de la Fundación Educativa Esquel: una escuela fundada y sostenida por familias desde 2005.",
  alternates: { canonical: "/quienes-somos" },
};

export default function QuienesSomosPage() {
  const valores = [
    { title: "Respeto", desc: "Promovemos una convivencia armónica entre personas, ideas y entorno." },
    { title: "Libertad", desc: "Fomentamos el pensamiento autónomo y la expresión auténtica." },
    { title: "Equidad", desc: "Educamos desde la inclusión y la igualdad de oportunidades." },
    { title: "Empatía", desc: "Aprendemos a comprender y acompañar a los demás." },
    { title: "Trabajo en equipo", desc: "Creemos en el valor del aprendizaje colaborativo." },
    { title: "Esfuerzo", desc: "Valoramos la dedicación, la perseverancia y el compromiso." },
    { title: "Democracia", desc: "Impulsamos la participación activa de toda la comunidad." },
    { title: "Diversidad", desc: "Celebramos las diferencias como fuente de riqueza." },
    { title: "Conciencia ambiental", desc: "Educamos para el desarrollo sostenible." },
  ];

  return (
    <div className="bg-background">
      {/* Editorial Header */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-brand-green text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 40 0 0" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <span className="text-brand-yellow-light font-bold uppercase tracking-widest text-sm mb-4 block">
            Nuestra Historia
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl text-white leading-tight">
            Una escuela nacida del corazón de las familias.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl leading-relaxed font-medium">
            Desde 2005, la Fundación Educativa Esquel se consolida como un proyecto único en la región, donde el compromiso colectivo prima sobre cualquier interés individual.
          </p>
        </div>
      </section>

      {/* Main Content Asymmetric Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* Left Column - Ideario and Why Foundation */}
          <div className="lg:col-span-5 flex flex-col gap-12">
            <div className="lg:sticky lg:top-32 space-y-8 md:space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-brand-blue mb-6 border-b pb-2 border-brand-gray/20">
                  El Ideario FEE
                </h2>
                <div className="text-lg text-foreground/80 leading-relaxed font-semibold italic border-l-4 border-brand-yellow pl-4 py-1 bg-brand-yellow/5 rounded-r-xl">
                  <p className="mb-2">
                    “No formamos alumnos: formamos personas libres.”
                  </p>
                  <p className="text-sm not-italic font-medium text-brand-blue/80">
                    Nuestro objetivo es potenciar las habilidades únicas de cada estudiante en un ambiente de cordialidad, respeto y estímulo intelectual constante.
                  </p>
                </div>
              </div>
              
              <div className="bg-brand-blue text-white p-6 sm:p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/20 rounded-full blur-[40px]" />
                <h3 className="text-2xl font-bold text-brand-yellow mb-4 relative z-10">¿Por qué somos Fundación?</h3>
                <p className="text-white/90 text-sm leading-relaxed relative z-10 font-medium">
                  A diferencia de una empresa privada, en la FEE las decisiones estratégicas son tomadas colaborativamente por un Consejo de Administración compuesto por padres y madres que trabajan <em>ad honorem</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Story, Values, Mission and Vision */}
          <div className="lg:col-span-7 space-y-16 text-foreground/85">
            {/* Contexto histórico */}
            <div className="rich-text text-lg font-medium">
              <p>
                Todo comenzó con la unión de un grupo de familias de Esquel, preocupadas por la falta de una oferta educativa que combinara excelencia académica, bilingüismo intensivo y formación en valores, decidiendo tomar cartas en el asunto de manera comunitaria.
              </p>
              <p>
                Lo que empezó como reuniones de planificación y un sueño compartido, pronto se transformó en el acta fundacional de un colegio distinto. Sin un dueño único, la escuela le pertenece y es sostenida colectivamente por la comunidad de familias.
              </p>
            </div>

            {/* Misión */}
            <div className="bg-brand-gray/5 p-8 rounded-[2rem] border border-brand-gray/10">
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Nuestra Misión</h3>
              <p className="text-foreground/80 leading-relaxed font-medium">
                “Brindar una educación integral basada en valores, acompañando a cada estudiante en su desarrollo intelectual, emocional, social y ético y formar personas autónomas, empáticas, solidarias y críticas, capaces de convivir con respeto, liderar con compromiso y contribuir a una sociedad más justa. Lo hacemos en un entorno que prioriza el bienestar, la curiosidad, el pensamiento crítico y el cuidado mutuo.”
              </p>
            </div>

            {/* Visión */}
            <div className="bg-brand-gray/5 p-8 rounded-[2rem] border border-brand-gray/10">
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Visión</h3>
              <p className="text-foreground/80 leading-relaxed font-medium">
                “La institución aspira a consolidarse como un referente educativo en la región, reconocida por la calidad humana de sus egresados, la excelencia académica, la sólida enseñanza del inglés como segunda lengua y su contribución al desarrollo social y cultural. En este marco, se propone avanzar hacia un modelo innovador que integre las tecnologías con sentido pedagógico, promoviendo experiencias formativas que inspiren a niños, niñas y jóvenes a comprometerse activamente con el bien común. Asimismo, proyecta un crecimiento sostenido sin perder su identidad esencial: una escuela cercana, ética, inclusiva y profundamente vinculada con la comunidad de Esquel y sus alrededores.”
              </p>
            </div>

            {/* Vida Cotidiana y Experiencias Pedagógicas */}
            <div className="bg-brand-green/5 p-8 rounded-[2rem] border border-brand-green/20">
              <h3 className="text-2xl font-bold text-brand-green mb-4">Vida Cotidiana y Experiencias de Aprendizaje</h3>
              <p className="text-foreground/80 leading-relaxed font-medium mb-3">
                La identidad de nuestras escuelas (N° 1030 y N° 1739) cobra vida en el día a día: en el <strong>aprender haciendo</strong>, la curiosidad espontánea y los proyectos que trascienden el aula.
              </p>
              <ul className="space-y-2 text-sm text-foreground/80 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">•</span>
                  <span><strong>Salidas Educativas:</strong> Recorridos de exploración por la naturaleza patagónica y espacios culturales locales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">•</span>
                  <span><strong>Articulación Pedagógica:</strong> Proyectos integradores continuos entre Nivel Inicial, Primario y Secundario con otras instituciones de la región.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">•</span>
                  <span><strong>Vinculación Comunitaria:</strong> Actividades donde el conocimiento académico se pone al servicio de la comunidad de Esquel.</span>
                </li>
              </ul>
            </div>

            {/* Política de Protección e Imagen */}
            <div className="bg-brand-blue/5 p-8 rounded-[2rem] border border-brand-blue/15">
              <h3 className="text-2xl font-bold text-brand-blue mb-3">Política de Cuidado y Protección de la Imagen</h3>
              <p className="text-foreground/80 leading-relaxed font-medium text-sm">
                En concordancia con nuestros valores éticos y el compromiso explícito de cuidar a nuestros estudiantes, <strong>conservamos una política estricta de no difusión pública de imágenes donde se expongan rostros de niños, niñas y jóvenes</strong>. Compartimos el día a día escolar a través de producciones pedagógicas, trabajos grupales, perspectivas de aula y testimonios de proyectos que visibilizan el proceso educativo resguardando plenamente su derecho a la privacidad.
              </p>
            </div>

            {/* Valores */}
            <div>
              <h3 className="text-2xl font-bold text-brand-blue mb-6">Nuestros Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {valores.map((val) => (
                  <div key={val.title} className="flex gap-3 items-start bg-white p-5 rounded-2xl border border-brand-gray/10 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-brand-blue text-base">{val.title}</h4>
                      <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}
