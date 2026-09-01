import { Metadata } from "next";
import { Globe, BookOpen, GraduationCap, Plane, Sparkles, Award, Compass, Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "Inglés Intensivo | Fundación Educativa Esquel",
  description: "Formación global con proyección internacional: certificaciones Cambridge English y experiencias de inmersión.",
};

export default function InglesPage() {
  return (
    <div className="bg-background pb-24">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-brand-blue text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Globe className="w-full h-full object-cover translate-x-1/4 -translate-y-1/4" strokeWidth={1} />
        </div>
        <div className="container mx-auto px-6 lg:px-12 text-center max-w-4xl relative z-10">
          <span className="text-brand-yellow font-bold uppercase tracking-widest text-xs mb-4 block">
            Programa de Inglés Intensivo
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Formación Global con Proyección Internacional
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-medium">
            Programa de inglés intensivo que fortalece las competencias comunicativas y potencia la proyección académica e internacional de nuestros estudiantes.
          </p>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="bg-brand-yellow/10 border-b border-brand-yellow/20 py-8">
        <div className="container mx-auto px-6 lg:px-12 text-center max-w-4xl">
          <div className="flex items-center justify-center gap-3 text-brand-blue font-bold italic text-lg sm:text-xl">
            <Quote className="w-6 h-6 text-brand-yellow-dark shrink-0 hidden sm:inline-block" />
            <p>
              "Formamos ciudadanos del mundo con pensamiento crítico, identidad local y proyección internacional."
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Metodologías Innovadoras (Grid 2 - Balanced) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Metodologías Innovadoras */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold mb-6">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Enfoque Pedagógico</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Metodologías Innovadoras</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base mb-6">
                  Trabajamos con enfoques comunicativos, <strong>Project & Task-Based Learning</strong> y <strong>CLIL</strong> (Content and Language Integrated Learning), integrando el inglés con otras áreas del conocimiento para desarrollar pensamiento crítico, creatividad y autonomía.
                </p>
              </div>

              <div className="bg-brand-green/5 p-5 rounded-2xl border border-brand-green/20">
                <span className="font-bold text-brand-green text-sm block mb-1">Pilares Metodológicos:</span>
                <ul className="text-xs text-brand-foreground/80 font-medium space-y-1">
                  <li>• <strong>Project & Task-Based Learning:</strong> Aprendizaje basado en proyectos y tareas reales.</li>
                  <li>• <strong>CLIL:</strong> Integración del idioma con ciencias, arte y cultura.</li>
                  <li>• <strong>Comunicación Fluida:</strong> Estimulación natural desde Nivel Inicial.</li>
                </ul>
              </div>
            </div>

            {/* Desarrollo Lingüístico e Inmersión */}
            <div className="bg-brand-blue/5 p-8 md:p-10 rounded-[2.5rem] border border-brand-blue/15 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold mb-6">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-2">Trayectoria Escolar</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Inmersión Continua</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base mb-4">
                  Iniciamos en <strong>Sala de 3 años</strong> con estímulos semanales y avanzamos desde <strong>Sala de 5 años y Primaria</strong> con <strong>2 horas diarias de inglés</strong>.
                </p>
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-white p-3.5 rounded-xl border border-brand-blue/10 text-center font-bold text-brand-blue text-xs">
                    Expresión Oral
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-brand-blue/10 text-center font-bold text-brand-blue text-xs">
                    Comprensión Auditiva
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-brand-blue/10 text-center font-bold text-brand-blue text-xs">
                    Expresión Escrita
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-brand-blue/10 text-center font-bold text-brand-blue text-xs">
                    Comprensión Lectora
                  </div>
                </div>
              </div>

              <p className="text-xs text-brand-foreground/70 font-medium text-center italic">
                Formación articulada desde Nivel Inicial hasta el egreso del Nivel Secundario.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Certificaciones Internacionales (Balanced Grid) */}
      <section className="py-16 bg-brand-gray/5 border-y border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Acreditaciones Oficiales</span>
            <h2 className="text-3xl font-bold text-brand-blue">Certificaciones Internacionales</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">
              Preparación para las certificaciones internacionales de <strong>Cambridge English</strong> (Universidad de Cambridge) y exámenes nacionales de la <strong>UTN</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Cambridge English */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-blue">Cambridge English Qualifications</h3>
                    <span className="text-xs text-brand-foreground/60">Universidad de Cambridge</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "A2 Key (KET)", desc: "Dominio elemental e independencia comunicativa inicial" },
                    { name: "B1 Preliminary (PET)", desc: "Nivel intermedio consolidado para la vida cotidiana" },
                    { name: "B2 First (FCE)", desc: "Fluidez académica y profesional internacional" },
                    { name: "C1 Advanced (CAE)", desc: "Excelencia superior para universidades y becas del mundo" },
                  ].map((cert) => (
                    <div key={cert.name} className="flex items-center justify-between p-3.5 bg-brand-gray/5 rounded-xl text-sm font-medium border border-brand-gray/10">
                      <span className="font-bold text-brand-blue">{cert.name}</span>
                      <span className="text-xs text-brand-foreground/70 text-right">{cert.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Primario Young Learners & UTN */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-blue">Trayectoria Inicial & Nacional</h3>
                    <span className="text-xs text-brand-foreground/60">Primaria & Universidad Tecnológica Nacional</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                    <span className="font-bold text-brand-green text-sm block mb-1">Primeros Pasos en Primario:</span>
                    <p className="text-xs text-brand-foreground/80 font-medium leading-relaxed">
                      Evaluaciones formativas <strong>Pre A1 Starters</strong> y <strong>A1 Movers</strong> de 3.º a 6.º grado para familiarizar a los estudiantes con el formato internacional.
                    </p>
                  </div>

                  <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                    <span className="font-bold text-brand-blue text-sm block mb-1">Acreditación Nacional UTN:</span>
                    <p className="text-xs text-brand-foreground/80 font-medium leading-relaxed">
                      Convenio con la Universidad Tecnológica Nacional que certifica la suficiencia técnica y laboral del idioma dentro del país.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Experiencias Internacionales (3-Column Symmetrical Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-yellow-dark font-bold text-xs uppercase tracking-wider block mb-2">Vivencias Transformativas</span>
            <h2 className="text-3xl font-bold text-brand-blue">Experiencias Internacionales y Culturales</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">Inmersión lingüística, arte y literatura en contexto real</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Viajes al Reino Unido */}
            <div className="bg-brand-blue text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <Plane className="w-8 h-8 text-brand-yellow mb-4" />
                <h3 className="text-xl font-bold text-brand-yellow mb-3">Experiencias Internacionales</h3>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  Programas de intercambio y viajes educativos al Reino Unido y Europa que ofrecen experiencias de inmersión lingüística y cultural, fortaleciendo la autonomía, la confianza y la visión global de nuestros estudiantes.
                </p>
              </div>
            </div>

            {/* Card 2: Concert Anual */}
            <div className="bg-brand-yellow/10 p-8 rounded-[2.5rem] border border-brand-yellow/20 flex flex-col justify-between">
              <div>
                <Sparkles className="w-8 h-8 text-brand-yellow-dark mb-4" />
                <h3 className="text-xl font-bold text-brand-blue mb-3">Concert en Inglés</h3>
                <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                  Musical anual totalmente en inglés donde estudiantes de Inicial y Primaria integran teatro, canto e idiomas sobre el escenario.
                </p>
              </div>
            </div>

            {/* Card 3: Biblioteca & Feria del Libro */}
            <div className="bg-brand-green/5 p-8 rounded-[2.5rem] border border-brand-green/20 flex flex-col justify-between">
              <div>
                <BookOpen className="w-8 h-8 text-brand-green mb-4" />
                <h3 className="text-xl font-bold text-brand-green mb-3">Biblioteca & iRead</h3>
                <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                  Acceso a literatura física y a la plataforma digital iRead con más de 400 títulos interactivos, además de la Feria del Libro junto a Roots Bookshop.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Travel Experience: Oxford & Amsterdam (New Showcase) */}
      <section className="container mx-auto px-6 lg:px-12 my-6">
        <div className="bg-white rounded-[2.5rem] border border-brand-gray/10 p-8 md:p-12 shadow-sm">
          <div className="max-w-3xl mb-10">
            <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block mb-3">
              Viajes Educativos e Intercambio Global
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-blue mb-4">
              Inmersión en Oxford & Ámsterdam
            </h2>
            <p className="text-base text-brand-foreground/80 leading-relaxed font-medium">
              Nuestros viajes de inmersión internacional combinan formación académica de excelencia en las universidades más prestigiosas del mundo con vivencias culturales únicas que expanden los horizontes de los estudiantes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Foto 1: Oxford University */}
            <div className="group rounded-[2rem] overflow-hidden border border-brand-gray/10 bg-slate-900 flex flex-col shadow-md relative min-h-[420px]">
              <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                <img 
                  src="/photos/fee_photo_oxford.jpg" 
                  alt="Viaje Educativo a la Universidad de Oxford - Fundación Educativa Esquel" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-brand-blue/90 backdrop-blur-sm text-brand-yellow font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                  Oxford • Reino Unido
                </div>
              </div>
              <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-2">
                    Tradición Universitaria y Excelencia Académica
                  </h3>
                  <p className="text-xs text-brand-foreground/80 leading-relaxed font-medium">
                    Recorrido formativo por los históricos colleges de la Universidad de Oxford, la icónica <strong>Radcliffe Camera</strong> y bibliotecas centenarias, interactuando en inglés en situaciones académicas reales.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-gray/10 flex items-center justify-between text-[11px] font-bold text-brand-blue/70">
                  <span>Práctica Lingüística Intensiva</span>
                  <span>Oxford University (UK)</span>
                </div>
              </div>
            </div>

            {/* Foto 2: Amsterdam / Holanda */}
            <div className="group rounded-[2rem] overflow-hidden border border-brand-gray/10 bg-slate-900 flex flex-col shadow-md relative min-h-[420px]">
              <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                <img 
                  src="/photos/fee_photo_amsterdam.jpg" 
                  alt="Viaje Cultural a Ámsterdam y Zaanse Schans - Fundación Educativa Esquel" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-teal-800/90 backdrop-blur-sm text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                  Ámsterdam • Países Bajos
                </div>
              </div>
              <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-2">
                    Apertura Intercultural y Patrimonio Europeo
                  </h3>
                  <p className="text-xs text-brand-foreground/80 leading-relaxed font-medium">
                    Experiencia formativa descubriendo los molinos históricos de <strong>Zaanse Schans</strong>, los canales de Ámsterdam y el patrimonio cultural europeo, fomentando la autonomía y el compañerismo.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-brand-gray/10 flex items-center justify-between text-[11px] font-bold text-teal-800">
                  <span>Convivencia & Ciudadanía Global</span>
                  <span>Países Bajos</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Visual Concert Feature */}
      <section className="container mx-auto px-6 lg:px-12 my-12">
        <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-brand-gray/10 relative h-72 sm:h-96 md:h-[420px]">
          <img 
            src="/photos/fee_photo_12.jpg" 
            alt="English Concert & Drama Festival - Fundación Educativa Esquel" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/90 via-brand-blue/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white max-w-2xl">
            <span className="bg-brand-yellow text-brand-blue text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider inline-block mb-2">
              Teatro, Arte y Expresión Bilingüe
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              El aprendizaje del idioma en acción sobre el escenario
            </h3>
            <p className="text-sm text-white/90 font-medium hidden sm:block">
              Cada año nuestros alumnos protagonizan el tradicional English Concert, integrando fluidez comunicativa, canto y expresión dramática.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
