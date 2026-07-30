"use client";

import { motion } from "framer-motion";
import { Heart, Languages, Users } from "lucide-react";

export function PropuestaSection() {
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
      desc: "Un modelo liderado por un Consejo de Administración compuesto por madres y padres, que fortalece el compromiso de las familias en la vida institucional.",
      icon: Users,
      color: "text-brand-yellow bg-brand-yellow/20",
    },
  ];

  return (
    <section className="py-24 bg-brand-gray/5 border-y border-brand-gray/10 relative z-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-brand-green font-bold uppercase tracking-widest text-sm mb-2 block">
            Nuestros Pilares
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-blue">
            Nuestra propuesta educativa
          </h2>
          <p className="text-lg text-brand-foreground/70 mt-4 font-medium">
            Se distingue por:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-white p-6 sm:p-8 rounded-[2rem] border border-brand-gray/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${p.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-4">
                  {p.title}
                </h3>
                <p className="text-brand-foreground/80 leading-relaxed text-sm md:text-base">
                  {p.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-brand-blue text-white rounded-[2.5rem] p-10 md:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden"
        >
          {/* Subtle patagonian glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-green/20 rounded-full blur-[60px]" />
          
          <h3 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">
            Gracias por acercarte a la Fundación Educativa Esquel.
          </h3>
          <p className="text-brand-lightblue text-base md:text-lg leading-relaxed max-w-2xl mx-auto relative z-10 font-medium">
            Te invitamos a recorrer este espacio y sumarte a construir, juntos, una educación con sentido.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
