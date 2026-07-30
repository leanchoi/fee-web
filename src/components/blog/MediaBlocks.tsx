"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaBlocksProps {
  layout: "single" | "carousel" | "slider";
  images: string[];
  autoplay?: boolean;
}

export function MediaBlocks({ layout, images, autoplay = false }: MediaBlocksProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if ((layout === "slider" || autoplay) && images.length > 1) {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [layout, autoplay, images.length]);

  if (!images || images.length === 0) return null;

  if (layout === "single" || images.length === 1) {
    return (
      <div className="w-full rounded-2xl overflow-hidden bg-brand-gray/10 my-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="Post image block" className="w-full max-h-[500px] object-cover" />
      </div>
    );
  }

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-brand-gray/10 my-8 shadow-md relative group aspect-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={images[index]} 
        alt={`Post slide ${index + 1}`} 
        className="w-full h-full object-cover transition-all duration-500" 
      />

      {/* Navigation Controls */}
      <button 
        type="button"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-brand-blue/80 hover:bg-brand-blue text-white rounded-full shadow-lg hover:scale-105 transition-all z-20 border border-white/20"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        type="button"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-brand-blue/80 hover:bg-brand-blue text-white rounded-full shadow-lg hover:scale-105 transition-all z-20 border border-white/20"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? "bg-brand-yellow w-5" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
