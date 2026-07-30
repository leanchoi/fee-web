import { Suspense } from "react";
import { Hero } from "@/components/home/Hero";
import { PropuestaSection } from "@/components/home/PropuestaSection";
import { BentoInfo } from "@/components/home/BentoInfo";
import { NivelesCards } from "@/components/home/NivelesCards";
import { BilingualSection } from "@/components/home/BilingualSection";
import { NewsPreview } from "@/components/home/NewsPreview";
import { CtaSection } from "@/components/home/CtaSection";

// La home lista las últimas novedades: se revalida con la misma frecuencia
// que el blog para que una nota recién publicada aparezca sin redesplegar.
export const revalidate = 60;

function NewsPreviewSkeleton() {
  return (
    <section className="bg-white py-24" aria-hidden="true">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12 h-12 w-80 max-w-full rounded-xl bg-brand-gray/10" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-64 rounded-3xl bg-brand-gray/10" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <PropuestaSection />
      <BentoInfo />
      <NivelesCards />
      <BilingualSection />
      {/* Sólo esta sección consulta la base de datos: se envuelve en Suspense
          para que el resto de la página (hero incluido) llegue en el HTML
          inicial y no espere a la consulta. */}
      <Suspense fallback={<NewsPreviewSkeleton />}>
        <NewsPreview />
      </Suspense>
      <CtaSection />
    </>
  );
}
