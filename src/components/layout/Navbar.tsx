"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdmissionYear } from "@/lib/dateUtils";
import { CAMPUSES, ORG, SOCIAL } from "@/lib/site";

/**
 * `match` define qué prefijo de ruta marca el ítem como activo.
 *
 * Antes se comparaba con `href`, así que "Niveles" (que apunta a
 * `/propuesta-educativa/inicial`) dejaba de estar resaltado al navegar a
 * Primario o Secundario: la persona perdía la referencia de dónde estaba.
 */
const links = [
  { name: "Institucional", href: "/quienes-somos", match: "/quienes-somos" },
  { name: "Niveles", href: "/propuesta-educativa/inicial", match: "/propuesta-educativa" },
  { name: "Inglés", href: "/ingles", match: "/ingles" },
  { name: "Comunidad", href: "/comunidad", match: "/comunidad" },
  { name: "Novedades", href: "/blog", match: "/blog" },
  { name: "Contacto", href: "/contacto", match: "/contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const admissionYear = getAdmissionYear();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cierra el menú móvil al navegar.
  // Se ajusta durante el render en lugar de dentro de un efecto: hacerlo en un
  // efecto provoca un render en cascada (el menú se pinta abierto en la ruta
  // nueva y recién después se cierra).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  // Con el menú abierto: Escape lo cierra y el fondo no se desplaza.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        // Devuelve el foco al botón que abrió el menú.
        toggleRef.current?.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const isActive = (match: string) => pathname === match || pathname.startsWith(`${match}/`);

  return (
    <header
      className={cn(
        "fixed left-0 top-0 z-50 w-full transition-all duration-300",
        scrolled || pathname !== "/"
          ? "bg-white/90 py-2 shadow-sm backdrop-blur-md"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-6 lg:px-12">
        <Link
          href="/"
          className="z-50 flex items-center gap-3 rounded-xl"
          aria-label={`${ORG.legalName} — Inicio`}
        >
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-brand-blue/10 bg-white p-1 lg:h-12 lg:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt=""
              className="h-full w-full object-contain"
            />
          </span>
          <span className="flex flex-col">
            {/* Con el menú móvil abierto el fondo pasa a azul oscuro: el
                texto cambia a blanco para no quedar ilegible. */}
            <span
              className={cn(
                "text-lg font-bold leading-tight transition-colors lg:text-xl",
                mobileMenuOpen ? "text-white" : "text-brand-green"
              )}
            >
              FUNDACIÓN
            </span>
            <span
              className={cn(
                "text-xs font-semibold leading-none tracking-wider transition-colors lg:text-sm",
                mobileMenuOpen ? "text-brand-lightblue" : "text-brand-blue/80"
              )}
            >
              EDUCATIVA ESQUEL
            </span>
          </span>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
          {links.map((link) => {
            const active = isActive(link.match);
            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative text-sm font-semibold transition-colors duration-200 hover:text-brand-green",
                  active ? "text-brand-green" : "text-brand-blue"
                )}
              >
                {link.name}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-brand-green transition-all duration-300",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
          <Link
            href="/inscripciones"
            className="rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-green/20 transition-all hover:-translate-y-0.5 hover:bg-brand-blue hover:shadow-lg"
          >
            Inscripciones {admissionYear}
          </Link>
          <Link
            href="/admin"
            prefetch={false}
            className="flex shrink-0 items-center justify-center rounded-full p-2.5 text-brand-blue/40 transition-colors hover:text-brand-blue"
            aria-label="Acceso a la intranet institucional"
          >
            <Lock size={15} aria-hidden="true" />
          </Link>
        </nav>

        {/* Botón del menú móvil */}
        <button
          ref={toggleRef}
          type="button"
          className={cn(
            "z-50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2.5 transition-colors lg:hidden",
            mobileMenuOpen ? "text-white" : "text-brand-blue"
          )}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú de navegación"}
          aria-expanded={mobileMenuOpen}
          aria-controls="menu-movil"
        >
          {mobileMenuOpen ? (
            <X size={28} aria-hidden="true" />
          ) : (
            <Menu size={28} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-brand-blue/95 px-8 pb-12 pt-28 backdrop-blur-lg lg:hidden"
          >
            <nav
              className="my-auto flex w-full flex-col items-center gap-5"
              aria-label="Navegación principal"
            >
              {links.map((link, index) => {
                const active = isActive(link.match);
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full text-center"
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-4 py-2 text-2xl font-bold transition-colors hover:text-brand-yellow",
                        active ? "text-brand-yellow" : "text-white"
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: links.length * 0.05 }}
                className="mt-4 w-full"
              >
                <Link
                  href="/inscripciones"
                  className="block w-full rounded-full bg-brand-yellow py-3.5 text-center text-lg font-bold text-brand-blue shadow-lg shadow-brand-yellow/15 transition-all hover:bg-white"
                >
                  Inscripciones {admissionYear}
                </Link>
              </motion.div>
            </nav>

            {/* Datos de contacto al pie del menú */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-auto flex w-full flex-col items-center gap-4 border-t border-white/10 pt-8 text-center text-xs text-white/70"
            >
              <div className="flex items-center gap-4">
                {SOCIAL.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 transition-colors hover:text-brand-yellow"
                  >
                    {social.name}
                  </a>
                ))}
                <Link
                  href="/admin"
                  prefetch={false}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full p-2 text-white/70 transition-colors hover:text-brand-yellow"
                  aria-label="Acceso a la intranet institucional"
                >
                  <Lock size={14} aria-hidden="true" />
                </Link>
              </div>
              {/* Direcciones tomadas de la configuración institucional: el menú
                  mostraba "Chacabuco 1314 / Gob. Galina 950", que no coincidía
                  con ninguna de las sedes reales. */}
              <address className="not-italic leading-relaxed">
                {CAMPUSES.map((campus) => campus.street).join(" · ")}
                <br />
                {ORG.city}, {ORG.province}
              </address>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
