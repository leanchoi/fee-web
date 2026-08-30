"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "./dashboard";
import { LoginForm } from "./login";
import {
  getDashboardData,
  getStoredToken,
  logoutAdmin,
  type AdminSession,
} from "@/actions/admin";
import { Loader2, AlertTriangle } from "lucide-react";

type Phase = "booting" | "anon" | "loading" | "ready" | "error";

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>("booting");
  const [data, setData] = useState<any>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [errorMsg, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setPhase("loading");
    setError(null);

    const res = await getDashboardData();
    if (res.success) {
      setData(res);
      setSession((res as any).user ?? (res as any).session ?? null);
      setPhase("ready");
      return;
    }

    // 401: Pedir credenciales; Cualquier otra cosa: mostrar pantalla de reintento/error
    if (res.status === 401) {
      setSession(null);
      setData(null);
      setPhase("anon");
    } else {
      setError(res.error || "No se pudo cargar el panel.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLoginSuccess = useCallback((user: AdminSession) => {
    setSession(user);
    void loadData();
  }, [loadData]);

  const handleLogout = useCallback(async () => {
    await logoutAdmin();
    setSession(null);
    setData(null);
    setPhase("anon");
  }, []);

  return (
    <div className="min-h-screen bg-brand-gray/5 pb-24">
      <main className="container mx-auto px-6 lg:px-12 max-w-5xl">
        {(phase === "booting" || phase === "loading") && (
          <div className="flex flex-col items-center justify-center py-24 text-brand-blue">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-semibold text-sm">Cargando panel de administración...</p>
          </div>
        )}

        {phase === "error" && (
          <div className="py-24 flex flex-col items-center text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
            <p className="font-semibold text-slate-800">No se pudo cargar el panel</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md">{errorMsg}</p>
            <button
              onClick={() => void loadData()}
              className="mt-6 px-5 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold cursor-pointer shadow-md hover:bg-brand-blue/90"
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                setPhase("anon");
                setError(null);
              }}
              className="mt-3 text-xs text-slate-500 underline cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {phase === "anon" && <LoginForm onLoginSuccess={handleLoginSuccess} />}

        {phase === "ready" && session && (
          <AdminDashboard
            posts={data?.posts ?? []}
            enrollments={data?.enrollments ?? []}
            contactMessages={data?.contacts ?? []}
            users={data?.users ?? []}
            gallery={data?.gallery ?? []}
            session={session}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
