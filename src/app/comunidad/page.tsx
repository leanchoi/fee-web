import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, HeartHandshake, HelpCircle, Users } from "lucide-react";
import { ORG } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comunidad de familias",
  description:
    "El Consejo de Administración, las comisiones de trabajo y el voluntariado que sostienen la Fundación Educativa Esquel.",
  alternates: { canonical: "/comunidad" },
};

export default function ComunidadPage() {
  return (
    <div className="bg-background pb-24">
      {/* Hero */}
      <section className="pt-32 pb-20 bg-brand-blue text-white relative overflow-hidden">
        {/* Apuntaba a `/comunidad-hero.png`, un archivo que no está en el
            repositorio. Usa la foto real de la sede. */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src="/school-esquel.jpg"
            alt=""
            fill
            sizes="100vw"
            quality={65}
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue via-brand-blue/80 to-brand-blue" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          {/* La trayectoria supera los 30 años: el proyecto educativo viene de
              la Escuela Arco Iris, anterior a la constitución de la Fundación
              como tal en 2005. Son dos hitos distintos, no un dato en conflicto. */}
          <p className="font-bold uppercase tracking-widest text-sm mb-4 block text-brand-yellow-light">
            Más de 30 años caminando juntos
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Nuestra comunidad
          </h1>
          <p className="text-xl max-w-2xl mx-auto font-medium opacity-90">
            Familias, docentes y estudiantes unidos en un proyecto educativo que trasciende el aula.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 md:mb-24">
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-brand-blue mb-6 leading-tight">
                El corazón detrás <br /> de las aulas
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                Todas las comisiones de trabajo de la <strong>{ORG.legalName}</strong> están conformadas por madres, padres y tutores de manera voluntaria. Cada familia que ingresa entiende que el bienestar del ecosistema escolar depende de lo que aportemos colectivamente.
              </p>
              <ul className="flex flex-col gap-4">
                <li className="flex items-center gap-3 text-brand-blue font-bold">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  Consejo de Administración
                </li>
                <li className="flex items-center gap-3 text-brand-blue font-bold">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  Comisión de Apoyo y Eventos
                </li>
                <li className="flex items-center gap-3 text-brand-blue font-bold">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/30 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  Proyectos Solidarios Externos
                </li>
              </ul>

              <div className="mt-8 bg-brand-yellow/10 border border-brand-yellow/30 p-6 rounded-2xl">
                <span className="text-brand-blue font-bold text-xs uppercase tracking-wider block mb-1">Programa de Voluntariado Institucional</span>
                <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-3">
                  Constituye evidencia concreta del compromiso institucional con una <strong>escuela inclusiva, solidaria y profundamente articulada con la comunidad</strong>.
                </p>
                <ul className="text-xs text-foreground/75 space-y-1.5 font-medium">
                  <li>• <strong>Finalidad:</strong> Promover acciones concretas de apoyo pedagógico, acompañamiento a familias y fortalecimiento del entorno educativo.</li>
                  <li>• <strong>Acciones:</strong> Talleres de mantenimiento colaborativo, campañas solidarias de equipamiento y padrinazgo de proyectos educativos.</li>
                </ul>
              </div>

              <div className="mt-4 bg-brand-green/5 border border-brand-green/20 p-6 rounded-2xl">
                <span className="text-brand-green font-bold text-xs uppercase tracking-wider block mb-1">Cooperación Institucional</span>
                <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                  El Consejo de Administración cuenta con la ayuda activa de la <strong>Cooperadora de la escuela de Nivel Inicial y Primario (N° 1030)</strong> para la compra de materiales pedagógicos, mejora de infraestructura y la recaudación de fondos comunitarios.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-brand-gray/5 relative overflow-hidden">
               {/* Decorative Circle */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand-lightblue/10 rounded-full blur-[80px]" />
               
               <h2 className="text-2xl font-bold text-brand-blue mb-6">Preguntas habituales</h2>
               
               <div className="flex flex-col gap-6">
                 <div>
                   <h3 className="font-bold text-brand-green flex gap-2 items-center mb-2">
                     <HelpCircle className="w-4 h-4" />
                     ¿Es obligatorio participar?
                   </h3>
                   <p className="text-sm text-foreground/70 leading-relaxed">
                     No se exige asistencia semanal, pero sí se espera que las familias formen parte de comisiones puntuales o asistan a las asambleas anuales para garantizar la representatividad.
                   </p>
                 </div>
                 <div>
                   <h3 className="font-bold text-brand-green flex gap-2 items-center mb-2">
                     <HelpCircle className="w-4 h-4" />
                     ¿Tienen fines de lucro?
                   </h3>
                   <p className="text-sm text-foreground/70 leading-relaxed">
                     De ninguna manera. Todos los excedentes de las cuotas mensuales se reinvierten sistemáticamente en salarios docentes, infraestructura, calefacción o fondos de becas parciales.
                   </p>
                 </div>
               </div>

            </div>
          </div>

          <div className="bg-brand-blue text-white rounded-[2rem] p-12 text-center lg:px-32 relative overflow-hidden">
            <h2 className="text-3xl font-bold mb-4 z-10 relative">¿Querés sumar tu granito de arena?</h2>
            <p className="text-brand-lightblue mb-8 z-10 relative">Invitamos a todas nuestras familias a acercarse al consejo.</p>
            <Link href="/contacto" className="inline-block bg-brand-yellow text-brand-blue font-bold px-8 py-4 rounded-full shadow-lg hover:bg-white transition-all z-10 relative">
              Quiero colaborar
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
