"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Smile, BookOpenCheck, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const niveles = [
  {
    title: "Nivel Inicial",
    desc: "Salas de 3, 4 y 5 años. Aprendizaje basado en el juego y la exploración natural.",
    icon: Smile,
    image: "/photos/fee_photo_01.jpg", 
    color: "text-brand-yellow",
    bg: "bg-brand-yellow/10",
    borderHover: "hover:border-brand-yellow",
    href: "/propuesta-educativa/inicial",
  },
  {
    title: "Nivel Primario",
    desc: "Excelencia académica con enfoque en valores e inglés intensivo.",
    icon: BookOpenCheck,
    image: "/photos/fee_photo_24.jpg",
    color: "text-brand-green",
    bg: "bg-brand-green/10",
    borderHover: "hover:border-brand-green",
    href: "/propuesta-educativa/primario",
  },
  {
    title: "Nivel Secundario",
    desc: "Formación ciudadana y preparación pre-universitaria con certificaciones internacionales.",
    icon: GraduationCap,
    image: "/photos/fee_photo_02.jpg", 
    color: "text-brand-blue",
    bg: "bg-brand-blue/10",
    borderHover: "hover:border-brand-blue",
    href: "/propuesta-educativa/secundario",
  },
];

// Eliminamos variants temporariamente para asegurar build exitoso en VPS
export function NivelesCards() {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const clientWidth = scrollRef.current.clientWidth;
    // Calculate which item is snapped centered
    const index = Math.round(scrollLeft / (clientWidth * 0.85));
    setActiveIdx(Math.min(Math.max(index, 0), niveles.length - 1));
  };

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-expressive text-3xl text-brand-green block mb-2">
            Nuestra propuesta educativa
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-blue mb-6">
            Un camino educativo completo
          </h2>
          <p className="text-lg text-brand-foreground/80 leading-relaxed">
            Un acompañamiento dinámico y altamente humanizado del crecimiento de tu hijo, desde sus primeros pasos hasta la puerta de la universidad.
          </p>
        </div>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-6 md:pb-0 scroll-smooth w-full px-4 md:px-0 -mx-4 md:mx-0 scrollbar-none"
        >
          {niveles.map((nivel, i) => {
            const Icon = nivel.icon;
            return (
              <motion.div 
                key={nivel.title} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-auto w-[82vw] sm:w-[360px] md:w-auto shrink-0 snap-center select-none"
              >
                <Link 
                  href={nivel.href}
                  className={cn(
                    "bg-white rounded-[2rem] border border-brand-gray/10 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col hover:border-transparent group h-full",
                    nivel.borderHover
                  )}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={nivel.image} 
                      alt={nivel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className={cn("absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", nivel.bg, "backdrop-blur-md bg-white/80")}>
                      <Icon className={cn("w-6 h-6", nivel.color)} />
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 flex flex-col flex-grow">
                    <h3 className="text-2xl font-bold text-brand-blue mb-4 transition-colors">
                      {nivel.title}
                    </h3>
                    
                    <p className="text-brand-foreground/70 leading-relaxed mb-8 flex-grow">
                      {nivel.desc}
                    </p>
                    
                    <span className={cn("font-bold text-sm tracking-wide flex items-center gap-2", nivel.color)}>
                      Descubrir más 
                      <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Page Indicator Dots */}
        <div className="flex md:hidden justify-center items-center gap-2.5 mt-6">
          {niveles.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                activeIdx === idx ? "w-6 bg-brand-green" : "w-2 bg-brand-green/30"
              )}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
