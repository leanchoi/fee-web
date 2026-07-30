# Fundación Educativa Esquel — sitio web

Sitio institucional y panel de gestión de la Fundación Educativa Esquel
(Esquel, Chubut). Next.js 16 (App Router), Tailwind CSS v4, Prisma sobre SQLite.

## Puesta en marcha

```bash
npm install            # genera además el cliente de Prisma
cp .env.example .env   # completar las variables (ver abajo)
npm run db:push        # crea el archivo SQLite con el esquema
npm run dev
```

## Variables de entorno

`.env.example` documenta todas. Dos son obligatorias en producción y la
aplicación **falla al autenticar** si faltan, en lugar de recurrir a un valor
por defecto conocido:

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Ruta del archivo SQLite (relativa a `prisma/`). |
| `SESSION_SECRET` | Firma las cookies de la intranet. Mínimo 32 caracteres. |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` | Administrador principal. Sin ellas, el login maestro queda deshabilitado. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica, usada en metadatos, sitemap y datos estructurados. |
| `GOOGLE_SHEET_WEBHOOK_URL` | Opcional: replica inscripciones y consultas en una planilla. |

Generar los secretos:

```bash
openssl rand -hex 32                               # SESSION_SECRET
node scripts/hash-password.mjs "tu contraseña"     # ADMIN_PASSWORD_HASH
```

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compila y verifica los tipos. |
| `npm run start` | Sirve la compilación de producción. |
| `npm run lint` | ESLint (reglas de Next + TypeScript). |
| `npm run db:push` | Sincroniza el esquema de Prisma con la base. |

## Estructura

```
src/
  actions/      Server actions (admin, contacto, inscripciones)
  app/          Rutas del App Router
  components/   Componentes de UI por área
  lib/
    auth.ts       Sesiones firmadas y hashing de contraseñas
    rateLimit.ts  Limitador de tasa en memoria
    sanitize.ts   Saneamiento del contenido editorial
    site.ts       Datos institucionales (fuente única de verdad)
    uploads.ts    Validación y guardado de archivos
prisma/         Esquema y base SQLite (la base no se versiona)
scripts/        Utilidades de línea de comandos
```

### Dónde se editan los datos institucionales

Direcciones, teléfonos, correos, año de fundación y redes sociales viven en
`src/lib/site.ts`. El header, el footer, la página de contacto, los niveles y
los datos estructurados leen de ahí: un cambio se propaga a todo el sitio.

## Assets de marca (pendiente)

Varios archivos estáticos que el código referencia **no están versionados**:
existen sólo en el disco del servidor, así que producción los muestra bien pero
un clon limpio los pide y recibe un 404.

```bash
node scripts/fetch-assets.mjs                       # informa qué falta
node scripts/fetch-assets.mjs http://<host>:<puerto> # los baja del sitio en línea
git add public && git commit -m "Agrega los assets de marca"
```

| Archivo | Uso |
| --- | --- |
| `public/logo.svg` | Isotipo del header y del hero. **Sin reemplazo: hoy se ve como imagen rota.** |
| `public/hero-bg.png` | Fondo del hero de la portada. Reemplazado por `school-esquel.jpg`. |
| `public/comunidad-hero.png` | Fondo del hero de Comunidad. Reemplazado por `school-esquel.jpg`. |
| `public/nivel-*.png` | Portadas de las tarjetas de niveles. Reemplazadas por paneles de color. |
| `public/fonts/Halimum.woff2` y `.ttf` | Tipografía manuscrita de marca. Reemplazada por una que carga next/font. |

Cuando los archivos estén en el repositorio, conviene volver a las referencias
originales en `Hero.tsx`, `comunidad/page.tsx` y `NivelesCards.tsx`. La
tipografía toma el control sola: `--font-expressive` ya lista `Halimum` primero.

## Notas de despliegue

- La base SQLite y `public/uploads/` **no se versionan**. Al desplegar hay que
  conservar ambos entre versiones (por ejemplo con un volumen persistente); de
  lo contrario se pierden novedades, inscripciones y archivos subidos.
- El limitador de tasa guarda el estado en memoria del proceso. Sirve para el
  despliegue actual de una sola instancia; con varias réplicas hay que
  migrarlo a un almacén compartido.
- La aplicación espera estar detrás de un proxy inverso que termine TLS y
  propague `X-Forwarded-For` (el limitador usa esa cabecera para identificar al
  cliente).
