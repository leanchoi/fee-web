/**
 * Datos institucionales de la Fundación Educativa Esquel.
 *
 * Fuente única de verdad. Las direcciones, teléfonos y años estaban repetidos
 * y en conflicto entre el header, el footer y la página de contacto (por
 * ejemplo, "Chacabuco 1314 / Gob. Galina 950" en el menú móvil contra
 * "Chacabuco 1029" y "Gobernador Galina 2888" en el resto del sitio).
 * Cualquier corrección de un dato de contacto se hace acá y se propaga.
 */

/** Año de constitución de la Fundación. */
export const FOUNDING_YEAR = 2005;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.fundacioneducativaesquel.edu.ar";

export const ORG = {
  legalName: "Fundación Educativa Esquel",
  shortName: "FEE",
  tagline: "Educando con valores",
  claim: "Mentes libres, corazones solidarios",
  city: "Esquel",
  province: "Chubut",
  country: "Argentina",
} as const;

export interface Campus {
  /** Identificador corto para claves de React. */
  id: string;
  /** Nombre oficial de la escuela. */
  name: string;
  /** Niveles que funcionan en la sede. */
  levels: string;
  street: string;
  phone: string;
  /** Teléfono en formato marcable (`tel:`). */
  phoneHref: string;
  email: string;
  /** Correo del equipo directivo, cuando difiere del institucional. */
  directorsEmail?: string;
}

export const CAMPUSES: readonly Campus[] = [
  {
    id: "1030",
    name: "Escuela N° 1030",
    levels: "Nivel Inicial y Primario",
    street: "Chacabuco 1029",
    phone: "(02945) 456053",
    phoneHref: "+542945456053",
    email: "escuelafeesquel@gmail.com",
    directorsEmail: "equipodirectivo1030@gmail.com",
  },
  {
    id: "1739",
    name: "Escuela N° 1739",
    levels: "Nivel Secundario",
    street: "Gobernador Galina 2888",
    phone: "(02945) 404000",
    phoneHref: "+542945404000",
    email: "escuela1739.fee@gmail.com",
  },
] as const;

/** Sede administrativa: la escuela de Inicial y Primario. */
export const MAIN_CAMPUS = CAMPUSES[0];

export const OFFICE_HOURS = "Lunes a jueves de 8:00 a 13:00 h y viernes de 8:00 a 16:00 h";

export const SOCIAL = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/fundacioneducativaesquel/?locale=es_LA",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/fundacioneducativaesquel/",
  },
] as const;

export const CREDIT = {
  name: "CHIB Usina Cultural",
  href: "https://www.chib.com.ar",
} as const;

/** Dirección completa de una sede, para mostrar en una línea. */
export function fullAddress(campus: Campus): string {
  return `${campus.street}, ${ORG.city}, ${ORG.province}`;
}

/**
 * Años de trayectoria, calculados en vez de escritos a mano.
 *
 * El texto fijo "Más de 30 años caminando juntos" contradecía la fundación en
 * 2005 que se afirma en la home y en Quiénes Somos.
 */
export function yearsOfHistory(): number {
  return new Date().getFullYear() - FOUNDING_YEAR;
}
