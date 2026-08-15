const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createOgBanner() {
  const width = 1200;
  const height = 630;

  const bgImagePath = path.join(__dirname, '..', 'public', 'photos', 'fee_photo_07.jpg');
  const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
  const outputPathJpg = path.join(__dirname, '..', 'public', 'og-image.jpg');
  const outputPathPng = path.join(__dirname, '..', 'public', 'og-image.png');
  const artifactPath = 'C:\\Users\\agenc\\.gemini\\antigravity\\brain\\b5a0e89a-0b1b-4726-b3f1-42af52198ca5\\og_share_preview_fee.jpg';

  // 1. Redimensionar y ajustar la foto de los abanderados para el fondo
  const bgResized = await sharp(bgImagePath)
    .resize(width, height, {
      fit: 'cover',
      position: 'center'
    })
    .toBuffer();

  // 2. Redimensionar el logo oficial con borde circular blanco
  const logoSize = 160;
  const logoResized = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .toBuffer();

  // 3. Crear overlay SVG con diseño tipográfico y branding institucional
  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Degradado de izquierda a derecha para máxima legibilidad -->
        <linearGradient id="overlayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0f1f33" stop-opacity="0.96" />
          <stop offset="38%" stop-color="#0f1f33" stop-opacity="0.88" />
          <stop offset="65%" stop-color="#0f1f33" stop-opacity="0.40" />
          <stop offset="100%" stop-color="#0f1f33" stop-opacity="0.05" />
        </linearGradient>

        <!-- Sombra suave para contenedor de logo -->
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>

      <!-- Capa de degradado -->
      <rect width="${width}" height="${height}" fill="url(#overlayGrad)" />

      <!-- Barra decorativa lateral con colores institucionales -->
      <rect x="0" y="0" width="10" height="${height}" fill="#2E7D32" />
      <rect x="10" y="0" width="6" height="${height}" fill="#F9A825" />

      <!-- Tarjeta blanca circular de soporte para el logo oficial -->
      <g filter="url(#dropShadow)">
        <circle cx="160" cy="150" r="88" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      </g>

      <!-- Badge de Ubicación / Tagline -->
      <g transform="translate(280, 85)">
        <rect x="0" y="0" width="280" height="34" rx="17" fill="#F9A825" />
        <text x="140" y="22" font-family="Montserrat, Arial, sans-serif" font-size="12" font-weight="800" fill="#0f1f33" text-anchor="middle" letter-spacing="1.5">
          ESQUEL · PATAGONIA ARGENTINA
        </text>
      </g>

      <!-- Título Principal Institucional -->
      <text x="280" y="165" font-family="Montserrat, Arial, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
        FUNDACIÓN
      </text>
      <text x="280" y="215" font-family="Montserrat, Arial, sans-serif" font-size="34" font-weight="700" fill="#4ade80" letter-spacing="0.5">
        EDUCATIVA ESQUEL
      </text>

      <!-- Línea divisoria elegante -->
      <line x1="80" y1="280" x2="620" y2="280" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

      <!-- Bajada Institucional / Niveles -->
      <text x="80" y="325" font-family="Montserrat, Arial, sans-serif" font-size="22" font-weight="600" fill="#ffffff">
        Comunidad Educativa en Valores
      </text>

      <text x="80" y="365" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="500" fill="#cbd5e1">
        • Nivel Inicial (Salas de 3, 4 y 5 años)
      </text>
      <text x="80" y="400" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="500" fill="#cbd5e1">
        • Nivel Primario con Inglés Intensivo
      </text>
      <text x="80" y="435" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="500" fill="#cbd5e1">
        • Nivel Secundario en Ciencias Naturales
      </text>

      <!-- Pill de Admisiones y Certificaciones -->
      <g transform="translate(80, 480)">
        <rect x="0" y="0" width="460" height="46" rx="23" fill="rgba(255, 255, 255, 0.12)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1.5" />
        <circle cx="24" cy="23" r="8" fill="#4ade80" />
        <text x="44" y="29" font-family="Montserrat, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">
          Admisiones Abiertas · Cambridge Preparation
        </text>
      </g>

      <!-- Footer URL -->
      <text x="80" y="580" font-family="Montserrat, Arial, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" letter-spacing="1">
        🌐 fundacionesquel.edu.ar
      </text>
    </svg>
  `;

  // 4. Componer la imagen final
  const compositeBuffer = await sharp(bgResized)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      },
      {
        input: logoResized,
        top: 150 - (logoSize / 2),
        left: 160 - (logoSize / 2)
      }
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  // Guardar en public/og-image.jpg y public/og-image.png
  fs.writeFileSync(outputPathJpg, compositeBuffer);
  fs.writeFileSync(outputPathPng, compositeBuffer);
  fs.writeFileSync(artifactPath, compositeBuffer);

  console.log('✅ Open Graph banner generated successfully at:', outputPathJpg);
}

createOgBanner().catch(console.error);
