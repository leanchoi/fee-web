/**
 * Configuración de PostCSS.
 *
 * Este archivo faltaba en el repositorio. Tailwind CSS v4 se integra con
 * Next.js a través de este plugin: sin él, el `@import "tailwindcss"` de
 * `globals.css` no se procesa nunca y el build genera una hoja de estilos que
 * sólo contiene las tipografías. En otras palabras, cualquier clon o
 * despliegue limpio del proyecto servía el sitio entero sin estilos.
 *
 * `@tailwindcss/postcss` ya figuraba en devDependencies; sólo faltaba
 * declararlo acá.
 */
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
