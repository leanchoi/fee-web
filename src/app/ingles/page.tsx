import { Metadata } from "next";
import {
  BookOpen,
  CheckCircle2,
  Globe,
  GraduationCap,
  Layers,
  Library,
  Plane,
  Puzzle,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Inglés intensivo",
  description:
    "Programa de inglés intensivo desde Sala de 3 hasta el Secundario: enfoque comunicativo, CLIL y aprendizaje por proyectos, certificaciones Cambridge English (Starters a C1 Advanced), exámenes de la UTN e intercambios al Reino Unido.",
  alternates: { canonical: "/ingles" },
};

export default function InglesPage() {
  return (
    <div className="bg-background pb-24">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-brand-blue text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Globe className="w-full h-full object-cover translate-x-1/4 -translate-y-1/4" strokeWidth={1} />
        </div>
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <span className="text-brand-yellow font-bold uppercase tracking-widest text-sm mb-4 block">
            Acreditaciones Nacionales e Internacionales
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl text-white leading-tight">
            Inglés Intensivo
          </h1>
          <p className="text-xl text-white/85 max-w-3xl leading-relaxed font-medium">
            Desde hace más de dos décadas, un programa intensivo que fortalece las competencias
            comunicativas y potencia la proyección académica e internacional de nuestros
            estudiantes.
          </p>
        </div>
      </section>

      {/* Metodologías: transversales a los tres niveles */}
      <section className="border-b border-brand-gray/10 bg-white py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-brand-green font-bold uppercase tracking-wider text-sm mb-3">
              Cómo enseñamos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue leading-tight mb-4">
              Metodologías que van más allá de la clase de idioma
            </h2>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Integramos el inglés con otras áreas del conocimiento para desarrollar pensamiento
              crítico, creatividad y autonomía.
            </p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <li className="rounded-[2rem] border border-brand-gray/15 bg-brand-gray/5 p-8">
              <span
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green"
                aria-hidden="true"
              >
                <Users className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-brand-blue mb-2">Enfoque comunicativo</h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                El idioma se usa para decir algo real desde el primer día: la conversación es el
                medio y no sólo el objetivo.
              </p>
            </li>

            <li className="rounded-[2rem] border border-brand-gray/15 bg-brand-gray/5 p-8">
              <span
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue"
                aria-hidden="true"
              >
                <Puzzle className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-brand-blue mb-2">
                Project &amp; Task-Based Learning
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Se aprende resolviendo tareas y proyectos con un resultado concreto, donde el inglés
                es la herramienta para llegar a él.
              </p>
            </li>

            <li className="rounded-[2rem] border border-brand-gray/15 bg-brand-gray/5 p-8">
              <span
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow/20 text-brand-yellow-dark"
                aria-hidden="true"
              >
                <Layers className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-bold text-brand-blue mb-2">CLIL</h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Contenidos de otras materias se estudian en inglés, de modo que el idioma y el
                conocimiento avanzan juntos.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12 space-y-16 md:space-y-24">
          
          {/* Inicial y Primario */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <span className="text-brand-green font-bold uppercase tracking-wider text-sm">
                Nivel Inicial y Primario
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue leading-tight">
                Metodología y Adquisición Natural
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed font-medium">
                Un recorrido que comienza en Sala de 3 con dos estímulos semanales y continúa, a partir de Sala de 5, con 2 horas diarias de inglés.
              </p>
              <p className="text-foreground/75 leading-relaxed text-sm">
                Los niños y niñas adquieren el idioma de la misma forma en que aprenden su lengua materna: interactuando, jugando y escuchando en un entorno natural y estimulante. Este enfoque favorece el desarrollo integral de las cuatro habilidades lingüísticas básicas:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {["Expresión oral", "Comprensión auditiva", "Expresión escrita", "Comprensión lectora"].map((h) => (
                  <div key={h} className="bg-brand-gray/5 border p-4 rounded-xl text-center">
                    <span className="font-bold text-brand-blue text-sm">{h}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-l-4 border-brand-green bg-brand-green/5 p-6 rounded-r-2xl">
                <h3 className="font-bold text-brand-green text-lg mb-2">En los primeros años</h3>
                <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
                  <li>Aprendizaje natural e intuitivo.</li>
                  <li>Adquisición por interacción, juego y escucha.</li>
                  <li>Desarrollo integral de la competencia lingüística.</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              {/* Certificaciones Primario */}
              <div className="bg-white p-8 rounded-[2rem] shadow-md border border-brand-gray/10">
                <h3 className="text-xl font-bold text-brand-blue mb-4 flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-brand-green" />
                  Certificaciones Cambridge English
                </h3>
                <p className="text-xs text-foreground/70 mb-4">(Primeros pasos en el Nivel Primario, de 3.er a 6.º grado)</p>
                <ul className="space-y-3 text-sm text-foreground/80">
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" /> <strong>Pre A1 Starters</strong></li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" /> <strong>A1 Movers</strong></li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" /> <strong>A2 Flyers</strong></li>
                  <li className="flex gap-2 items-center"><CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" /> <strong>A2 Key (KET)</strong></li>
                </ul>
              </div>

              {/* Concert */}
              <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-8 rounded-[2rem]">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow-dark mb-1">
                  Experiencia destacada
                </p>
                <h3 className="text-lg font-bold text-brand-blue mb-2">Concert en inglés</h3>
                <p className="text-xs text-foreground/75 leading-relaxed">
                  A fin de año, estudiantes y docentes de Nivel Inicial y Primario organizan y protagonizan un musical completamente en inglés, integrando teatro, canto e idiomas.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-brand-gray/10" />

          {/* Secundario */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32">
              <div className="bg-brand-blue text-white p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-xl">
                <span className="text-brand-yellow font-bold uppercase tracking-wider text-xs block mb-2">
                  Formamos ciudadanos para el mundo
                </span>
                <h2 className="text-3xl font-bold mb-4">Nivel Secundario</h2>
                <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                  En la Escuela Secundaria N° 1739 de la Fundación Educativa Esquel formamos estudiantes preparados para un mundo global, combinando idioma, cultura y habilidades clave.
                </p>
                
                <h3 className="font-bold text-brand-yellow text-sm uppercase tracking-wider mb-3">¿Qué nos distingue?</h3>
                <ul className="space-y-2 text-xs text-white/90">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" /> Alto nivel de inglés académico y social.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" /> Proyección y acreditación nacional e internacional.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" /> Formación cultural activa y literatura.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-yellow shrink-0" /> Preparación académica y laboral para el futuro.</li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-12">
              <div>
                <h3 className="text-2xl font-bold text-brand-blue mb-6">Propuesta Académica y Exámenes</h3>
                
                <div className="space-y-6">
                  {/* Cambridge */}
                  <div className="bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-sm">
                    <h4 className="font-bold text-brand-blue text-base flex items-center gap-2 mb-3">
                      <GraduationCap className="w-5 h-5 text-brand-blue" />
                      Certificaciones Cambridge English (Universidad de Cambridge)
                    </h4>
                    <ul className="space-y-3 text-sm text-foreground/75">
                      <li>• <strong>B1 Preliminary (PET)</strong></li>
                      <li>• <strong>B2 First (FCE):</strong> Perfeccionamiento en Nivel Secundario, consolidando habilidades para la vida diaria y estudios superiores.</li>
                      <li>• <strong>C1 Advanced (CAE):</strong> Excelencia internacional para acceder a universidades y becas de todo el mundo.</li>
                    </ul>
                  </div>

                  {/* UTN */}
                  <div className="bg-white p-6 rounded-2xl border border-brand-gray/10 shadow-sm">
                    <h4 className="font-bold text-brand-blue text-base flex items-center gap-2 mb-1">
                      <GraduationCap className="w-5 h-5 text-brand-green" />
                      Universidad Tecnológica Nacional (Nacional)
                    </h4>
                    <p className="text-sm text-foreground/75">
                      Exámenes y certificaciones nacionales extendidos por la UTN que validan el dominio técnico del idioma.
                    </p>
                  </div>
                </div>
              </div>

              {/* Experiencias */}
              <div>
                <h3 className="text-2xl font-bold text-brand-blue mb-6">Experiencias que potencian el aprendizaje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Biblioteca */}
                  <div className="flex gap-4 items-start bg-brand-gray/5 p-5 rounded-2xl border border-brand-gray/10">
                    <Library className="w-6 h-6 text-brand-blue shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-brand-blue text-sm">Biblioteca & iRead</h4>
                      <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                        Acceso a libros físicos y a la plataforma digital iRead con más de 400 títulos interactivos en inglés.
                      </p>
                    </div>
                  </div>

                  {/* Feria */}
                  <div className="flex gap-4 items-start bg-brand-gray/5 p-5 rounded-2xl border border-brand-gray/10">
                    <BookOpen className="w-6 h-6 text-brand-green shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-brand-blue text-sm">Feria del Libro</h4>
                      <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                        Feria anual del libro en inglés realizada en la escuela junto a Roots Bookshop.
                      </p>
                    </div>
                  </div>

                  {/* Viajes */}
                  <div className="col-span-1 md:col-span-2 flex gap-4 items-start bg-brand-yellow/10 p-6 rounded-2xl border border-brand-yellow/20">
                    <Plane className="w-6 h-6 text-brand-yellow-dark shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-brand-blue text-base">
                        Intercambios y viajes de estudio al Reino Unido
                      </h4>
                      <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                        Programas de intercambio y viajes educativos de inmersión lingüística y
                        cultural en campus británicos. Estudiantes de Nivel Secundario asisten a
                        clases en instituciones del Reino Unido y conviven con alumnos de todo el
                        mundo: una experiencia que fortalece la autonomía, la confianza y la visión
                        global, además de la fluidez en contextos reales.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Cierre */}
      <section className="container mx-auto px-6 lg:px-12">
        <figure className="relative overflow-hidden rounded-[2.5rem] bg-brand-blue px-8 py-14 text-center text-white shadow-2xl md:px-16">
          <div
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-green/25 blur-[70px]"
            aria-hidden="true"
          />
          <Globe
            className="relative z-10 mx-auto mb-6 h-10 w-10 text-brand-yellow-light"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <blockquote className="relative z-10">
            <p className="mx-auto max-w-3xl text-2xl font-bold leading-snug md:text-3xl">
              Formamos ciudadanos del mundo con pensamiento crítico, identidad local y proyección
              internacional.
            </p>
          </blockquote>
        </figure>
      </section>
    </div>
  );
}
