# 🏫 Proyecto: Fundación Educativa Esquel (FEE Web)
## Guía de Arquitectura, Tecnologías y Despliegue

Este repositorio está construido siguiendo la arquitectura **Next.js SSG + Backend PHP/MySQL + Hostinger Git CI/CD**.

### 1. Stack Tecnológico
- **Frontend:** Next.js 16 (React 19, TypeScript, Tailwind CSS, Lucide Icons).
- **Modo de compilación:** Exportación estática (`output: 'export'` en `next.config.ts`).
- **Backend:** PHP 8.x nativo modular en `/api/` (`config.php`, `login.php`, `logout.php`, `admin.php`, `upload.php`).
- **Base de Datos:** MySQL de Hostinger con auto-migración dinámica (`ensureUserTableSchema`) y respaldo JSON en `/api/data/`.
- **Integraciones:** Webhooks a Google Sheets para solicitudes de admisión y consultas de contacto.

### 2. Convenciones de Desarrollo y Despliegue
1. Para compilar cambios:
   ```bash
   npm run build
   powershell -Command "Copy-Item -Path 'out\*' -Destination '.' -Recurse -Force"
   powershell -Command "Copy-Item -Path 'api\*' -Destination 'public\api\' -Recurse -Force"
   ```
2. Para desplegar en GitHub y Hostinger:
   ```bash
   git add -A
   git commit -m "tipo(alcance): descripcion del cambio"
   git push origin main
   ```
3. En el panel de Hostinger: ir a **Avanzado > Git** y presionar **`Desplegar`**.

### 3. Principios de Seguridad y Negocio
- Autenticación por `username` simple (sin mails obligatorios), case-insensitive.
- Claves provisorias sugeridas con solicitud de cambio de clave obligatorio en el primer login (`mustChangePassword`).
- La pestaña **Usuarios** es de acceso exclusivo para `SUPER_ADMIN`.
- Cero imágenes genéricas de IA; uso exclusivo de las 26 fotografías reales institucionales (`/photos/fee_photo_01.jpg` a `fee_photo_26.jpg`).
