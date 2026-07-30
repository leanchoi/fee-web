import { cn } from "@/lib/utils";

/**
 * Isotipo de la Fundación, como SVG en línea.
 *
 * El header y el hero apuntaban a `/logo.svg`, que no existe en el repositorio:
 * en cada carga se mostraba el ícono de imagen rota junto al nombre del colegio.
 * Al ser un componente, el logo viaja con el HTML (sin pedido extra, sin salto
 * de layout) y no puede volver a faltar.
 *
 * La forma toma dos ideas del ideario: un libro abierto y, sobre él, la silueta
 * de los cerros de Esquel.
 */
export function Logo({ className, title = "Fundación Educativa Esquel" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("h-full w-full", className)}
    >
      {/* Anillo institucional */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" />

      {/* Cordillera: el horizonte patagónico */}
      <path
        d="M14 34 L23 20 L29 28 L36 15 L44 27 L50 34 Z"
        className="fill-brand-green"
      />
      <path d="M36 15 L40 21 L36.5 21.5 Z" fill="#fff" opacity="0.85" />
      <path d="M23 20 L26 24.5 L23.5 25 Z" fill="#fff" opacity="0.85" />

      {/* Libro abierto: las dos escuelas de la Fundación */}
      <path
        d="M10 38 C18 35 26 35 32 38 C38 35 46 35 54 38 L54 48 C46 45 38 45 32 48 C26 45 18 45 10 48 Z"
        className="fill-brand-blue"
      />
      <path d="M32 38 L32 48" stroke="#fff" strokeWidth="1.5" opacity="0.5" />

      {/* Acento: el compromiso de las familias */}
      <circle cx="32" cy="53.5" r="3" className="fill-brand-yellow" />
    </svg>
  );
}

/**
 * Logo con el nombre institucional. Se usa en el header y en el footer para
 * que la marca se escriba igual en los dos lugares.
 */
export function LogoLockup({
  className,
  variant = "light",
}: {
  className?: string;
  /** `light` para fondos claros, `dark` para el footer azul. */
  variant?: "light" | "dark";
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative block h-10 w-10 shrink-0 rounded-full p-1 lg:h-12 lg:w-12",
          variant === "light" ? "bg-white text-brand-blue" : "bg-white/10 text-white"
        )}
      >
        <Logo />
      </span>
      <span className="flex flex-col">
        <span
          className={cn(
            "text-lg font-bold leading-tight lg:text-xl",
            variant === "light" ? "text-brand-green" : "text-white"
          )}
        >
          FUNDACIÓN
        </span>
        <span
          className={cn(
            "text-xs font-semibold leading-none tracking-wider lg:text-sm",
            variant === "light" ? "text-brand-blue/80" : "text-brand-lightblue"
          )}
        >
          EDUCATIVA ESQUEL
        </span>
      </span>
    </span>
  );
}
