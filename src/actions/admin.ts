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

export async function createUserAction(data: any): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function uploadMediaAction(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  return { success: true, url: "/logo.png" };
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

