import path from "path";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";

/**
 * Validación y escritura de archivos subidos.
 *
 * El `type` que informa el navegador es dato del cliente y se puede falsificar,
 * así que el tipo real se determina leyendo la firma binaria del archivo. La
 * extensión guardada se deriva de esa firma, nunca del nombre original: así un
 * `.html` o `.svg` disfrazado de imagen no puede quedar servido como tal.
 */

export interface DetectedType {
  mime: string;
  ext: string;
  kind: "image" | "video";
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/** Tipos servibles y su extensión canónica. */
export const SERVABLE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
};

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((byte, i) => buf[offset + i] === byte);
}

/** Detecta el tipo por firma binaria. Devuelve `null` si no es un tipo permitido. */
export function detectFileType(buf: Buffer): DetectedType | null {
  // JPEG: FF D8 FF
  if (startsWith(buf, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: ".jpg", kind: "image" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: ".png", kind: "image" };
  }

  // GIF: "GIF87a" / "GIF89a"
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) {
    return { mime: "image/gif", ext: ".gif", kind: "image" };
  }

  // RIFF....WEBP
  if (
    startsWith(buf, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mime: "image/webp", ext: ".webp", kind: "image" };
  }

  // ISO-BMFF (MP4): "ftyp" en offset 4
  if (startsWith(buf, [0x66, 0x74, 0x79, 0x70], 4)) {
    return { mime: "video/mp4", ext: ".mp4", kind: "video" };
  }

  // Contenedor Matroska/WebM: 1A 45 DF A3
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mime: "video/webm", ext: ".webm", kind: "video" };
  }

  // Ogg: "OggS"
  if (startsWith(buf, [0x4f, 0x67, 0x67, 0x53])) {
    return { mime: "video/ogg", ext: ".ogg", kind: "video" };
  }

  return null;
}

export class UploadError extends Error {}

/**
 * Valida y guarda un archivo en `public/uploads`, devolviendo su URL pública.
 * Lanza `UploadError` con un mensaje apto para mostrar al usuario.
 */
export async function storeUpload(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new UploadError("El archivo está vacío o no se pudo leer.");
  }

  // Corte temprano por el límite mayor, antes de cargar el archivo en memoria.
  if (file.size > VIDEO_MAX_BYTES) {
    throw new UploadError("El archivo supera el máximo de 50 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectFileType(buffer);

  if (!detected) {
    throw new UploadError(
      "Formato no permitido. Se aceptan imágenes JPG, PNG, WebP o GIF y videos MP4, WebM u OGG."
    );
  }

  const limit = detected.kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (buffer.length > limit) {
    throw new UploadError(
      `El archivo supera el máximo de ${detected.kind === "video" ? "50 MB" : "5 MB"}.`
    );
  }

  // Nombre generado en el servidor: raíz legible del original + entropía + la
  // extensión derivada de la firma. Nada del nombre original llega al disco sin
  // pasar por la lista de caracteres permitidos.
  const stem = path
    .basename(file.name, path.extname(file.name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${
    stem ? `-${stem}` : ""
  }${detected.ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}
