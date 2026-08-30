"use client";

const TOKEN_KEY = "fee_admin_token";

export type AdminSession = {
  userId: string;
  username: string;
  name: string;
  email: string;
  role: string;
  permissions: string;
  mustChangePassword: boolean;
};

export type ApiResult =
  | { success: true; [k: string]: any }
  | { success: false; error: string; code?: string; status?: number };

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  const t = getStoredToken();
  if (t) {
    h["Authorization"] = `Bearer ${t}`;
    h["X-Authorization"] = `Bearer ${t}`; // Apache FastCGI no filtra headers X-*
  }
  return h;
}

/**
 * Todo request pasa por acá: Lee el cuerpo como texto antes de parsear
 * evitando excepciones crudas de JSON.parse.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<ApiResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "same-origin", // Envía y acepta la cookie admin_session
      cache: "no-store",
    });
  } catch {
    return { success: false, error: "No se pudo conectar con el servidor.", status: 0 };
  }

  const text = await res.text();
  if (!text.trim()) {
    return { success: false, error: "El servidor no devolvió respuesta.", code: "EMPTY_BODY", status: res.status };
  }

  try {
    const data = JSON.parse(text);
    return { ...data, status: res.status };
  } catch {
    return { success: false, error: "Respuesta inválida del servidor.", code: "INVALID_JSON", status: res.status };
  }
}

export async function loginAdmin(password: string, email?: string): Promise<ApiResult> {
  const result = await apiFetch("/api/login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: email || "admin",
      email: email || "admin",
      password: password
    }),
  });

  if (result.success && typeof result.token === "string") {
    try {
      window.localStorage.setItem(TOKEN_KEY, result.token);
    } catch {}
  }

  // Si es 401 se generaliza por seguridad; 429 y 500 muestran su mensaje real
  if (!result.success && result.status === 401) {
    return { success: false, error: "Usuario o contraseña incorrectos.", code: "UNAUTHORIZED", status: 401 };
  }

  return result;
}

export async function getDashboardData(cohort?: number): Promise<ApiResult> {
  const qs = new URLSearchParams({ action: "get_dashboard_data" });
  if (cohort) qs.set("cohort", String(cohort));
  qs.set("_ts", String(Date.now()));
  return apiFetch(`/api/admin.php?${qs.toString()}`, {
    headers: authHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
}

export async function getEnrollmentDetails(id: string): Promise<ApiResult> {
  return apiFetch(`/api/admin.php?action=get_enrollment&id=${encodeURIComponent(id)}&_ts=${Date.now()}`, {
    headers: authHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
}

export async function logoutAdmin(): Promise<void> {
  clearStoredToken();
  try {
    await fetch("/api/logout.php", { method: "POST", credentials: "same-origin" });
  } catch {}
  try {
    await fetch("/api/admin.php?action=logout", { method: "POST", headers: authHeaders() });
  } catch {}
  if (typeof document !== "undefined") {
    document.cookie = "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
  }
}

export async function updateEnrollmentStatus(id: string, status: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "update_enrollment_status", id, status }),
  });
}

export async function deleteEnrollment(id: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete_enrollment", id }),
  });
}

export async function deleteContactMessage(id: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete_contact", id }),
  });
}

export async function createPost(data: any): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "save_post", ...data }),
  });
}

export async function updatePost(id: string, data: any): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "save_post", id, ...data }),
  });
}

export async function deletePost(id: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete_post", id }),
  });
}

export async function togglePostPublish(id: string, current: boolean): Promise<ApiResult> {
  return updatePost(id, { published: !current });
}

export async function createUserAction(data: any): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "create_user", ...data }),
  });
}

export async function deleteUser(id: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete_user", id }),
  });
}

export async function changePasswordAction(newPassword: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "change_password", newPassword }),
  });
}

export async function resetUserPasswordAction(userId: string, password: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "reset_user_password", userId, password }),
  });
}

export async function uploadMediaAction(formData: FormData): Promise<ApiResult> {
  return apiFetch("/api/upload.php", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
}

export async function getGalleryItemsAction(): Promise<ApiResult> {
  return apiFetch("/api/admin.php?action=get_gallery");
}

export async function saveGalleryItemAction(data: { id?: string; image: string; category: string; title: string; desc: string }): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "save_gallery_item", ...data }),
  });
}

export async function deleteGalleryItemAction(id: string): Promise<ApiResult> {
  return apiFetch("/api/admin.php", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "delete_gallery_item", id }),
  });
}

export async function getSession(): Promise<null> {
  return null;
}
