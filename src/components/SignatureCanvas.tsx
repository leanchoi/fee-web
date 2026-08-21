"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { RotateCcw, CheckCircle2, Edit3 } from "lucide-react";

interface SignatureCanvasProps {
  label: string;
  sublabel?: string;
  required?: boolean;
  onSave: (dataUrl: string | null) => void;
  disabled?: boolean;
  value?: string | null;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  label,
  sublabel,
  required = false,
  onSave,
  disabled = false,
  value = null
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Inicializar canvas con alta resolución
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Solo reajustar dimensiones si cambiaron
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#0f172a"; // Slate 900
      }
    }
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  // Si viene un valor previo (Base64)
  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
          setHasDrawn(true);
        }
      };
      img.src = value;
    }
  }, [value]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setLastPoint({ x, y });

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || disabled) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
        setLastPoint({ x, y });
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    setLastPoint(null);

    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      onSave(null);
    }
  };

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-emerald-600" />
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </label>
          {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
        </div>
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Borrar y volver a firmar
          </button>
        )}
      </div>

      <div className="relative w-full h-36 bg-slate-50/80 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 focus-within:border-emerald-600 transition-all overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Guía de firma */}
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 select-none">
            <span className="text-xs font-medium tracking-wide">
              Firmá aquí con el dedo (celular/tablet) o mouse
            </span>
            <div className="w-3/4 h-px bg-slate-200 mt-4" />
          </div>
        )}

        {/* Indicador de firma lista */}
        {hasDrawn && (
          <div className="absolute bottom-2 right-2 pointer-events-none bg-emerald-100/90 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Firma capturada
          </div>
        )}
      </div>
    </div>
  );
};
