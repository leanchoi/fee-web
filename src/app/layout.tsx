import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fundación Educativa Esquel - Educando con Valores",
  description:
    "Más que una escuela, una comunidad comprometida con el futuro. Formamos mentes libres y corazones solidarios bajo un ideario de excelencia institucional.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={cn(
          montserrat.variable,
          "font-sans min-h-screen flex flex-col selection:bg-brand-yellow selection:text-brand-blue overflow-x-hidden w-full"
        )}
      >
        <div id="root-portal" className="relative flex flex-col min-h-screen w-full overflow-x-hidden">
          <Navbar />
          <main className="flex-1 w-full overflow-x-hidden">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
