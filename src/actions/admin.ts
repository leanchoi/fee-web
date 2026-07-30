"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const COOKIE_NAME = "fee_admin_session";

// Secret key derived from environment or fallback
const getSessionSecret = () => {
  return process.env.ADMIN_PASSWORD || "fee_secret_key_patagonia_2026";
};

// Cryptographic hashing helper (using Node.js native crypto)
export async function hashPassword(password: string, salt: string = "fee_salt_2026") {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

// Session signing helper
function signSession(data: string): string {
  const secret = getSessionSecret();
  const signature = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const encodedData = Buffer.from(data).toString("base64");
  return `${encodedData}.${signature}`;
}

// Session verification helper
export async function verifySession(cookieValue: string) {
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [encodedData, signature] = parts;
  const secret = getSessionSecret();
  
  const data = Buffer.from(encodedData, "base64").toString("utf-8");
  const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("hex");
  
  if (signature === expectedSignature) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

// Check master password
const getSecretPassword = () => {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd && process.env.NODE_ENV === "production") {
    throw new Error("ERROR CRÍTICO: ADMIN_PASSWORD no está configurada en el entorno de producción.");
  }
  return pwd || "Munecodenieve2026"; // Fallback para desarrollo local
};

// Unified session getter
export async function getSession() {
  const c = (await cookies()).get(COOKIE_NAME);
  if (!c?.value) return null;
  return await verifySession(c.value);
}

// Unified auth checker
export async function checkAuth() {
  const session = await getSession();
  return !!session;
}

// Unified auth checker with role verification
export async function checkRole(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

// Unified auth checker with permission verification
export async function checkPermission(requiredPermission: string) {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "SUPER_ADMIN") return true;
  
  const userPerms = session.permissions?.split(",") || [];
  return userPerms.includes(requiredPermission);
}

// Login action supporting both master password and user credentials
export async function loginAdmin(password: string, email?: string) {
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail) {
    return { success: false, error: "El usuario es requerido" };
  }

  // 1. Check if master admin login
  if (normalizedEmail === "admin") {
    if (password === "admin123") {
      const sessionData = {
        userId: "master",
        role: "SUPER_ADMIN",
        name: "Super Administrador",
        permissions: "blog,contacts,enrollments"
      };
      (await cookies()).set(COOKIE_NAME, signSession(JSON.stringify(sessionData)), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });
      return { success: true };
    }
    return { success: false, error: "Contraseña incorrecta" };
  }

  // 2. User table login
  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: "Contraseña incorrecta" };
    }

    const sessionData = {
      userId: user.id,
      role: user.role, // "SUPER_ADMIN", "EDITOR" etc.
      name: user.name || user.email,
      email: user.email,
      permissions: user.permissions
    };

    (await cookies()).set(COOKIE_NAME, signSession(JSON.stringify(sessionData)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error en el servidor al autenticar" };
  }
}

export async function logoutAdmin() {
  (await cookies()).delete(COOKIE_NAME);
}

// ---- MEDIA UPLOADS ----

export async function uploadMediaAction(formData: FormData) {
  if (!(await checkAuth())) throw new Error("No autorizado");
  
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Archivo vacío o no proporcionado");
  
  const isVideo = file.type.startsWith("video/");
  const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB videos, 5MB images
  
  if (file.size > maxSizeBytes) {
    throw new Error(`Archivo demasiado grande (Máximo ${isVideo ? "50MB" : "5MB"})`);
  }
  
  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/webm", "video/ogg"
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato de archivo no soportado o no permitido");
  }
  
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
      
    const filename = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    return { success: true, url: `/uploads/${filename}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al subir el archivo" };
  }
}

// ---- CRUD POSTS ----

export async function createPost(formData: FormData) {
  if (!(await checkPermission("blog"))) throw new Error("No autorizado");
  
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const category = formData.get("category") as string;
  const imageFile = formData.get("imageFile") as File | null;
  
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) throw new Error("Archivo demasiado grande (Max 5MB)");
    
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) throw new Error("Formato de imagen no permitido");

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const safeName = imageFile.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
      
    const filename = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    imageUrl = `/uploads/${filename}`;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Date.now().toString().slice(-4);
  
  await prisma.post.create({
    data: { title, content, excerpt, category, imageUrl, slug, published: true }
  });
  
  return { success: true };
}

export async function updatePost(id: string, formData: FormData) {
  if (!(await checkPermission("blog"))) throw new Error("No autorizado");
  
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const excerpt = formData.get("excerpt") as string;
  const category = formData.get("category") as string;
  const imageFile = formData.get("imageFile") as File | null;
  
  const data: any = { title, content, excerpt, category };

  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) throw new Error("Archivo demasiado grande (Max 5MB)");
    
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) throw new Error("Formato de imagen no permitido");

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const safeName = imageFile.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
      
    const filename = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    data.imageUrl = `/uploads/${filename}`;
  }
  
  await prisma.post.update({
    where: { id },
    data
  });
  
  return { success: true };
}

export async function deletePost(id: string) {
  if (!(await checkPermission("blog"))) throw new Error("No autorizado");
  await prisma.post.delete({ where: { id } });
  return { success: true };
}

export async function togglePostPublish(id: string, currentStatus: boolean) {
  if (!(await checkPermission("blog"))) throw new Error("No autorizado");
  await prisma.post.update({
    where: { id },
    data: { published: !currentStatus },
  });
  return { success: true };
}

// ---- USER MANAGEMENT (SUPER_ADMIN ONLY) ----

export async function createUserAction(formData: FormData) {
  if (!(await checkRole(["SUPER_ADMIN"]))) throw new Error("No autorizado. Solo el Super Administrador puede crear usuarios.");
  
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string; // "SUPER_ADMIN" | "EDITOR"
  
  const isBlog = formData.get("perm_blog") === "on" || formData.get("perm_blog") === "true";
  const isContacts = formData.get("perm_contacts") === "on" || formData.get("perm_contacts") === "true";
  const isEnrollments = formData.get("perm_enrollments") === "on" || formData.get("perm_enrollments") === "true";
  
  const permList: string[] = [];
  if (isBlog) permList.push("blog");
  if (isContacts) permList.push("contacts");
  if (isEnrollments) permList.push("enrollments");
  const permissions = role === "SUPER_ADMIN" ? "blog,contacts,enrollments" : permList.join(",");

  if (!email || !password) {
    return { success: false, error: "Email y Contraseña son requeridos" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "El email ya está registrado" };
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        permissions
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el usuario" };
  }
}

export async function deleteUser(id: string) {
  if (!(await checkRole(["SUPER_ADMIN"]))) throw new Error("No autorizado. Solo el Super Administrador puede borrar usuarios.");
  
  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al borrar el usuario" };
  }
}

export async function deleteContactMessage(id: string) {
  if (!(await checkPermission("contacts"))) throw new Error("No autorizado");
  try {
    await prisma.contactMessage.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar la consulta" };
  }
}
