"use client";

import { useEffect, useState } from "react";
import { AdminDashboard } from "./dashboard";
import { LoginForm } from "./login";
import { getDashboardData } from "@/actions/admin";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardData();
      if (res && res.success) {
        setData(res);
      } else {
        setData(null);
      }
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userSession = data ? (data.user || data.session) : null;
  const isAuth = !!userSession;

  return (
    <div className="min-h-screen bg-brand-gray/5 pb-24">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <header className="bg-brand-blue text-white py-6 shadow-md mb-12">
        <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
          <span className="text-xl font-bold tracking-tight">FEE <span className="text-brand-yellow">Intranet</span></span>
          {isAuth && userSession && (
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold">{userSession.name}</span>
              <span className="text-xs opacity-75 capitalize">{userSession.role?.toLowerCase().replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 lg:px-12 max-w-5xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-blue">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-semibold text-sm">Cargando panel de administración...</p>
          </div>
        ) : isAuth && userSession ? (
          <AdminDashboard 
            posts={data.posts || []} 
            enrollments={data.enrollments || []} 
            contactMessages={data.contacts || []} 
            users={data.users || []} 
            gallery={data.gallery || []}
            session={userSession} 
            onLogout={() => {
              setData(null);
            }}
          />
        ) : (
          <LoginForm onLoginSuccess={loadData} />
        )}
      </main>
    </div>
  );
}
