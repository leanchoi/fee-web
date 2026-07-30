"use client";

import { MotionConfig } from "framer-motion";

/**
 * Hace que todas las animaciones de framer-motion respeten la preferencia
 * "reducir movimiento" del sistema operativo.
 *
 * El CSS global ya neutraliza las transiciones y animaciones declaradas en la
 * hoja de estilos, pero framer-motion anima escribiendo estilos en línea desde
 * JavaScript: esas reglas CSS no lo alcanzan. `reducedMotion="user"` desactiva
 * los desplazamientos y escalados (mantiene los cambios de opacidad, que no
 * generan sensación de movimiento) para quien lo haya pedido.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
