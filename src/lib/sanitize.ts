/**
 * Saneamiento del contenido editorial.
 *
 * Las notas cargadas desde la intranet se renderizan en el sitio público. El
 * editor por bloques produce texto plano, pero las notas heredadas se guardaron
 * como HTML y se inyectaban con `dangerouslySetInnerHTML`: cualquier persona con
 * permiso de blog podía ejecutar JavaScript en el dominio del colegio (robo de
 * cookies de sesión, desfiguración de la home). Esto lo evita con una lista de
 * permitidos, sin dependencias externas.
 */

/** Etiquetas admitidas en el HTML heredado de una nota. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h2",
  "h3",
  "h4",
  "a",
  "figure",
  "figcaption",
  "img",
  "hr",
  "span",
  "div",
]);

/** Atributos admitidos por etiqueta. */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "title"]),
};

/** Sólo esquemas de URL inertes: descarta `javascript:`, `data:` y `vbscript:`. */
function isSafeUrl(value: string): boolean {
  // Quita bytes de control: `java\tscript:` no debe pasar como esquema válido.
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (/^(?:https?:|mailto:|tel:)/i.test(trimmed)) return true;
  // Rutas internas relativas.
  return /^\/(?!\/)/.test(trimmed) || /^#/.test(trimmed);
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const VOID_TAGS = new Set(["br", "img", "hr"]);

/**
 * Depura una cadena de HTML dejando sólo etiquetas y atributos permitidos.
 *
 * Reescribe el documento a partir de los tokens reconocidos en lugar de
 * intentar "limpiar" la entrada: lo que no se entiende no se emite.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // `<script>`, `<style>`, `<iframe>` y similares se eliminan con su contenido:
  // quitar sólo la etiqueta dejaría el código como texto suelto en la página.
  let html = input.replace(
    /<(script|style|iframe|object|embed|template|noscript|svg|math)\b[\s\S]*?<\/\1\s*>/gi,
    ""
  );
  // Y también si quedaron sin cerrar.
  html = html.replace(/<(script|style|iframe|object|embed|template|noscript|svg|math)\b[^>]*>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  const openTags: string[] = [];
  let output = "";
  let cursor = 0;

  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    output += escapeText(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const tag = match[1].toLowerCase();
    const isClosing = match[0].startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) continue;

    if (isClosing) {
      const lastIndex = openTags.lastIndexOf(tag);
      if (lastIndex !== -1) {
        // Cierra en orden lo que quedó abierto por dentro.
        for (let i = openTags.length - 1; i >= lastIndex; i--) {
          output += `</${openTags[i]}>`;
        }
        openTags.length = lastIndex;
      }
      continue;
    }

    const attrs = sanitizeAttributes(tag, match[2] ?? "");

    if (VOID_TAGS.has(tag)) {
      output += `<${tag}${attrs} />`;
      continue;
    }

    output += `<${tag}${attrs}>`;
    openTags.push(tag);
  }

  output += escapeText(html.slice(cursor));

  // Cierra lo que el autor dejó abierto.
  for (let i = openTags.length - 1; i >= 0; i--) {
    output += `</${openTags[i]}>`;
  }

  return output;
}

function sanitizeAttributes(tag: string, raw: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed || !raw.trim()) return "";

  const result: string[] = [];
  const attrPattern = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    if (!allowed.has(name)) continue;

    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;

    result.push(`${name}="${escapeText(value)}"`);
  }

  // Los enlaces salientes no deben poder manipular la ventana de origen.
  if (tag === "a" && result.some((attr) => attr.startsWith("href="))) {
    result.push('rel="noopener noreferrer nofollow"');
  }

  return result.length ? ` ${result.join(" ")}` : "";
}

// ---------------------------------------------------------------------------
// Bloques del editor
// ---------------------------------------------------------------------------

/**
 * Etiquetas que un bloque de texto puede pedir.
 *
 * Es una lista de permitidos porque el renderizador usaba `block.data.tag`
 * directamente como componente: un bloque guardado con `tag: "script"` se
 * habría serializado como `<script>` real en el HTML del servidor.
 */
export const BLOCK_TAGS = ["p", "h2", "h3", "h4", "blockquote"] as const;
export type BlockTag = (typeof BLOCK_TAGS)[number];

/** Mapea el valor guardado a una etiqueta válida. */
export function resolveBlockTag(value: unknown): BlockTag {
  // "h1" quedaba disponible en el editor, pero el título de la nota ya es el
  // único h1 de la página: se degrada a h2 para no romper la jerarquía.
  if (value === "h1") return "h2";
  if (value === "span") return "blockquote";
  return (BLOCK_TAGS as readonly unknown[]).includes(value) ? (value as BlockTag) : "p";
}

/** Clases de color ofrecidas por el editor. Evita inyectar clases arbitrarias. */
const BLOCK_COLORS: Record<string, string> = {
  "text-brand-blue": "text-brand-blue",
  "text-brand-green": "text-brand-green",
  "text-brand-yellow-dark": "text-brand-yellow-dark",
  "text-gray-700": "text-foreground/80",
  "text-red-600": "text-red-600",
};

export function resolveBlockColor(value: unknown): string {
  return (typeof value === "string" && BLOCK_COLORS[value]) || "text-foreground/80";
}

export function resolveBlockAlign(value: unknown): string {
  if (value === "center") return "text-center";
  if (value === "right") return "text-right";
  return "text-left";
}

export function resolveBlockFont(value: unknown): string {
  if (value === "font-serif") return "font-serif";
  if (value === "font-mono") return "font-mono";
  return "font-sans";
}

/**
 * Extrae el identificador de un video de YouTube.
 *
 * Antes, si la expresión no coincidía, se usaba la entrada completa como si
 * fuera un ID y se interpolaba en la URL del `iframe`: una entrada como
 * `../../algo` cambiaba el destino del embed. Ahora sólo se acepta el formato
 * real de ID y, si no aparece, no se renderiza nada.
 */
export function getYouTubeId(input: string): string | null {
  if (!input) return null;

  const value = input.trim();

  // ID pelado.
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|v|shorts|live)\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/** Convierte texto plano en un resumen seguro para las grillas. */
export function toPlainExcerpt(content: string, length = 160): string {
  const text = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}
