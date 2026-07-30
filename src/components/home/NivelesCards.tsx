"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpenCheck, GraduationCap, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Las tarjetas apuntaban a `/nivel-inicial.png`, `/nivel-primario.png` y
 * `/nivel-secundario.png`, que no existen; ante el error cargaban una foto de
 * archivo de Unsplash. Además de sumar una dependencia externa, eso choca con
 * la política de imagen que la propia institución declara en Quiénes Somos: no
 * difundir rostros de niños y niñas. La cabecera de cada tarjeta es ahora un
 * panel gráfico con el color y el ícono del nivel.
 */
const niveles = [
  {
    title: "Nivel Inicial",
    desc: "Salas de 3, 4 y 5 años. Aprendizaje basado en el juego y la exploración.",
    detail: "Escuela N° 1030",
    icon: Smile,
    href: "/propuesta-educativa/inicial",
    ink: "text-brand-yellow-dark",
    panel: "from-brand-yellow/30 via-brand-yellow/15 to-brand-yellow/5",
    border: "hover:border-brand-yellow",
    dot: "bg-brand-yellow",
  },
  {
    title: "Nivel Primario",
    desc: "Excelencia académica con enfoque en valores e inglés intensivo.",
    detail: "Escuela N° 1030",
    icon: BookOpenCheck,
    href: "/propuesta-educativa/primario",
    ink: "text-brand-green",
    panel: "from-brand-green/25 via-brand-green/10 to-brand-green/5",
    border: "hover:border-brand-green",
    dot: "bg-brand-green",
  },
  {
    title: "Nivel Secundario",
    desc: "Orientación en Ciencias Naturales y preparación para estudios superiores.",
    detail: "Escuela N° 1739",
    icon: GraduationCap,
    href: "/propuesta-educativa/secundario",
    ink: "text-brand-blue",
    panel: "from-brand-blue/25 via-brand-blue/10 to-brand-blue/5",
    border: "hover:border-brand-blue",
    dot: "bg-brand-blue",
  },
];

export function NivelesCards() {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLUListElement>(null);

  /**
   * Deduce la tarjeta visible a partir de la posición real de los hijos.
   * El cálculo anterior asumía un ancho fijo (`clientWidth * 0.85`) que no
   * coincide con el `82vw` de las tarjetas, así que los puntos se desfasaban.
   */
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const center = container.scrollLeft + container.clientWidth / 2;
    const items = Array.from(container.children) as HTMLElement[];

    let closest = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(itemCenter - center);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });

    setActiveIdx(closest);
  }, []);

  const scrollTo = (index: number) => {
    const container = scrollRef.current;
    const item = container?.children[index] as HTMLElement | undefined;
    if (!container || !item) return;
    container.scrollTo({
      left: item.offsetLeft - (container.clientWidth - item.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  return (
    <section className="overflow-hidden bg-background py-24" aria-labelledby="niveles-title">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="text-expressive mb-2 block text-3xl text-brand-green">
            Un camino completo
          </p>
          <h2 id="niveles-title" className="mb-6 text-4xl font-bold text-brand-blue md:text-5xl">
            Del jardín a la universidad
          </h2>
          <p className="text-lg leading-relaxed text-foreground/80">
            Un acompañamiento continuo y cercano del crecimiento de cada estudiante, desde sus
            primeros pasos hasta la puerta de los estudios superiores.
          </p>
        </div>

        <ul
          ref={scrollRef}
          onScroll={handleScroll}
          className="scrollbar-none -mx-4 flex w-full snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-6 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-x-visible md:px-0 md:pb-0"
        >
          {niveles.map((nivel, index) => {
            const Icon = nivel.icon;
            return (
              <motion.li
                key={nivel.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-auto w-[82vw] shrink-0 snap-center sm:w-[360px] md:w-auto"
              >
                <Link
                  href={nivel.href}
                  className={cn(
                    "group flex h-full flex-col overflow-hidden rounded-[2rem] border border-brand-gray/10 bg-white transition-all duration-300 hover:border-transparent hover:shadow-xl",
                    nivel.border
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-40 items-center justify-center bg-gradient-to-br",
                      nivel.panel
                    )}
                    aria-hidden="true"
                  >
                    {/* Trama sutil: da textura sin recurrir a fotografías */}
                    <svg className="absolute inset-0 h-full w-full opacity-[0.07]">
                      <defs>
                        <pattern
                          id={`grid-${nivel.href}`}
                          width="24"
                          height="24"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 24 0 L 0 0 0 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#grid-${nivel.href})`} />
                    </svg>
                    <span
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-110",
                        nivel.ink
                      )}
                    >
                      <Icon className="h-8 w-8" />
                    </span>
                  </div>

                  <div className="flex flex-grow flex-col p-6 sm:p-8">
                    <p
                      className={cn(
                        "mb-1 text-xs font-bold uppercase tracking-wider",
                        nivel.ink
                      )}
                    >
                      {nivel.detail}
                    </p>
                    <h3 className="mb-4 text-2xl font-bold text-brand-blue">{nivel.title}</h3>
                    <p className="mb-8 flex-grow leading-relaxed text-foreground/70">
                      {nivel.desc}
                    </p>
                    <span
                      className={cn(
                        "flex items-center gap-2 text-sm font-bold tracking-wide",
                        nivel.ink
                      )}
                    >
                      Ver la propuesta
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {/* Indicadores del carrusel móvil.
            Eran `<div>` decorativos: mostraban la posición pero no permitían
            cambiar de tarjeta. Ahora son botones y sirven para navegar. */}
        <div className="mt-6 flex items-center justify-center gap-2.5 md:hidden">
          {niveles.map((nivel, index) => (
            <button
              key={nivel.title}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ver ${nivel.title}`}
              aria-current={activeIdx === index ? "true" : undefined}
              className="p-2"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  activeIdx === index ? "w-6 bg-brand-green" : "w-2 bg-brand-green/30"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
