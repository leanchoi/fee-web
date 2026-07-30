"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  type SessionPayload,
  SESSION_TTL_MS,
  getMasterCredentials,
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from "@/lib/auth";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { UploadError, storeUpload } from "@/lib/uploads";

const COOKIE_NAME = "fee_admin_session";

const PERMISSIONS = ["blog", "contacts", "enrollments"] as const;
type Permission = (typeof PERMISSIONS)[number];

const ROLES = ["SUPER_ADMIN", "EDITOR"] as const;

const CATEGORIES = ["Institucional", "Eventos", "Comunidad", "Inglés"] as const;

const ENROLLMENT_STATUSES = ["PENDING", "REVIEWED", "CONTACTED"] as const;

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

async function setSessionCookie(payload: Omit<SessionPayload, "iat" | "exp">) {
  (await cookies()).set(COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = (await cookies()).get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySession(cookie.value);
}

export async function checkAuth(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function checkRole(allowedRoles: string[]): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

export async function checkPermission(required: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "SUPER_ADMIN") return true;
  return (session.permissions?.split(",") ?? []).includes(required);
}

/** Exige un permiso o corta la ejecución de la acción. */
async function requirePermission(required: Permission): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");

  const allowed =
    session.role === "SUPER_ADMIN" ||
    (session.permissions?.split(",") ?? []).includes(required);

  if (!allowed) throw new Error("No tenés permisos para realizar esta acción.");
  return session;
}

async function requireSuperAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Sólo el Super Administrador puede realizar esta acción.");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Autentica contra el usuario maestro del entorno o la tabla de usuarios.
 *
 * Los errores devueltos son deliberadamente genéricos: distinguir "usuario
 * inexistente" de "contraseña incorrecta" permitiría enumerar cuentas válidas.
 */
export async function loginAdmin(password: string, email?: string) {
  const identifier = email?.toLowerCase().trim();

  if (!identifier || !password) {
    return { success: false, error: "Ingresá tu usuario y contraseña." };
  }

  // Fuerza bruta: 8 intentos cada 15 minutos por IP.
  const limit = rateLimit(await getClientKey("login"), 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      success: false,
      error: `Demasiados intentos fallidos. Volvé a probar en ${Math.ceil(
        limit.retryAfter / 60
      )} minutos.`,
    };
  }

  const invalid = { success: false as const, error: "Usuario o contraseña incorrectos." };

  // 1. Administrador principal, configurado por variables de entorno.
  const master = getMasterCredentials();
  if (master && identifier === master.email) {
    if (!master.verify(password)) return invalid;

    await setSessionCookie({
      userId: "master",
      role: "SUPER_ADMIN",
      name: "Super Administrador",
      email: master.email,
      permissions: PERMISSIONS.join(","),
    });
    return { success: true };
  }

  // 2. Usuarios de la base de datos.
  try {
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) return invalid;

    const { valid, needsRehash } = verifyPassword(password, user.password);
    if (!valid) return invalid;

    // Migración transparente de hashes heredados al esquema actual.
    if (needsRehash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    await setSessionCookie({
      userId: user.id,
      role: user.role,
      name: user.name || user.email,
      email: user.email,
      permissions: user.permissions,
    });

    return { success: true };
  } catch (error) {
    console.error("[auth] Error al autenticar:", error);
    return { success: false, error: "No pudimos procesar el ingreso. Intentá de nuevo." };
  }
}

export async function logoutAdmin() {
  (await cookies()).delete(COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Subida de archivos
// ---------------------------------------------------------------------------

export async function uploadMediaAction(formData: FormData) {
  // Subir media es parte de la redacción de novedades: requiere ese permiso,
  // no simplemente estar autenticado.
  await requirePermission("blog");

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No se recibió ningún archivo." };
  }

  try {
    const url = await storeUpload(file);
    return { success: true, url };
  } catch (error) {
    if (error instanceof UploadError) {
      return { success: false, error: error.message };
    }
    console.error("[uploads] Error al guardar el archivo:", error);
    return { success: false, error: "No pudimos guardar el archivo. Intentá de nuevo." };
  }
}

// ---------------------------------------------------------------------------
// Novedades
// ---------------------------------------------------------------------------

function readPostFields(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null) ?? "";
  const excerpt = (formData.get("excerpt") as string | null)?.trim() ?? "";
  const rawCategory = (formData.get("category") as string | null) ?? "";

  if (title.length < 3) throw new Error("El título debe tener al menos 3 caracteres.");
  if (title.length > 180) throw new Error("El título no puede superar los 180 caracteres.");
  if (excerpt.length > 500) throw new Error("El resumen no puede superar los 500 caracteres.");
  if (content.length > 200_000) throw new Error("El contenido de la nota es demasiado extenso.");

  const category = (CATEGORIES as readonly string[]).includes(rawCategory)
    ? rawCategory
    : "Institucional";

  return { title, content, excerpt, category };
}

