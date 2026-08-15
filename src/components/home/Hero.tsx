"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { getAdmissionYear } from "@/lib/dateUtils";
import { useRef } from "react";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center overflow-hidden bg-background pt-32 pb-16 md:py-24"
    >
      {/* Background Image with Overlay and Parallax */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 z-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/photos/fee_photo_11.jpg" 
          alt="Comunidad Fundación Educativa Esquel en la Patagonia" 
          className="w-full h-full object-cover object-center transform scale-105 filter brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/95 via-brand-blue/80 to-brand-blue/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-transparent to-black/30" />
      </motion.div>

      {/* Shapes Overlay - Subtle Patagonian Glows */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-green/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-blue/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center w-full">
          
          <motion.div 
            style={{ y: contentY }}
            className="flex-1 flex flex-col items-start gap-6 text-left"
          >
            {/* Tagline */}
            <div className="bg-brand-yellow/90 backdrop-blur-sm text-brand-blue px-5 py-1.5 rounded-full shadow-md rotate-[-2deg] border border-white/20">
              <span className="text-expressive text-lg lg:text-xl font-semibold italic">Educando con valores</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-brand-green leading-[1.1] tracking-tight max-w-3xl">
              Mentes libres,<br />
              <span className="text-brand-blue">corazones solidarios.</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg md:text-xl text-brand-blue/70 max-w-xl font-medium leading-relaxed">
              Somos una comunidad educativa en la Patagonia Argentina enfocada en la excelencia académica, fuerte formación en idioma Inglés y el desarrollo humano integral desde el Nivel Inicial hasta el Secundario.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <Link
                href="/inscripciones"
                className="inline-flex items-center justify-center bg-brand-blue text-white px-8 py-3.5 rounded-full font-bold text-lg hover:bg-brand-green transition-all shadow-lg hover:-translate-y-1 text-center"
              >
                Admisión {getAdmissionYear()}
              </Link>
              <Link
                href="/propuesta-educativa/inicial"
                className="inline-flex items-center justify-center bg-white/60 backdrop-blur-sm text-brand-blue border border-brand-blue/10 px-8 py-3.5 rounded-full font-bold text-lg hover:bg-white transition-all shadow-sm text-center"
              >
                Conocé los niveles
              </Link>
            </div>
          </motion.div>

          {/* Logo visual on desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="hidden lg:flex flex-none w-72 h-72 xl:w-96 xl:h-96 relative items-center justify-center"
          >
            <div className="absolute inset-0 bg-brand-blue/5 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 w-full h-full p-8 bg-white/10 backdrop-blur-[2px] rounded-full border border-white/20 shadow-2xl">
              <img 
                src="/logo.png" 
                alt="Logo Fundación Educativa Esquel" 
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
