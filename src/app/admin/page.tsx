import type { Metadata } from "next";
import type { ContactMessage, Enrollment, Post, User } from "@prisma/client";
import { getSession } from "@/actions/admin";
import prisma from "@/lib/prisma";
import { AdminDashboard } from "./dashboard";
import { LoginForm } from "./login";

export const metadata: Metadata = {
  title: "Intranet",
  robots: { index: false, follow: false, nocache: true },
};

// La intranet siempre se renderiza por pedido: nunca debe quedar cacheada.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  let posts: Post[] = [];
  let enrollments: Enrollment[] = [];
  let contactMessages: ContactMessage[] = [];
  let users: User[] = [];

  if (session) {
    const permissions = session.permissions?.split(",") ?? [];
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const can = (permission: string) => isSuperAdmin || permissions.includes(permission);

    /**
     * La lectura se decide por permiso, igual que la escritura.
     *
     * Antes ver inscripciones y consultas exigía el rol SUPER_ADMIN, mientras
     * que borrarlas sólo pedía el permiso correspondiente: un editor con
     * permiso "contacts" veía la pestaña vacía pero podía eliminar registros.
     * También cargaba las cuatro tablas completas para cualquier sesión, aunque
     * el panel no fuera a mostrarlas.
     */
    const [postsResult, enrollmentsResult, contactsResult, usersResult] = await Promise.all([
      can("blog") ? prisma.post.findMany({ orderBy: { createdAt: "desc" } }) : [],
      can("enrollments") ? prisma.enrollment.findMany({ orderBy: { createdAt: "desc" } }) : [],
      can("contacts") ? prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }) : [],
      isSuperAdmin ? prisma.user.findMany({ orderBy: { createdAt: "desc" } }) : [],
    ]);

    posts = postsResult;
    enrollments = enrollmentsResult;
    contactMessages = contactsResult;
    users = usersResult;
  }

  return (
    <div className="min-h-screen bg-brand-gray/5 pb-24">
      <header className="mb-12 bg-brand-blue py-6 text-white shadow-md">
        <div className="container mx-auto flex items-center justify-between px-6 lg:px-12">
          <span className="text-xl font-bold tracking-tight">
            FEE <span className="text-brand-yellow">Intranet</span>
          </span>
          {session && (
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold">{session.name}</span>
              <span className="text-xs capitalize opacity-75">
                {session.role.toLowerCase().replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* No es <main>: el layout raíz ya aporta ese landmark y anidar dos
          confunde la navegación por regiones de los lectores de pantalla. */}
      <div className="container mx-auto max-w-5xl px-6 lg:px-12">
        {session ? (
          <AdminDashboard
            posts={posts}
            enrollments={enrollments}
            contactMessages={contactMessages}
            users={users}
            session={session}
          />
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
}
