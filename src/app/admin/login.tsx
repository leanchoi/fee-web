"use client";

import { useState } from "react";
import { loginAdmin } from "@/actions/admin";
import { Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
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
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          router.refresh();
        }
      } else {
        setError(res.error || "Error al ingresar");
      }
    } catch (err) {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-3xl shadow-xl mt-20 border border-brand-gray/10 text-center">
      <div className="w-16 h-16 bg-brand-lightblue/10 text-brand-lightblue rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-brand-blue mb-2">Acceso Restringido</h1>
      <p className="text-brand-foreground/70 text-sm mb-8">Ingresá con tus credenciales institucionales.</p>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
        {error && <p className="text-red-500 text-sm font-semibold bg-red-50 py-2 rounded-lg text-center">{error}</p>}
        
        <div>
          <label className="block text-xs font-bold text-brand-blue mb-1">Usuario / Email</label>
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: admin o nombre@correo.com"
            className="w-full px-4 py-3 rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-brand-blue mb-1">Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm tracking-wider text-center"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="bg-brand-blue text-white w-full py-4 rounded-full font-bold shadow-lg hover:bg-brand-green transition-colors mt-4 flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
