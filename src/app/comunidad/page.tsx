import { Metadata } from "next";
import Link from "next/link";
import { Heart, Users, HelpCircle, HeartHandshake, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Comunidad de Familias | Fundación Educativa Esquel",
  description: "Nuestra escuela es sostenida e impulsada por el compromiso activo de padres y ex-estudiantes.",
};

export default function ComunidadPage() {
  return (
    <div className="bg-background pb-24">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-brand-blue text-white relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/comunidad-hero.png" 
            alt="Comunidad FEE" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue via-brand-blue/80 to-brand-blue" />
        </div>
        
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10 max-w-4xl">
          <span className="font-bold uppercase tracking-widest text-xs mb-4 block text-brand-yellow">
            Más de 30 años caminando juntos
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
            Nuestra Comunidad de Familias
          </h1>
          <p className="text-xl max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">
            Familias, docentes y estudiantes unidos en un proyecto educativo participativo que trasciende las aulas.
          </p>
        </div>
      </section>

      {/* Section 1: Gestión Común & Voluntariado (Balanced 2-Column Grid) */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Box: El Corazón de la Escuela */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Compromiso Ad-Honorem</span>
                <h2 className="text-3xl font-bold text-brand-blue mb-4">Órganos de Participación</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base mb-6">
                  Todas las comisiones de la <strong>Fundación Educativa Esquel</strong> están conformadas por familias de manera voluntaria. Cada integrante entiende que el bienestar del ecosistema escolar depende del aporte colectivo.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-brand-blue font-bold text-sm bg-brand-gray/5 p-3.5 rounded-xl border border-brand-gray/10">
                    <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0 text-brand-blue">
                      <Users className="w-5 h-5" />
                    </div>
                    Consejo de Administración (Padres & Madres)
                  </li>
                  <li className="flex items-center gap-3 text-brand-blue font-bold text-sm bg-brand-gray/5 p-3.5 rounded-xl border border-brand-gray/10">
                    <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    Cooperadora N° 1030 (Inicial y Primaria)
                  </li>
                  <li className="flex items-center gap-3 text-brand-blue font-bold text-sm bg-brand-gray/5 p-3.5 rounded-xl border border-brand-gray/10">
                    <div className="w-9 h-9 rounded-xl bg-brand-yellow/30 flex items-center justify-center text-brand-blue shrink-0">
                      <Heart className="w-5 h-5" />
                    </div>
                    Comisión de Apoyo y Eventos Solidarios
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Box: Programa de Voluntariado */}
            <div className="bg-brand-green/5 p-8 md:p-10 rounded-[2.5rem] border border-brand-green/20 flex flex-col justify-between">
              <div>
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-2">Inclusión e Impacto</span>
                <h2 className="text-3xl font-bold text-brand-green mb-4">Programa de Voluntariado</h2>
                <p className="text-brand-foreground/80 leading-relaxed font-medium text-base mb-4">
                  Evidencia concreta del compromiso institucional con una <strong>escuela inclusiva, solidaria y profundamente articulada con Esquel</strong>.
                </p>
                <ul className="space-y-3 text-sm text-brand-foreground/80 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-2" />
                    <span><strong>Acción Directa:</strong> Talleres de mantenimiento colaborativo, campañas solidarias de equipamiento y padrinazgo de proyectos educativos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-2" />
                    <span><strong>Fortalecimiento Institucional:</strong> Compra colectiva de insumos de laboratorio, renovación de áreas de juego e integración con instituciones de la región.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 bg-white p-4 rounded-2xl border border-brand-green/20 text-xs text-brand-foreground/75 font-semibold">
                La Cooperadora apoya la adquisición de material pedagógico para las aulas.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 2: Preguntas Frecuentes (3-Column Symmetrical Grid) */}
      <section className="py-16 bg-brand-gray/5 border-y border-brand-gray/10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-2">Transparencia</span>
            <h2 className="text-3xl font-bold text-brand-blue">Preguntas Frecuentes de la Comunidad</h2>
            <p className="text-sm text-brand-foreground/70 mt-2">Claridad sobre la dinámica de participación y financiamiento institucional</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Q1 */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <HelpCircle className="w-8 h-8 text-brand-green mb-4" />
                <h3 className="text-lg font-bold text-brand-blue mb-3">¿Es obligatorio participar?</h3>
                <p className="text-xs text-brand-foreground/75 leading-relaxed font-medium">
                  No se exige asistencia semanal, pero sí se espera que las familias formen parte de comisiones puntuales o asistan a las asambleas anuales para garantizar la representatividad democrática de la escuela.
                </p>
              </div>
            </div>

            {/* Q2 */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <ShieldCheck className="w-8 h-8 text-brand-blue mb-4" />
                <h3 className="text-lg font-bold text-brand-blue mb-3">¿Tienen fines de lucro?</h3>
                <p className="text-xs text-brand-foreground/75 leading-relaxed font-medium">
                  De ninguna manera. Todos los excedentes de las cuotas mensuales se reinvierten sistemáticamente en salarios docentes, infraestructura, calefacción o fondos de becas parciales.
                </p>
              </div>
            </div>

            {/* Q3 */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-brand-gray/10 shadow-sm flex flex-col justify-between">
              <div>
                <Users className="w-8 h-8 text-brand-yellow-dark mb-4" />
                <h3 className="text-lg font-bold text-brand-blue mb-3">¿Cómo se eligen las autoridades?</h3>
                <p className="text-xs text-brand-foreground/75 leading-relaxed font-medium">
                  El Consejo de Administración se renueva periódicamente en Asambleas Generales Ordinarias donde cada familia tiene voz y voto en las decisiones estructurales.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 3: Call to Action Banner */}
      <section className="container mx-auto px-6 lg:px-12 mt-16">
        <div className="bg-brand-blue text-white rounded-[2.5rem] p-10 md:p-14 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-[80px]" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative z-10">¿Querés sumar tu granito de arena?</h2>
          <p className="text-brand-lightblue text-base mb-8 max-w-2xl mx-auto relative z-10 font-medium">
            Invitamos a todas las familias de la Fundación a sumarse activamente a las comisiones de trabajo y asambleas.
          </p>
          <Link 
            href="/contacto" 
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-blue font-bold px-8 py-4 rounded-full shadow-lg hover:bg-white transition-all text-sm relative z-10"
          >
            Quiero Colaborar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
