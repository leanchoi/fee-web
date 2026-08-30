"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdmissionYear } from "@/lib/dateUtils";

const links = [
  { name: "Institucional", href: "/quienes-somos" },
  { name: "Niveles", href: "/propuesta-educativa/inicial" },
  { name: "Inglés", href: "/ingles" },
  { name: "Comunidad", href: "/comunidad" },
  { name: "Novedades", href: "/blog" },
  { name: "Contacto", href: "/contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admissionsMode, setAdmissionsMode] = useState<"reinscripciones" | "preinscripciones" | "cerrado">("reinscripciones");
  const pathname = usePathname();

  useEffect(() => {
    // 1. Lectura inmediata de cache local para 0ms flash
    try {
      const cached = JSON.parse(sessionStorage.getItem("fee_admissions_mode") || "{}");
      if (cached.mode) {
        setAdmissionsMode(cached.mode);
      }
    } catch {}

    // 2. Fetch fresco a settings.php
    fetch("/api/settings.php", { credentials: "same-origin" })
      .then(res => res.json())
      .then(data => {
        if (data && data.mode) {
          setAdmissionsMode(data.mode);
          sessionStorage.setItem("fee_admissions_mode", JSON.stringify({ mode: data.mode, t: Date.now() }));
          document.documentElement.dataset.admissions = data.mode;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cierra menú móvil al navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const ctaLabel = admissionsMode === "preinscripciones" 
    ? "Preinscripciones 2027" 
    : (admissionsMode === "reinscripciones" ? "Reinscripciones 2027" : "Inscripciones");
  
  const ctaHref = admissionsMode === "preinscripciones"
    ? "/preinscripciones"
    : (admissionsMode === "reinscripciones" ? "/reinscripciones" : "/inscripciones");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        mobileMenuOpen
          ? "bg-[#172A45] py-3 shadow-lg"
          : (scrolled || pathname !== "/")
          ? "bg-white/95 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 z-50 group">
          <div className="relative w-10 h-10 lg:w-12 lg:h-12 overflow-hidden rounded-full border border-brand-blue/10 bg-white p-1">
            <img 
              src="/logo.png" 
              alt="Logo Fundación Educativa Esquel" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-lg lg:text-xl font-bold leading-tight transition-colors",
              mobileMenuOpen ? "text-white" : "text-brand-green group-hover:text-brand-blue"
            )}>
              FUNDACIÓN
            </span>
            <span className={cn(
              "text-xs lg:text-sm font-semibold tracking-wider leading-none",
              mobileMenuOpen ? "text-brand-yellow" : "text-brand-blue opacity-80"
            )}>
              EDUCATIVA ESQUEL
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-semibold transition-colors duration-200 hover:text-brand-green relative group",
                pathname.startsWith(link.href) ? "text-brand-green" : "text-brand-blue"
              )}
            >
              {link.name}
              <span
                className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-brand-green transition-all duration-300",
                  pathname.startsWith(link.href) ? "w-full" : "w-0 group-hover:w-full"
                )}
              />
            </Link>
          ))}
          <div className="min-w-[190px] flex justify-end">
            <Link
              href={ctaHref}
              className="bg-brand-green text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-brand-green/20 hover:bg-brand-blue hover:shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              {ctaLabel}
            </Link>
          </div>
          <Link
            href="/admin"
            className="text-brand-blue/30 hover:text-brand-blue transition-colors p-2.5 rounded-full flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
            title="Acceso Intranet"
            aria-label="Acceso administrativo"
          >
            <Lock size={15} />
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className={cn(
            "lg:hidden z-50 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow",
            mobileMenuOpen ? "text-white hover:text-brand-yellow" : "text-brand-blue"
          )}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav Overlay (Solid Opaque Background) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#172A45] z-40 flex flex-col pt-28 px-8 pb-12 lg:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-5 items-center w-full my-auto">
              {links.map((l, i) => (
                <motion.div
                  key={l.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-full text-center"
                >
                  <Link
                    href={l.href}
                    className={cn(
                      "text-2xl font-bold transition-colors hover:text-brand-yellow block py-2 px-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow",
                      pathname === l.href ? "text-brand-yellow" : "text-white"
                    )}
                  >
                    {l.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: links.length * 0.05 }}
                className="w-full mt-4"
              >
                <Link
                  href="/inscripciones"
                  className="block w-full text-center bg-brand-yellow text-brand-blue py-3.5 rounded-full text-lg font-bold shadow-lg shadow-brand-yellow/15 hover:bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Inscripciones {getAdmissionYear()}
                </Link>
              </motion.div>
            </nav>

            {/* Mobile Menu Footer Info */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-auto w-full border-t border-white/15 pt-8 flex flex-col items-center gap-4 text-center text-white/75 text-xs"
            >
              <div className="flex gap-4 items-center">
                <a 
                  href="https://www.facebook.com/fundacioneducativaesquel/?locale=es_LA" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-yellow transition-colors py-1 px-2 font-medium"
                >
                  Facebook
                </a>
                <a 
                  href="https://www.instagram.com/fundacioneducativaesquel/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-brand-yellow transition-colors py-1 px-2 font-medium"
                >
                  Instagram
                </a>
                <Link 
                  href="/admin" 
                  className="text-white/40 hover:text-brand-yellow transition-colors flex items-center justify-center p-2 rounded-full min-w-[36px] min-h-[36px]" 
                  title="Acceso Intranet"
                  aria-label="Acceso Intranet"
                >
                  <Lock size={14} />
                </Link>
              </div>
              <p className="opacity-80">Chacabuco 1029 / Gob. Galina 2888 — Esquel, Chubut</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
