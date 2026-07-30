/**
 * Ciclo lectivo al que apunta la admisión abierta.
 *
 * El ciclo escolar argentino empieza a fines de febrero o principios de marzo.
 * Hasta el 30 de enero la institución sigue recibiendo pedidos para el ciclo que
 * está por comenzar; a partir de esa fecha, las consultas ya son para el año
 * siguiente.
 *
 * Es la única fuente de este número. La página de niveles calculaba
 * `getFullYear() + 1` y el footer también, sin el corte de enero: durante todo
 * enero el sitio mostraba dos años distintos según la sección.
 */
export function getAdmissionYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Mes 0 = enero.
  const cutoff = new Date(currentYear, 0, 30);

  return now >= cutoff ? currentYear + 1 : currentYear;
}

/**
 * Formatea la fecha de una novedad en español de Argentina.
 *
 * Se fija `timeZone` para que el servidor y el navegador rindan el mismo texto:
 * sin eso, una nota creada de noche podía mostrar un día distinto en el HTML
 * pre-renderizado y al hidratarse.
 */
export function formatPostDate(date: Date, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}