/** Slug estable a partir del título, con acentos normalizados. */
function slugify(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita los diacríticos separados por NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "novedad"}-${Date.now().toString(36).slice(-5)}`;
}

async function readCoverImage(formData: FormData): Promise<string | null> {
  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File) || imageFile.size === 0) return null;

  try {
    return await storeUpload(imageFile);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    console.error("[uploads] Error al guardar la portada:", error);
    throw new Error("No pudimos guardar la imagen de portada.");
  }
}

export async function createPost(formData: FormData) {
  await requirePermission("blog");

  const { title, content, excerpt, category } = readPostFields(formData);
  const imageUrl = await readCoverImage(formData);

  await prisma.post.create({
    data: { title, content, excerpt, category, imageUrl, slug: slugify(title), published: true },
  });

  revalidatePath("/blog");
  revalidatePath("/");
  return { success: true };
}

export async function updatePost(id: string, formData: FormData) {
  await requirePermission("blog");

  const { title, content, excerpt, category } = readPostFields(formData);
  const imageUrl = await readCoverImage(formData);

  const post = await prisma.post.update({
    where: { id },
    data: { title, content, excerpt, category, ...(imageUrl ? { imageUrl } : {}) },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/");
  return { success: true };
}

export async function deletePost(id: string) {
  await requirePermission("blog");
  const post = await prisma.post.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/");
  return { success: true };
}

export async function togglePostPublish(id: string, currentStatus: boolean) {
  await requirePermission("blog");
  const post = await prisma.post.update({
    where: { id },
    data: { published: !currentStatus },
  });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Inscripciones
// ---------------------------------------------------------------------------

export async function updateEnrollmentStatus(id: string, status: string) {
  await requirePermission("enrollments");

  if (!(ENROLLMENT_STATUSES as readonly string[]).includes(status)) {
    return { success: false, error: "Estado no válido." };
  }

  try {
    await prisma.enrollment.update({ where: { id }, data: { status } });
    return { success: true };
  } catch (error) {
    console.error("[enrollments] Error al actualizar el estado:", error);
    return { success: false, error: "No pudimos actualizar el estado de la solicitud." };
  }
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const email = ((formData.get("email") as string | null) ?? "").toLowerCase().trim();
  const password = (formData.get("password") as string | null) ?? "";
  const rawRole = (formData.get("role") as string | null) ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  if (password.length < 12) {
    return { success: false, error: "La contraseña debe tener al menos 12 caracteres." };
  }

  const role = (ROLES as readonly string[]).includes(rawRole) ? rawRole : "EDITOR";

  const checked = (field: string) => {
    const value = formData.get(field);
    return value === "on" || value === "true";
  };

  const permissions =
    role === "SUPER_ADMIN"
      ? PERMISSIONS.join(",")
      : PERMISSIONS.filter((perm) => checked(`perm_${perm}`)).join(",");

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Ese email ya está registrado." };
    }

    await prisma.user.create({
      data: { name, email, password: hashPassword(password), role, permissions },
    });

    return { success: true };
  } catch (error) {
    // No devolvemos el error crudo: puede revelar estructura de la base.
    console.error("[users] Error al crear el usuario:", error);
    return { success: false, error: "No pudimos crear el usuario. Intentá de nuevo." };
  }
}

export async function deleteUser(id: string) {
  const session = await requireSuperAdmin();

  if (session.userId === id) {
    return { success: false, error: "No podés eliminar tu propio usuario." };
  }

  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[users] Error al eliminar el usuario:", error);
    return { success: false, error: "No pudimos eliminar el usuario." };
  }
}

// ---------------------------------------------------------------------------
// Consultas de contacto
// ---------------------------------------------------------------------------

export async function deleteContactMessage(id: string) {
  await requirePermission("contacts");

  try {
    await prisma.contactMessage.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("[contacts] Error al eliminar la consulta:", error);
    return { success: false, error: "No pudimos eliminar la consulta." };
  }
}
