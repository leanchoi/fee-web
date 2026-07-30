import { getSession } from "@/actions/admin";
import { AdminDashboard } from "./dashboard";
import { LoginForm } from "./login";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import type { Post, Enrollment, User, ContactMessage } from "@prisma/client";

export const metadata: Metadata = {
  title: "Admin Panel | Fundación Educativa Esquel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await getSession();
  const isAuth = !!session;

  let posts: Post[] = [];
  let enrollments: Enrollment[] = [];
  let contactMessages: ContactMessage[] = [];
  let users: User[] = [];

  if (session) {
    posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
    
    // Only SUPER_ADMIN can view enrollments, contacts and manage users
    if (session.role === "SUPER_ADMIN") {
      enrollments = await prisma.enrollment.findMany({ orderBy: { createdAt: "desc" } });
      contactMessages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
      users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray/5 pb-24">
      <header className="bg-brand-blue text-white py-6 shadow-md mb-12">
        <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
          <span className="text-xl font-bold tracking-tight">FEE <span className="text-brand-yellow">Intranet</span></span>
          {isAuth && (
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold">{session.name}</span>
              <span className="text-xs opacity-75 capitalize">{session.role.toLowerCase().replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 max-w-5xl">
        {isAuth ? (
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
      </main>
    </div>
  );
}
