import Link from "next/link";
import { Mail, Phone, MapPin, Lock } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-blue text-white pt-16 pb-8 border-t-[8px] border-brand-yellow">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Col 1 */}
          <div className="flex flex-col gap-4 relative z-10">
            <div>
              <span className="text-xl font-bold text-white leading-tight block">
                FUNDACIÓN
              </span>
              <span className="text-sm font-semibold text-brand-lightblue tracking-wider">
                EDUCATIVA ESQUEL
              </span>
            </div>
            <p className="text-white/80 text-sm mt-2 leading-relaxed max-w-xs">
              Formamos mentes libres y corazones solidarios. Comprometidos con el desarrollo integral desde la Patagonia para el mundo.
            </p>
            <div className="flex gap-4 mt-2">
              <a 
                href="https://www.facebook.com/fundacioneducativaesquel/?locale=es_LA" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/60 hover:text-brand-yellow transition-colors p-1"
                title="Facebook Oficial"
                aria-label="Facebook Oficial"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/fundacioneducativaesquel/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/60 hover:text-brand-yellow transition-colors p-1"
                title="Instagram Oficial"
                aria-label="Instagram Oficial"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-4 relative z-10">
            <h4 className="text-lg font-bold text-brand-yellow">Propuesta</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              <li>
                <Link href="/propuesta-educativa/inicial" className="hover:text-white transition-colors">
                  Nivel Inicial
                </Link>
              </li>
              <li>
                <Link href="/propuesta-educativa/primario" className="hover:text-white transition-colors">
                  Nivel Primario
                </Link>
              </li>
              <li>
                <Link href="/propuesta-educativa/secundario" className="hover:text-white transition-colors">
                  Nivel Secundario
                </Link>
              </li>
              <li>
                <Link href="/ingles" className="hover:text-white transition-colors">
                  Programa de Inglés
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-4 relative z-10">
            <h4 className="text-lg font-bold text-brand-yellow">Institucional</h4>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              <li>
                <Link href="/quienes-somos" className="hover:text-white transition-colors">
                  Nuestra Historia
                </Link>
              </li>
              <li>
                <Link href="/comunidad" className="hover:text-white transition-colors">
                  Comunidad de Familias
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Novedades y Eventos
                </Link>
              </li>
              <li>
                <Link href="/inscripciones" className="hover:text-white font-semibold text-brand-lightblue transition-colors">
                  Admisiones {currentYear + 1}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-4 relative z-10">
            <h4 className="text-lg font-bold text-brand-yellow">Contacto</h4>
            <ul className="flex flex-col gap-3 text-xs text-white/80">
              {/* Administración Central */}
              <li className="space-y-1">
                <div className="flex items-start gap-1.5 text-white font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-brand-lightblue shrink-0 mt-0.5" />
                  <span>Administración (Chacabuco 1029)</span>
                </div>
                <div className="pl-5 space-y-0.5 text-[11px] text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-brand-lightblue shrink-0" />
                    <span>(02945) 456053</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-brand-lightblue shrink-0" />
                    <a href="mailto:escuelafeesquel@gmail.com" className="hover:text-white transition-colors">escuelafeesquel@gmail.com</a>
                  </div>
                </div>
              </li>

              {/* Inicial y Primaria */}
              <li className="space-y-1 pt-1.5 border-t border-white/10">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Inicial & Primaria (Esc. N° 1030)</span>
                </div>
                <div className="pl-3 text-[11px] text-white/70 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-brand-lightblue shrink-0" />
                  <a href="mailto:equipodirectivo1030@gmail.com" className="hover:text-white transition-colors">equipodirectivo1030@gmail.com</a>
                </div>
              </li>

              {/* Secundaria */}
              <li className="space-y-1 pt-1.5 border-t border-white/10">
                <div className="flex items-start gap-1.5 text-white font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-brand-lightblue shrink-0 mt-0.5" />
                  <span>Secundaria (Esc. N° 1739 - Galina 2888)</span>
                </div>
                <div className="pl-5 space-y-0.5 text-[11px] text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-brand-lightblue shrink-0" />
                    <span>2945-404000</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-brand-lightblue shrink-0" />
                    <a href="mailto:escuela1739.fee@gmail.com" className="hover:text-white transition-colors">escuela1739.fee@gmail.com</a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/60">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <p>&copy; {currentYear} Fundación Educativa Esquel. Todos los derechos reservados.</p>
            <span className="hidden md:inline opacity-30">|</span>
            <p className="flex items-center gap-1.5">
              <span>Co-creado en comunidad por:</span>
              <a 
                href="https://www.chib.com.ar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-lightblue font-bold hover:text-brand-yellow transition-colors uppercase tracking-wider"
              >
                CHIB Usina Cultural
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto</Link>
            <span className="opacity-30">|</span>
            <Link 
              href="/admin" 
              className="text-white/40 hover:text-brand-yellow transition-colors p-1.5 rounded-full hover:bg-white/10 flex items-center justify-center" 
              title="Acceso Intranet"
              aria-label="Acceso Intranet"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
