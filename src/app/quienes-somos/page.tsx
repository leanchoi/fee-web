import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Quiénes Somos | Fundación Educativa Esquel",
  description: "Conocé la historia, ideario, misión y valores de nuestra comunidad educativa en la Patagonia.",
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
    <div className="bg-background pb-24">
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
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-4xl">
          <span className="text-brand-yellow font-bold uppercase tracking-widest text-sm mb-4 block">
            Nuestra Historia e Identidad
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Una escuela nacida del corazón de las familias.
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-medium">
            Desde 2005, la Fundación Educativa Esquel se consolida como un proyecto único en la región, donde el compromiso colectivo prima sobre cualquier interés individual.
          </p>
        </div>
      </section>

      {/* Section 1: Historia & Ideario (Balanced 2-Column Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Box: Historia */}
            <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Origen Comunitario</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Un Sueño Compartido</h2>
                <div className="space-y-4 text-brand-foreground/80 leading-relaxed font-medium text-base">
                  <p>
                    Todo comenzó con la unión de un grupo de familias de Esquel, preocupadas por la falta de una oferta educativa que combinara excelencia académica, bilingüismo intensivo y formación en valores, decidiendo tomar cartas en el asunto de manera comunitaria.
                  </p>
                  <p>
                    Lo que empezó como reuniones de planificación pronto se transformó en el acta fundacional de un colegio distinto. Sin un dueño único, la escuela le pertenece y es sostenida colectivamente por la comunidad de familias.
                  </p>
                </div>
              </div>
              <div className="mt-8 bg-brand-blue text-white p-6 rounded-2xl relative overflow-hidden">
                <h3 className="text-lg font-bold text-brand-yellow mb-2">¿Por qué somos Fundación?</h3>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  A diferencia de una empresa privada, en la FEE las decisiones estratégicas son tomadas colaborativamente por un Consejo de Administración compuesto por madres y padres ad-honorem.
                </p>
              </div>
            </div>

            {/* Right Box: Ideario FEE */}
            <div className="bg-brand-yellow/10 p-8 md:p-10 rounded-[2rem] border border-brand-yellow/20 flex flex-col justify-between">
              <div>
                <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-2">Eje Filosofico</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-6">El Ideario FEE</h2>
                
                <div className="bg-white p-6 rounded-2xl border border-brand-yellow/30 mb-6 shadow-sm">
                  <p className="text-xl text-brand-blue font-bold italic mb-3">
                    "No formamos alumnos, formamos personas libres."
                  </p>
                  <p className="text-sm text-brand-foreground/75 font-medium leading-relaxed">
                    Nuestro objetivo es potenciar las habilidades únicas de cada estudiante en un ambiente de cordialidad, respeto y estímulo intelectual constante.
                  </p>
                </div>

                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base">
                  Creemos en una pedagogía viva que entrelaza el rigor conceptual con la contención afectiva, respetando los ritmos individuales y favoreciendo el desarrollo de sujetos autónomos y éticos.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Misión y Visión (Symmetrical Cards Grid) */}
      <section className="py-12 bg-brand-gray/5 border-y border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-brand-blue">Marco Institucional</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">Nuestra hoja de ruta pedagógica e institucional para las escuelas N° 1030 y N° 1739</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Misión */}
            <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-brand-gray/10 shadow-sm flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xl mb-6">
                M
              </div>
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Nuestra Misión</h3>
              <p className="text-brand-foreground/80 leading-relaxed font-medium text-base">
                “Brindar una educación integral basada en valores, acompañando a cada estudiante en su desarrollo intelectual, emocional, social y ético y formar personas autónomas, empáticas, solidarias y críticas, capaces de convivir con respeto, liderar con compromiso y contribuir a una sociedad más justa. Lo hacemos en un entorno que prioriza el bienestar, la curiosidad, el pensamiento crítico y el cuidado mutuo.”
              </p>
            </div>

            {/* Visión */}
            <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-brand-gray/10 shadow-sm flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xl mb-6">
                V
              </div>
              <h3 className="text-2xl font-bold text-brand-blue mb-4">Nuestra Visión</h3>
              <p className="text-brand-foreground/80 leading-relaxed font-medium text-base">
                “La institución aspira a consolidarse como un referente educativo en la región, reconocida por la calidad humana de sus egresados, la excelencia académica, la sólida enseñanza del inglés como segunda lengua y su contribución al desarrollo social y cultural. En este marco, se propone avanzar hacia un modelo innovador que integre las tecnologías con sentido pedagógico, promoviendo experiencias formativas que inspiren a niños, niñas y jóvenes a comprometerse activamente con el bien común.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Cotidianidad & Protección de Imagen (Symmetrical Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Vida Cotidiana */}
            <div className="bg-brand-green/5 p-8 md:p-10 rounded-[2rem] border border-brand-green/20 flex flex-col justify-between">
              <div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Vivencia Pedagógica</span>
                <h3 className="text-2xl font-bold text-brand-green mb-4">Vida Cotidiana y Experiencias de Aprendizaje</h3>
                <p className="text-brand-foreground/80 leading-relaxed font-medium mb-4 text-sm md:text-base">
                  La identidad de nuestras escuelas cobra vida en el día a día: en el **aprender haciendo**, la curiosidad espontánea y las actividades en contacto con la comunidad.
                </p>
                <ul className="space-y-3 text-sm text-brand-foreground/80 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5" />
                    <span><strong>Salidas Educativas:</strong> Recorridos de exploración por la naturaleza patagónica y espacios culturales locales.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5" />
                    <span><strong>Articulación Pedagógica:</strong> Proyectos integradores continuos entre Nivel Inicial, Primario y Secundario con otras instituciones de la región.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5" />
                    <span><strong>Vinculación Comunitaria:</strong> Actividades donde el conocimiento académico se pone al servicio de Esquel.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Protección de Imagen */}
            <div className="bg-brand-blue/5 p-8 md:p-10 rounded-[2rem] border border-brand-blue/15 flex flex-col justify-between">
              <div>
                <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-2">Compromiso Ético</span>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">Política de Cuidado y Protección de Imagen</h3>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-sm md:text-base mb-4">
                  En concordancia con nuestros valores éticos y el compromiso explícito de cuidar a nuestros estudiantes, <strong>conservamos una política estricta de no difusión pública de imágenes donde se expongan rostros de niños, niñas y jóvenes</strong>.
                </p>
                <p className="text-brand-foreground/75 leading-relaxed font-medium text-sm">
                  Compartimos el día a día escolar a través de producciones pedagógicas, trabajos grupales, perspectivas de aula y testimonios de proyectos que visibilizan el proceso educativo resguardando plenamente su derecho a la privacidad.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: Nuestros Valores (Equilibrado Grid 3x3) */}
      <section className="py-16 bg-white border-t border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-green font-bold uppercase tracking-widest text-xs mb-2 block">Fundamentos</span>
            <h2 className="text-3xl font-bold text-brand-blue">Nuestros Valores Institucionales</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">Principios que orientan la convivencia y la práctica pedagógica diaria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {valores.map((val) => (
              <div key={val.title} className="flex gap-4 items-start bg-brand-gray/5 p-6 rounded-2xl border border-brand-gray/10 shadow-sm hover:shadow-md transition-all">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-brand-blue text-base">{val.title}</h3>
                  <p className="text-xs text-brand-foreground/75 mt-1 leading-relaxed font-medium">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
