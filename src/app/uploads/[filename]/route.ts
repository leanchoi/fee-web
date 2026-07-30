import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { SERVABLE_TYPES } from "@/lib/uploads";

/**
 * Sirve los archivos cargados desde la intranet.
 *
 * Contención de rutas: el nombre pedido llega decodificado desde la URL, así
 * que se valida que sea un nombre de archivo simple y, además, que la ruta
 * resuelta siga dentro del directorio de subidas. Sin eso, una secuencia
 * `..%2f` podía escapar y leer archivos del servidor (incluida la base SQLite).
 *
 * Las extensiones no reconocidas devuelven 404 en lugar de
 * `application/octet-stream`: nada que no sea imagen o video previsto se
 * entrega desde este endpoint.
 */

const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads");

/** Sólo nombres generados por `storeUpload`: sin separadores ni rutas relativas. */
const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename || !SAFE_NAME.test(filename) || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = SERVABLE_TYPES[ext];

  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const resolved = path.resolve(UPLOAD_DIR, filename);

  // Defensa en profundidad: incluso con el nombre validado, confirmamos que la
  // ruta resuelta no salió del directorio de subidas.
  if (!resolved.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const file = await fs.readFile(resolved);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // Evita que un archivo se interprete como documento activo del sitio.
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
