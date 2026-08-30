import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#172A45",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fundacionesquel.edu.ar"),
  title: {
    default: "Fundación Educativa Esquel | Educación Bilingüe y Valores",
    template: "%s | Fundación Educativa Esquel",
  },
  description:
    "Comunidad educativa en Esquel, Chubut. Educación integral desde Nivel Inicial, Primario hasta Secundario, con enseñanza intensiva de inglés y formación en valores.",
  keywords: [
    "Fundación Educativa Esquel",
    "Escuela Esquel",
    "Colegio Bilingüe Esquel",
    "Escuela Primaria Esquel",
    "Secundario Esquel",
    "Educación Patagonia Chubut",
    "Inscripciones Escolares Esquel"
  ],
  authors: [{ name: "Fundación Educativa Esquel" }],
  creator: "Fundación Educativa Esquel",
  publisher: "Fundación Educativa Esquel",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://fundacionesquel.edu.ar/",
    siteName: "Fundación Educativa Esquel",
    title: "Fundación Educativa Esquel | Educación Bilingüe y Valores",
    description:
      "Más que una escuela, una comunidad comprometida con el futuro. Formamos mentes libres y corazones solidarios bajo un ideario de excelencia en la Patagonia.",
    images: [
      {
        url: "/og-banner-v2.jpg",
        width: 1200,
        height: 630,
        alt: "Fundación Educativa Esquel - Comunidad Educativa",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fundación Educativa Esquel | Educación Bilingüe y Valores",
    description:
      "Comunidad educativa comprometida con el futuro y la excelencia en Esquel, Chubut.",
    images: ["/og-banner-v2.jpg"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <meta property="og:image" content="https://fundacionesquel.edu.ar/og-banner-v2.jpg" />
        <meta property="og:image:secure_url" content="https://fundacionesquel.edu.ar/og-banner-v2.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Fundación Educativa Esquel" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=JSON.parse(sessionStorage.getItem('fee_admissions_mode')||'{}');if(c.mode&&(Date.now()-c.t)<300000){document.documentElement.dataset.admissions=c.mode;}}catch(e){}})();`,
          }}
        />
      </head>
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
