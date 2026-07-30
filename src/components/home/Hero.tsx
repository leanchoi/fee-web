"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getAdmissionYear } from "@/lib/dateUtils";
import { ORG } from "@/lib/site";
import { Logo } from "@/components/brand/Logo";

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  const admissionYear = getAdmissionYear();

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden bg-background pb-16 pt-32 md:min-h-screen md:py-24"
    >
      {/* Fondo con parallax.
          Antes apuntaba a `/hero-bg.png`, que no existe en el repositorio: la
          sección se veía sin imagen. Usa la foto real de la escuela, servida por
          next/image para no bajar 1 MB sin optimizar. */}
      <motion.div
        style={prefersReducedMotion ? undefined : { y: bgY }}
        className="absolute inset-0 z-0"
        aria-hidden="true"
      >
        <Image
          src="/school-esquel.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className="scale-105 object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background/40 md:bg-gradient-to-r md:to-transparent" />
      </motion.div>

      {/* Resplandores sutiles: el horizonte patagónico */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-brand-green/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-brand-blue/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-6 lg:px-12">
        <div className="flex w-full flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <motion.div
            style={prefersReducedMotion ? undefined : { y: contentY }}
            className="flex flex-1 flex-col items-start gap-6 text-left"
          >
            <p className="rotate-[-2deg] rounded-full border border-white/20 bg-brand-yellow/90 px-5 py-1.5 shadow-md backdrop-blur-sm">
              <span className="text-expressive text-xl font-semibold text-brand-blue lg:text-2xl">
                {ORG.tagline}
              </span>
            </p>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-brand-green sm:text-5xl md:text-6xl lg:text-7xl">
              Mentes libres,
              <br />
              <span className="text-brand-blue">corazones solidarios.</span>
            </h1>

            <p className="max-w-xl text-base font-medium leading-relaxed text-brand-blue/80 sm:text-lg md:text-xl">
              Somos una comunidad educativa de {ORG.city}, en la Patagonia argentina, enfocada en la
              excelencia académica, una fuerte formación en inglés y el desarrollo humano integral
              desde el Nivel Inicial hasta el Secundario.
            </p>

            <div className="flex w-full flex-col gap-4 pt-4 sm:w-auto sm:flex-row">
              <Link
                href="/inscripciones"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue px-8 py-3.5 text-center text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-brand-green"
              >
                Preinscripción {admissionYear}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/propuesta-educativa/inicial"
                className="inline-flex items-center justify-center rounded-full border border-brand-blue/15 bg-white/70 px-8 py-3.5 text-center text-lg font-bold text-brand-blue shadow-sm backdrop-blur-sm transition-all hover:bg-white"
              >
                Conocé los niveles
              </Link>
            </div>
          </motion.div>

          {/* Isotipo en escritorio */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            className="relative hidden h-72 w-72 flex-none items-center justify-center lg:flex xl:h-96 xl:w-96"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-full bg-brand-blue/5 blur-3xl" />
            <div className="relative z-10 h-full w-full rounded-full border border-white/30 bg-white/20 p-10 shadow-2xl backdrop-blur-[2px]">
              <Logo className="text-brand-blue drop-shadow-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
