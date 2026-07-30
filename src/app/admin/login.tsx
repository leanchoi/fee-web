"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { loginAdmin } from "@/actions/admin";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin(password, email);
      if (res.success) {
        // Vuelve a evaluar los componentes de servidor y muestra el panel.
        router.refresh();
      } else {
        setError(res.error || "No pudimos verificar tus credenciales.");
        setPassword("");
      }
    } catch {
      setError("Hubo un problema de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded-3xl border border-brand-gray/10 bg-white p-10 text-center shadow-xl">
      <span
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-lightblue/10 text-brand-lightblue-dark"
        aria-hidden="true"
      >
        <Lock className="h-8 w-8" />
      </span>
      <h1 className="mb-2 text-2xl font-bold text-brand-blue">Intranet institucional</h1>
      <p className="mb-8 text-sm text-foreground/70">
        Acceso reservado al equipo directivo y a los gestores de contenido.
      </p>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
        {/* `role="alert"` hace que el lector de pantalla lea el error apenas
            aparece, sin que la persona tenga que ir a buscarlo. */}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 py-2.5 text-center text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <div>
          <label htmlFor="admin-email" className="mb-1 block text-xs font-bold text-brand-blue">
            Usuario o correo
          </label>
          <input
            id="admin-email"
            name="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="w-full rounded-xl border border-brand-gray/30 bg-brand-gray/5 px-4 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-blue"
            required
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1 block text-xs font-bold text-brand-blue">
            Contraseña
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-brand-gray/30 bg-brand-gray/5 px-4 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-brand-blue"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue py-4 font-bold text-white shadow-lg transition-colors hover:bg-brand-green disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Verificando…
            </>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>
    </div>
  );
}
