"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Compass } from "lucide-react";

interface GalleryItem {
  id?: string;
  image: string;
  category: string;
  title: string;
  desc: string;
}

const defaultGalleryItems: GalleryItem[] = [
  {
    id: "gal-1",
    image: "/photos/fee_photo_21.jpg",
    category: "Salidas Educativas",
    title: "Exploración en los Bosques Andinos",
    desc: "Caminatas y salidas de estudio en contacto con la flora y fauna nativa de la región.",
  },
  {
    id: "gal-2",
    image: "/photos/fee_photo_12.jpg",
    category: "Inglés & Teatro",
    title: "English Concert & Drama Festival",
    desc: "Obras teatrales y musicales íntegramente en inglés sobre el escenario.",
  },
  {
    id: "gal-3",
    image: "/photos/fee_photo_24.jpg",
    category: "Campamentos & Convivencia",
    title: "Jornadas Recreativas en la Naturaleza",
    desc: "Campamentos anuales y picnics formativos para afianzar vínculos y compañerismo.",
  },
  {
    id: "gal-4",
    image: "/photos/fee_photo_07.jpg",
    category: "Identidad & Valores",
    title: "Compromiso Cívico e Institucional",
    desc: "Nuestros abanderados y escoltas portando los símbolos de la escuela y la bandera patria.",
  },
  {
    id: "gal-5",
    image: "/photos/fee_photo_14.jpg",
    category: "Comunidad de Familias",
    title: "Kermesse y Encuentros Solidarios",
    desc: "El gimnasio colmado de familias en celebraciones y proyectos cooperativos.",
  },
  {
    id: "gal-6",
    image: "/photos/fee_photo_09.jpg",
    category: "Tecnología & Innovación",
    title: "Robótica y Pensamiento Digital",
    desc: "Alumnos experimentando con proyectos digitales y herramientas informáticas en el aula.",
  },
];

export function PhotoGallerySection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<GalleryItem[]>(defaultGalleryItems);

  useEffect(() => {
    fetch("/api/admin.php?action=get_gallery")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.gallery) && data.gallery.length > 0) {
          setItems(data.gallery);
        }
      })
      .catch(() => {
        // Usa los valores por defecto si falla la petición
      });
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-brand-gray/5 border-y border-brand-gray/10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-green font-bold uppercase tracking-widest text-xs mb-2">
              <Compass className="w-4 h-4" />
              <span>Experiencias Reales</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-blue leading-tight">
              La Vida Escolar en Imágenes
            </h2>
            <p className="text-brand-foreground/75 text-base sm:text-lg max-w-2xl mt-2 font-medium">
              Momentos auténticos de aprendizaje, compañerismo y crecimiento en el entorno privilegiado de Esquel y la Patagonia.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Desplazar a la izquierda"
              className="w-12 h-12 rounded-full bg-white border border-brand-gray/15 text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Desplazar a la derecha"
              className="w-12 h-12 rounded-full bg-white border border-brand-gray/15 text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div className="container mx-auto px-6 lg:px-12">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="min-w-[300px] sm:min-w-[360px] md:min-w-[400px] snap-start bg-white rounded-[2rem] overflow-hidden border border-brand-gray/10 shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-brand-blue text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md border border-white/40">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="text-xl font-bold text-brand-blue mb-2 group-hover:text-brand-green transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-brand-foreground/75 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
