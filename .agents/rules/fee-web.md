# Reglas del Proyecto FEE Web (Fundación Educativa Esquel)

- Respetar el flujo de un formulario único por grupo familiar incluyendo hasta cuatro hermanos (porque: 52 familias generaron un trámite por hijo).
- Limpiar datos y firmas del Responsable 2 al marcar la opción de único responsable (porque: persistían datos residuales en formularios monoparentales).
- Validar DNI estrictamente con 7 u 8 dígitos numéricos sin letras ni símbolos (porque: se registraban formatos no normalizados).
- Validar CUIT de facturación con 8 u 11 dígitos numéricos y algoritmo Módulo 11 de AFIP (porque: se ingresaban identificadores tributarios inválidos).
- Rechazar domicilios que contengan únicamente números o caracteres telefónicos (porque: varias familias ingresaban números de teléfono en el domicilio).
- Mantener sincronizados los archivos de la API PHP en 'api/' y 'public/api/' (porque: Hostinger sirve endpoints desde rutas públicas).
- Generar slugs de notas compatibles con exportación estática para evitar errores 404 (porque: los links a posts nuevos fallaban en Hostinger).
- Tomar la última presentación por fecha como trámite vigente oficial en la consolidación familiar (porque: 5 familias corrigieron datos en segundos envíos).
- Identificar y alertar discrepancias de teléfonos, CUITs y domicilios entre presentaciones de una misma familia (porque: re-envíos presentaban datos contradictorios).
- Exportar padrones administrativos en CSV UTF-8 con BOM y separador punto y coma (porque: garantiza compatibilidad nativa con Microsoft Excel en español).
- Mantener la distribución institucional estricta entre Escuela 1030 (Inicial/Primario) y Escuela 1739 (Secundario) (porque: la administración escolar requiere padrones segregados).
- Utilizar exclusivamente el banco de 26 fotografías reales institucionales evitando imágenes sintéticas o genéricas (porque: es directiva visual estricta del cliente).
- Restringir la pestaña de gestión de usuarios exclusivamente al rol SUPER_ADMIN (porque: previene escalamiento indebido de privilegios).
- Asegurar que el contrato PDF incluya a todos los hijos y responsables correspondientes (porque: cada trámite representa un contrato marco vinculante).
