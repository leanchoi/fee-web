import { Hero } from "@/components/home/Hero";
import { PropuestaSection } from "@/components/home/PropuestaSection";
import { BentoInfo } from "@/components/home/BentoInfo";
import { NivelesCards } from "@/components/home/NivelesCards";
import { BilingualSection } from "@/components/home/BilingualSection";
import { NewsPreview } from "@/components/home/NewsPreview";
import { CtaSection } from "@/components/home/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <PropuestaSection />
      <BentoInfo />
      <NivelesCards />
      <BilingualSection />
      <NewsPreview />
      <CtaSection />
    </>
  );
}
