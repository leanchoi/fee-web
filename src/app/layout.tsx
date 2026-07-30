import type { Metadata } from "next";
import { Montserrat, Caveat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { MotionProvider } from "@/components/MotionProvider";
import { Footer } from "@/components/layout/Footer";
import { CAMPUSES, ORG, SITE_URL, SOCIAL } from "@/lib/site";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

/**
 * Tipografía manuscrita para las volantas expresivas ("Educando con valores").
 *
 * El CSS declaraba `@font-face` para `/fonts/Halimum.woff2`, un archivo que no
 * está en el repositorio: el navegador fallaba la descarga y caía en `cursive`,
 * que cada sistema resuelve distinto. next/font descarga la fuente en el build
 * y la sirve desde el propio dominio, así que también cumple con la CSP.
 */
const handwriting = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["500", "700"],
  display: "swap",
});

const description =
  "Comunidad educativa de Esquel, Chubut. Nivel Inicial, Primario y Secundario con inglés intensivo, certificaciones Cambridge y una gestión sostenida por las familias.";

export const metadata: Metadata = {
  // Necesario para que Next resuelva las URLs absolutas de Open Graph y del
  // canonical a partir de rutas relativas.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${ORG.legalName} — ${ORG.claim}`,
    template: `%s | ${ORG.legalName}`,
  },
  description,
  applicationName: ORG.legalName,
  authors: [{ name: ORG.legalName }],
  keywords: [
    "colegio Esquel",
    "escuela bilingüe Esquel",
    "Fundación Educativa Esquel",
    "inscripciones Esquel",
    "Cambridge English Chubut",
    "educación Patagonia",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: ORG.legalName,
    title: `${ORG.legalName} — ${ORG.claim}`,
    description,
    images: [
      {
        url: "/school-esquel.jpg",
        alt: `Sede de la ${ORG.legalName} en ${ORG.city}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${ORG.legalName} — ${ORG.claim}`,
    description,
    images: ["/school-esquel.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
};

/**
 * Datos estructurados de la institución.
 *
 * Permite que los buscadores muestren dirección, teléfono y niveles educativos
 * en los resultados locales, que es cómo la mayoría de las familias de Esquel
 * llega a la página.
 */
function organizationSchema() {
  const addresses = CAMPUSES.map((campus) => ({
    "@type": "PostalAddress",
    streetAddress: campus.street,
    addressLocality: ORG.city,
    addressRegion: ORG.province,
    addressCountry: "AR",
  }));

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: ORG.legalName,
    alternateName: ORG.shortName,
    url: SITE_URL,
    image: `${SITE_URL}/school-esquel.jpg`,
    description,
    foundingDate: "2005",
    slogan: ORG.claim,
    sameAs: SOCIAL.map((social) => social.href),
    address: addresses,
    contactPoint: CAMPUSES.map((campus) => ({
      "@type": "ContactPoint",
      contactType: campus.levels,
      telephone: campus.phoneHref,
      email: campus.email,
      areaServed: ORG.city,
      availableLanguage: ["Spanish", "English"],
    })),
    department: CAMPUSES.map((campus, index) => ({
      "@type": "EducationalOrganization",
      name: `${campus.name} — ${campus.levels}`,
      address: addresses[index],
    })),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className="scroll-smooth">
      <head>
        {/*
          Red de seguridad sin JavaScript.

          Las secciones animadas con framer-motion se renderizan en el servidor
          con `opacity: 0` en línea y sólo se revelan cuando el JavaScript monta
          el observador de scroll. Si el script falla o tarda —algo probable en
          conexiones rurales—, el contenido queda invisible. Esta regla sólo se
          aplica cuando el navegador no ejecuta JavaScript.
        */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<style>[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}</style>`,
          }}
        />
      </head>
      <body
        className={cn(
          montserrat.variable,
          handwriting.variable,
          "flex min-h-screen w-full flex-col overflow-x-hidden font-sans"
        )}
      >
        {/* Permite saltar la navegación al llegar con teclado o lector de pantalla. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-blue focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Saltar al contenido principal
        </a>

        <MotionProvider>
          <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            <Navbar />
            <main id="contenido" className="w-full flex-1 overflow-x-hidden">
              {children}
            </main>
            <Footer />
          </div>
        </MotionProvider>

        <script
          type="application/ld+json"
          // Contenido generado en el servidor a partir de constantes propias.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
      </body>
    </html>
  );
}
