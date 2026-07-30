import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getAdmissionYear } from "@/lib/dateUtils";
import { CAMPUSES, CREDIT, ORG, SOCIAL } from "@/lib/site";
import { LogoLockup } from "@/components/brand/Logo";

const SOCIAL_ICONS: Record<string, string> = {
  Facebook:
    "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  Instagram:
    "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07zm0 1.802c-3.15 0-3.522.012-4.766.069-1.023.047-1.72.216-2.234.73-.514.513-.683 1.21-.73 2.233-.057 1.244-.069 1.616-.069 4.766s.012 3.522.069 4.766c.047 1.023.216 1.72.73 2.234.513.514 1.21.683 2.234.73 1.244.057 1.616.069 4.766.069s3.522-.012 4.766-.069c1.023-.047 1.72-.216 2.233-.73.514-.514.683-1.21.73-2.234.057-1.244.069-1.616.069-4.766s-.012-3.522-.069-4.766c-.047-1.023-.216-1.72-.73-2.233-.513-.514-1.21-.683-2.233-.73-1.244-.057-1.616-.069-4.766-.069zm0 3.064a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
};

export function Footer() {
  const currentYear = new Date().getFullYear();
  // El footer anunciaba `currentYear + 1` mientras el resto del sitio usaba
  // `getAdmissionYear()`: en enero los dos números no coincidían.
  const admissionYear = getAdmissionYear();

  return (
    <footer className="border-t-[8px] border-brand-yellow bg-brand-blue pb-8 pt-16 text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Identidad */}
          <div className="relative z-10 flex flex-col gap-4">
            <LogoLockup variant="dark" />
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/80">
              Formamos mentes libres y corazones solidarios. Comprometidos con el desarrollo
              integral desde la Patagonia para el mundo.
            </p>
            <div className="mt-2 flex gap-4">
              {SOCIAL.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 transition-colors hover:text-brand-yellow"
                  aria-label={`${social.name} de ${ORG.legalName}`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d={SOCIAL_ICONS[social.name]} clipRule="evenodd" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Propuesta */}
          <nav className="relative z-10 flex flex-col gap-4" aria-labelledby="footer-propuesta">
            <h2 id="footer-propuesta" className="text-lg font-bold text-brand-yellow">
              Propuesta
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              <li>
                <Link href="/propuesta-educativa/inicial" className="hover:text-white">
                  Nivel Inicial
                </Link>
              </li>
              <li>
                <Link href="/propuesta-educativa/primario" className="hover:text-white">
                  Nivel Primario
                </Link>
              </li>
              <li>
                <Link href="/propuesta-educativa/secundario" className="hover:text-white">
                  Nivel Secundario
                </Link>
              </li>
              <li>
                <Link href="/ingles" className="hover:text-white">
                  Programa de Inglés
                </Link>
              </li>
            </ul>
          </nav>

          {/* Institucional */}
          <nav className="relative z-10 flex flex-col gap-4" aria-labelledby="footer-institucional">
            <h2 id="footer-institucional" className="text-lg font-bold text-brand-yellow">
              Institucional
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-white/80">
              <li>
                <Link href="/quienes-somos" className="hover:text-white">
                  Nuestra Historia
                </Link>
              </li>
              <li>
                <Link href="/comunidad" className="hover:text-white">
                  Comunidad de Familias
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Novedades y Eventos
                </Link>
              </li>
              <li>
                <Link
                  href="/inscripciones"
                  className="font-semibold text-brand-lightblue hover:text-white"
                >
                  Admisiones {admissionYear}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contacto: una entrada por sede, desde la configuración institucional */}
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-brand-yellow">Contacto</h2>
            <ul className="flex flex-col gap-5 text-xs text-white/80">
              {CAMPUSES.map((campus) => (
                <li key={campus.id} className="flex flex-col gap-2">
                  <span className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-lightblue" aria-hidden="true" />
                    <span className="leading-tight">
                      <strong className="font-semibold text-white">{campus.name}</strong>
                      <br />
                      {campus.levels}
                      <br />
                      <address className="not-italic">{campus.street}, {ORG.city}</address>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 pl-6">
                    <Phone className="h-4 w-4 shrink-0 text-brand-lightblue" aria-hidden="true" />
                    <a href={`tel:${campus.phoneHref}`} className="hover:text-white">
                      {campus.phone}
                    </a>
                  </span>
                  <span className="flex items-center gap-2 pl-6">
                    <Mail className="h-4 w-4 shrink-0 text-brand-lightblue" aria-hidden="true" />
                    <a href={`mailto:${campus.email}`} className="break-all hover:text-white">
                      {campus.email}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pie */}
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 text-xs text-white/70 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <p>
              &copy; {currentYear} {ORG.legalName}. Todos los derechos reservados.
            </p>
            <span className="hidden opacity-30 md:inline" aria-hidden="true">
              |
            </span>
            <p className="flex items-center gap-1.5">
              <span>Co-creado en comunidad por:</span>
              <a
                href={CREDIT.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold uppercase tracking-wider text-brand-lightblue transition-colors hover:text-brand-yellow"
              >
                {CREDIT.name}
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contacto" className="hover:text-white">
              Contacto completo
            </Link>
            <span className="opacity-30" aria-hidden="true">
              |
            </span>
            <Link href="/admin" prefetch={false} className="hover:text-white">
              Intranet
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
