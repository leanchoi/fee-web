import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

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
                className="text-white/60 hover:text-brand-yellow transition-colors"
                title="Facebook Oficial"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/fundacioneducativaesquel/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/60 hover:text-brand-yellow transition-colors"
                title="Instagram Oficial"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.008 3.752.052 2.73.124 4.093 1.528 4.21 4.21.044.968.052 1.322.052 3.752 0 2.43-.008 2.784-.052 3.752-.117 2.683-1.482 4.084-4.21 4.21-.968.044-1.322.052-3.752.052-2.43 0-2.784-.008-3.752-.052-2.73-.124-4.093-1.528-4.21-4.21C2.044 14.784 2 14.43 2 12c0-2.43.008-2.784.052-3.752.117-2.68-1.482-4.084-4.21-4.21C9.216 2.008 9.57 2 12 2h.315zm0 2c-2.404 0-2.687.009-3.636.052-2.15.098-2.923.865-3.02 3.02C5.61 8.016 5.6 8.3 5.6 10.706c0 2.404.009 2.687.052 3.636.098 2.15.865 2.923 3.02 3.02.949.043 1.233.052 3.636.052 2.404 0 2.687-.009 3.636-.052 2.15-.098 2.923-.865 3.02-3.02.043-.949.052-1.233.052-3.636 0-2.404-.009-2.687-.052-3.636-.098-2.15-.865-2.923-3.02-3.02-.949-.043-1.233-.052-3.636-.052zm0 4.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zm0 2a1.75 1.75 0 110 3.5 1.75 1.75 0 010-3.5zm5.75-2.75a.9.9 0 100 1.8.9.9 0 000-1.8z" clipRule="evenodd" />
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
            <ul className="flex flex-col gap-4 text-xs text-white/80">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-lightblue shrink-0 mt-0.5" />
                <span className="leading-tight">
                  <strong>Admin / Inicial / Primaria:</strong><br />
                  Chacabuco 1029, Esquel
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-lightblue shrink-0" />
                <span>(02945) 456053</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-lightblue shrink-0" />
                <a href="mailto:escuelafeesquel@gmail.com" className="hover:text-white transition-colors">escuelafeesquel@gmail.com</a>
              </li>
              <li className="border-t border-white/10 my-1"></li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-lightblue shrink-0 mt-0.5" />
                <span className="leading-tight">
                  <strong>Sede Secundaria:</strong><br />
                  Gobernador Galina 2888
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-lightblue shrink-0" />
                <span>2945-404000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-lightblue shrink-0" />
                <a href="mailto:escuela1739.fee@gmail.com" className="hover:text-white transition-colors">escuela1739.fee@gmail.com</a>
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
            <Link href="/contacto" className="hover:text-white transition-colors">Contacto Completo</Link>
            <span className="opacity-30">|</span>
            <Link href="/admin" className="hover:text-white transition-colors">Acceso Restringido</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
