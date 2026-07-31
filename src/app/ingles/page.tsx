import { Metadata } from "next";
import { CheckCircle2, Globe, BookOpen, GraduationCap, Library, Plane, Award, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Inglés Intensivo | Fundación Educativa Esquel",
  description: "Preparando a nuestros estudiantes para un mundo global con certificaciones de Cambridge y UTN.",
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
            Acreditaciones Nacionales e Internacionales
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Programa de Inglés Intensivo
          </h1>
          <p className="text-xl text-white/80 leading-relaxed font-medium">
            Más de dos décadas preparando a nuestros estudiantes para comunicarse con soltura y rendir con éxito exámenes internacionales de la Universidad de Cambridge y certificaciones nacionales de la UTN.
          </p>
        </div>
      </section>

      {/* Section 1: Metodología & 4 Competencias (Balanced 2-Column Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Box: Adquisición Natural */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Nivel Inicial y Primario</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Adquisición Natural e Inmersión</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base mb-4">
                  Un recorrido continuo que inicia en <strong>Sala de 3 años</strong> con dos estímulos semanales y avanza desde <strong>Sala de 5 años</strong> con <strong>2 horas diarias de inglés</strong>.
                </p>
                <p className="text-brand-foreground/75 leading-relaxed text-sm">
                  Los niños y niñas aprehenden el idioma de la misma manera que su lengua materna: interactuando, jugando y escuchando en un entorno natural y estimulante.
                </p>
              </div>

              <div className="mt-8 border-l-4 border-brand-green bg-brand-green/5 p-5 rounded-r-2xl">
                <h4 className="font-bold text-brand-green text-sm mb-1">Enfoque Pedagógico Comunicativo:</h4>
                <p className="text-xs text-brand-foreground/80 font-medium">
                  Aprendizaje intuitivo, libre de presiones, orientado a la soltura verbal y la comprensión espontánea.
                </p>
              </div>
            </div>

            {/* Right Box: Las 4 Habilidades Lingüísticas */}
            <div className="bg-brand-blue/5 p-8 md:p-10 rounded-[2.5rem] border border-brand-blue/15 flex flex-col justify-between">
              <div>
                <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-2">Competencias Globales</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-6">Desarrollo Lingüístico Integral</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-5 rounded-2xl border border-brand-blue/10 shadow-sm text-center">
                    <span className="text-brand-blue font-bold text-sm block">Expresión Oral</span>
                    <span className="text-xs text-brand-foreground/60">Speaking & Fluency</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-blue/10 shadow-sm text-center">
                    <span className="text-brand-blue font-bold text-sm block">Comprensión Auditiva</span>
                    <span className="text-xs text-brand-foreground/60">Listening Skills</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-blue/10 shadow-sm text-center">
                    <span className="text-brand-blue font-bold text-sm block">Expresión Escrita</span>
                    <span className="text-xs text-brand-foreground/60">Writing & Grammar</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-brand-blue/10 shadow-sm text-center">
                    <span className="text-brand-blue font-bold text-sm block">Comprensión Lectora</span>
                    <span className="text-xs text-brand-foreground/60">Reading Comprehension</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-brand-foreground/70 font-medium text-center italic">
                Sostenido transversalmente desde Inicial hasta el egreso del Nivel Secundario.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Ruta de Certificaciones Cambridge y UTN (Balanced 2-Column Grid) */}
      <section className="py-16 bg-brand-gray/5 border-y border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Trayectoria de Exámenes</span>
            <h2 className="text-3xl font-bold text-brand-blue">Acreditaciones y Certificaciones</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">Certificaciones validadas a nivel nacional e internacional</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Primaria Cambridge */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-blue">Cambridge Young Learners</h3>
                    <span className="text-xs text-brand-foreground/60">Nivel Primario (de 3.º a 6.º Grado)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Pre A1 Starters", desc: "Primer contacto lúdico con el formato de examen" },
                    { name: "A1 Movers", desc: "Consolidación de vocabulario y estructura gramatical" },
                    { name: "A2 Flyers", desc: "Nivel elemental de autonomía comunicativa" },
                    { name: "A2 Key (KET)", desc: "Examen oficial de suficiencia básica internacional" },
                  ].map((cert) => (
                    <div key={cert.name} className="flex items-center justify-between p-3.5 bg-brand-gray/5 rounded-xl text-sm font-medium border border-brand-gray/10">
                      <span className="font-bold text-brand-blue">{cert.name}</span>
                      <span className="text-xs text-brand-foreground/70">{cert.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Secundaria Cambridge & UTN */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-blue">Exámenes Avanzados & UTN</h3>
                    <span className="text-xs text-brand-foreground/60">Nivel Secundario & Ámbito Técnico</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                    <span className="font-bold text-brand-blue text-sm block mb-1">Certificaciones Cambridge International:</span>
                    <ul className="text-xs text-brand-foreground/80 space-y-1.5 font-medium">
                      <li>• <strong>B1 Preliminary (PET):</strong> Intermedio independiente.</li>
                      <li>• <strong>B2 First (FCE):</strong> Competencia fluida para ámbitos laborales y universitarios.</li>
                      <li>• <strong>C1 Advanced (CAE):</strong> Excelencia académica internacional para universidades globales.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                    <span className="font-bold text-brand-green text-sm block mb-1">Acreditación Nacional UTN:</span>
                    <p className="text-xs text-brand-foreground/80 font-medium">
                      Convenio con la Universidad Tecnológica Nacional para certificar el dominio técnico del idioma inglés a nivel nacional.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Experiencias Destacadas (3-Column Symmetrical Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-yellow-dark font-bold text-xs uppercase tracking-wider block mb-2">Vivencias Integrales</span>
            <h2 className="text-3xl font-bold text-brand-blue">Experiencias que Potencian el Idioma</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">El inglés puesto en práctica a través del arte, la lectura y la inmersión cultural</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Concert */}
            <div className="bg-brand-yellow/10 p-8 rounded-[2.5rem] border border-brand-yellow/20 flex flex-col justify-between">
              <div>
                <Sparkles className="w-8 h-8 text-brand-yellow-dark mb-4" />
                <h3 className="text-xl font-bold text-brand-blue mb-3">Concert Anual en Inglés</h3>
                <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                  A fin de año, los estudiantes de Nivel Inicial y Primario protagonizan un gran musical totalmente en inglés, integrando actuación, canto e idiomas sobre el escenario.
                </p>
              </div>
            </div>

            {/* Card 2: Biblioteca & iRead */}
            <div className="bg-brand-green/5 p-8 rounded-[2.5rem] border border-brand-green/20 flex flex-col justify-between">
              <div>
                <Library className="w-8 h-8 text-brand-green mb-4" />
                <h3 className="text-xl font-bold text-brand-green mb-3">Biblioteca & iRead</h3>
                <p className="text-sm text-brand-foreground/80 leading-relaxed font-medium">
                  Acceso a literatura física y a la plataforma digital iRead con más de 400 títulos interactivos, además de la Feria del Libro Anual junto a Roots Bookshop.
                </p>
              </div>
            </div>

            {/* Card 3: Viajes al Reino Unido */}
            <div className="bg-brand-blue text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                <Plane className="w-8 h-8 text-brand-yellow mb-4" />
                <h3 className="text-xl font-bold text-brand-yellow mb-3">Viajes de Estudio al UK</h3>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  Programas de inmersión lingüística y cultural en campus británicos. Estudiantes de Secundario asisten a clases en el Reino Unido, conviviendo con alumnos de todo el mundo.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
