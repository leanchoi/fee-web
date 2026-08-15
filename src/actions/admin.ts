export async function loginAdmin(password: string, email?: string) {
  try {
    const res = await fetch("/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || "admin", password }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Error al iniciar sesión" };
  }
}

export async function logoutAdmin() {
  try {
    await fetch("/api/admin.php?action=logout", { method: "POST" });
  } catch (e) {}
  try {
    await fetch("/api/logout.php", { method: "POST" });
  } catch (e) {}
  if (typeof document !== "undefined") {
    document.cookie = "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
  }
}

export async function getDashboardData() {
  try {
    const res = await fetch("/api/admin.php?action=get_data");
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEnrollmentStatus(id: string, status: string) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_enrollment_status", id, status }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEnrollment(id: string) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_enrollment", id }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteContactMessage(id: string) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_contact", id }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPost(data: any) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_post", ...data }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePost(id: string, data: any) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_post", id, ...data }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePost(id: string) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_post", id }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePostPublish(id: string, current: boolean) {
  return updatePost(id, { published: !current });
}

export async function createUserAction(data: any): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_user", ...data }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear usuario" };
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_user", id }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar usuario" };
  }
}

export async function changePasswordAction(newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_password", newPassword }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar contraseña" };
  }
}

export async function uploadMediaAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch("/api/upload.php", {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message || "Error al subir archivo" };
  }
}

export async function getGalleryItemsAction() {
  try {
    const res = await fetch("/api/admin.php?action=get_gallery");
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveGalleryItemAction(data: { id?: string; image: string; category: string; title: string; desc: string }) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_gallery_item", ...data }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteGalleryItemAction(id: string) {
  try {
    const res = await fetch("/api/admin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_gallery_item", id }),
    });
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSession() {
  return null;
}

