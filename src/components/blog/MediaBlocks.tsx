"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaBlocksProps {
  layout: "single" | "carousel" | "slider";
  images: string[];
  autoplay?: boolean;
}

const INTERVAL_MS = 5000;

export function MediaBlocks({ layout, images, autoplay = false }: MediaBlocksProps) {
  const [index, setIndex] = useState(0);
  const shouldAutoplay = (layout === "slider" || autoplay) && images.length > 1;
  const [playing, setPlaying] = useState(shouldAutoplay);

  useEffect(() => {
    if (!playing || images.length < 2) return;

    // Respeta la preferencia del sistema: un carrusel que avanza solo puede
    // ser un obstáculo para quien necesita más tiempo de lectura.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [playing, images.length]);

  if (!images || images.length === 0) return null;

  if (layout === "single" || images.length === 1) {
    return (
      <figure className="my-8 w-full overflow-hidden rounded-2xl bg-brand-gray/10 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt=""
          loading="lazy"
          className="max-h-[500px] w-full object-cover"
        />
      </figure>
    );
  }

  const goTo = (next: number) => {
    setIndex(((next % images.length) + images.length) % images.length);
    // Cualquier interacción manual detiene el avance automático: si no, la
    // imagen elegida se va sola a los pocos segundos.
    setPlaying(false);
  };

  return (
    <figure
      className="group relative my-8 aspect-video w-full overflow-hidden rounded-2xl bg-brand-gray/10 shadow-md"
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Galería de ${images.length} imágenes`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Imagen ${index + 1} de ${images.length}`}
        loading="lazy"
        className="h-full w-full object-cover transition-all duration-500"
      />

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-brand-blue/85 p-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-blue"
        aria-label="Imagen anterior"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-brand-blue/85 p-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-blue"
        aria-label="Imagen siguiente"
      >
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Control de reproducción: WCAG pide poder detener cualquier movimiento
          automático que dure más de cinco segundos. */}
      {shouldAutoplay && (
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-brand-blue/85 p-2 text-white shadow-lg transition-colors hover:bg-brand-blue"
          aria-label={playing ? "Pausar la galería" : "Reanudar la galería"}
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}

      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
        {images.map((image, position) => (
          <button
            key={image}
            type="button"
            onClick={() => goTo(position)}
            aria-label={`Ir a la imagen ${position + 1}`}
            aria-current={position === index ? "true" : undefined}
            className="p-1.5"
          >
            <span
              className={cn(
                "block h-2.5 rounded-full transition-all",
                position === index ? "w-5 bg-brand-yellow" : "w-2.5 bg-white/60"
              )}
            />
          </button>
        ))}
      </div>

      {/* Anuncio para lectores de pantalla del cambio de imagen. */}
      <span className="sr-only" aria-live="polite">
        Imagen {index + 1} de {images.length}
      </span>
    </figure>
  );
}
