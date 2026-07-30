"use client";

import { motion } from "framer-motion";
import { Heart, Languages, Users } from "lucide-react";
import { ORG } from "@/lib/site";

const pillars = [
  {
    title: "Educación en valores",
    desc: "Promovemos la responsabilidad, la solidaridad y la participación activa en la sociedad.",
    icon: Heart,
    color: "text-brand-green bg-brand-green/10",
  },
  {
    title: "Inglés intensivo",
    desc: "Desde los primeros años, como herramienta de apertura al mundo.",
    icon: Languages,
    color: "text-brand-blue bg-brand-blue/10",
  },
  {
    title: "Gestión participativa",
    desc: "Un modelo liderado por un Consejo de Administración de madres y padres, que fortalece el compromiso de las familias en la vida institucional.",
    icon: Users,
    color: "text-brand-yellow-dark bg-brand-yellow/20",
  },
];

export function PropuestaSection() {
  return (
    <section className="relative z-20 border-y border-brand-gray/10 bg-brand-gray/5 py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-2 block text-sm font-bold uppercase tracking-widest text-brand-green">
            Nuestros pilares
          </p>
          {/* Este título decía "Nuestra propuesta educativa", igual que la
              volanta de la sección de niveles que viene después: dos encabezados
              con el mismo texto en la misma página. Cada sección nombra ahora lo
              que efectivamente contiene. */}
          <h2 className="text-4xl font-bold text-brand-blue md:text-5xl">
            Tres convicciones que sostienen el proyecto
          </h2>
          <p className="mt-4 text-lg font-medium text-foreground/70">
            No son enunciados sueltos: definen cómo se enseña, quién decide y qué se espera de cada
            familia.
          </p>
        </div>

        <ul className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.li
                key={pillar.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="flex flex-col items-start rounded-[2rem] border border-brand-gray/10 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-8"
              >
                <span
                  className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${pillar.color}`}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mb-4 text-xl font-bold text-brand-blue">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-foreground/80 md:text-base">
                  {pillar.desc}
                </p>
              </motion.li>
            );
          })}
        </ul>

        {/* Cierre de sección */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-brand-blue p-10 text-center text-white shadow-2xl md:p-12"
        >
          <div
            className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-green/20 blur-[60px]"
            aria-hidden="true"
          />
          <p className="relative z-10 mb-4 text-2xl font-bold md:text-3xl">
            Gracias por acercarte a la {ORG.legalName}.
          </p>
          <p className="relative z-10 mx-auto max-w-2xl text-base font-medium leading-relaxed text-brand-lightblue md:text-lg">
            Te invitamos a recorrer este espacio y sumarte a construir, juntos, una educación con
            sentido.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
