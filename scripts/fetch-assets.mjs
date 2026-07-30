#!/usr/bin/env node
/**
 * Verifica —y opcionalmente descarga— los archivos estáticos que el sitio
 * espera encontrar en `public/`.
 *
 * Por qué existe: varios de estos archivos nunca se versionaron. Viven sólo en
 * el disco del servidor, así que el sitio en producción los muestra bien pero
 * un clon limpio del repositorio los pide y recibe un 404. Cualquier despliegue
 * desde cero pierde el logotipo, las fotos y la tipografía de marca.
 *
 * Uso:
 *
 *   # Sólo informar qué falta
 *   node scripts/fetch-assets.mjs
 *
 *   # Descargar los que falten desde el sitio en producción
 *   node scripts/fetch-assets.mjs http://187.77.224.159:3006
 *
 * Después de descargarlos hay que versionarlos:
 *
 *   git add public && git commit -m "Agrega los assets de marca al repositorio"
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

/** Rutas públicas que el código referencia, con su destino en disco. */
const ASSETS = [
  { url: "/logo.svg", required: true, note: "isotipo del header y del hero" },
  { url: "/hero-bg.png", required: false, note: "fondo del hero de la portada" },
  { url: "/comunidad-hero.png", required: false, note: "fondo del hero de Comunidad" },
  { url: "/nivel-inicial.png", required: false, note: "portada de la tarjeta de Nivel Inicial" },
  { url: "/nivel-primario.png", required: false, note: "portada de la tarjeta de Nivel Primario" },
  { url: "/nivel-secundario.png", required: false, note: "portada de la tarjeta de Nivel Secundario" },
  { url: "/fonts/Halimum.woff2", required: false, note: "tipografía manuscrita de marca" },
  { url: "/fonts/Halimum.ttf", required: false, note: "tipografía manuscrita (respaldo)" },
];

/** Firmas binarias, para no guardar una página de error 404 como si fuera imagen. */
const SIGNATURES = [
  { ext: ".png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: ".jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: ".woff2", bytes: [0x77, 0x4f, 0x46, 0x32] },
  { ext: ".ttf", bytes: [0x00, 0x01, 0x00, 0x00] },
];

function looksValid(url, buffer) {
  const ext = path.extname(url).toLowerCase();

  if (ext === ".svg") {
    const head = buffer.subarray(0, 512).toString("utf-8").trimStart().toLowerCase();
    return head.startsWith("<svg") || head.startsWith("<?xml");
  }

  const signature = SIGNATURES.find((entry) => entry.ext === ext);
  if (!signature) return buffer.length > 0;

  return signature.bytes.every((byte, index) => buffer[index] === byte);
}

const publicDir = path.resolve(process.cwd(), "public");
const baseUrl = process.argv[2]?.replace(/\/+$/, "");

let missing = 0;
let downloaded = 0;

for (const asset of ASSETS) {
  const target = path.join(publicDir, asset.url);
  const label = `${asset.url.padEnd(26)} ${asset.note}`;

  try {
    await stat(target);
    console.log(`  ok        ${label}`);
    continue;
  } catch {
    // No está: se intenta descargar si nos dieron una URL base.
  }

  if (!baseUrl) {
    missing += 1;
    console.log(`  FALTA     ${label}`);
    continue;
  }

  try {
    const response = await fetch(`${baseUrl}${asset.url}`, { redirect: "follow" });

    if (!response.ok) {
      missing += 1;
      console.log(`  ${String(response.status).padEnd(9)} ${label}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!looksValid(asset.url, buffer)) {
      missing += 1;
      console.log(`  INVÁLIDO  ${label} (el servidor no devolvió el tipo esperado)`);
      continue;
    }

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
    downloaded += 1;
    console.log(`  bajado    ${label} (${(buffer.length / 1024).toFixed(1)} kB)`);
  } catch (error) {
    missing += 1;
    console.log(`  ERROR     ${label} — ${error.message}`);
  }
}

console.log();

if (downloaded) {
  console.log(`Descargados ${downloaded} archivos en public/.`);
  console.log('Versionalos con:  git add public && git commit -m "Agrega los assets de marca"');
}

if (missing) {
  console.log(
    `Faltan ${missing} archivos.${baseUrl ? "" : " Pasá la URL del sitio para intentar descargarlos."}`
  );
  console.log(
    "Mientras falten, el sitio usa los reemplazos definidos en el código (foto de la sede\n" +
      "y paneles de color); sólo /logo.svg no tiene reemplazo y se ve como imagen rota."
  );
  process.exitCode = 1;
} else if (!downloaded) {
  console.log("Todos los assets esperados están presentes.");
}
