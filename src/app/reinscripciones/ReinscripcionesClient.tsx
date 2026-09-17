"use client";

import React, { useState, useEffect } from "react";
import { EnrollmentForm } from "../inscripciones/form";
import { Loader2 } from "lucide-react";

export function ReinscripcionesClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-bold uppercase tracking-wider">Cargando formulario de reinscripción...</p>
      </div>
    );
  }

  return <EnrollmentForm isDirectAccess={true} />;
}
