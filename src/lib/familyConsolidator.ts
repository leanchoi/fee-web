import { determineLevel, determineSchool } from "./contractGenerator";

export interface ConsolidatedChild {
  dni: string;
  name: string;
  school: string;
  level: string;
  grade: string;
  isTitularInActiveSubmission: boolean;
  sourceTrackingNumber: string;
}

export interface FamilyDiscrepancy {
  field: "phone" | "address" | "cuit" | "parent2" | "student_grade" | "student_dni";
  description: string;
  severity: "high" | "medium" | "low";
}

export interface ClassifiedFamilySubmission {
  raw: any;
  id: string;
  trackingNumber: string;
  createdAt: string;
  studentName: string;
  studentDni: string;
  isOfficialForStudent: boolean;
  statusBadge: "VIGENTE OFICIAL" | "HISTÓRICO / REEMPLAZADO";
  statusReason: string;
}

export interface ConsolidatedFamilyGroup {
  familyKey: string;
  familyDisplayName: string;
  activeSubmission: any;
  allSubmissions: any[];
  classifiedSubmissions: ClassifiedFamilySubmission[];
  officialSubmissionsCount: number;
  historicalSubmissionsCount: number;
  isMultiSubmission: boolean;
  totalSubmissions: number;
  children: ConsolidatedChild[];
  totalChildren: number;
  discrepancies: FamilyDiscrepancy[];
  hasDiscrepancies: boolean;

  // Datos vigentes (de la última presentación)
  activeTrackingNumber: string;
  activeCreatedAt: string;
  parent1Name: string;
  parent1Dni: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Address: string;
  parent2Name: string;
  parent2Dni: string;
  isSingleParent: boolean;
  billingName: string;
  billingCuit: string;
  billingEmail: string;
  billingTaxCondition: string;
}

export interface CleanBaseStudent {
  id: string;
  studentDni: string;
  studentName: string;
  school: string;
  studentLevel: string;
  studentGrade: string;
  isTitular: boolean;
  
  // Trámite Vigente
  trackingNumber: string;
  submittedAt: string;
  familyKey: string;

  // Responsables Vigentes
  parent1Name: string;
  parent1Dni: string;
  parent1Relationship: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Address: string;
  parent1City: string;
  parent1PostalCode: string;
  isSingleParent: boolean;
  parent2Name: string;
  parent2Dni: string;
  parent2Relationship: string;
  parent2Phone?: string;
  parent2Email?: string;
  parent2Address?: string;
  parent2City?: string;
  parent2PostalCode?: string;

  // Facturación Vigente
  billingName: string;
  billingCuit: string;
  billingTaxCondition: string;
  billingEmail: string;
  billingAddress: string;

  // Firmas digitalizadas
  signature1Data?: string | null;
  signature2Data?: string | null;

  // Hermanos
  hasSiblings: boolean;
  totalSiblingsInFamily: number;
  siblingsSummary: string;
  hasSubmissionDiscrepancy: boolean;
}

function cleanDigits(val?: string | number | null): string {
  if (!val) return "";
  return String(val).replace(/[^0-9]/g, "");
}

function normalizeName(val?: string | null): string {
  if (!val) return "";
  return val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parsea un texto de hermanos si viene como string
 */
function parseSiblingsFromString(detailsStr: string): Array<{ name: string; dni: string; level: string; grade: string; school: string }> {
  if (!detailsStr || !detailsStr.trim()) return [];
  const parts = detailsStr.split(/[|;\n]+/).map(p => p.trim()).filter(Boolean);

  return parts.map(part => {
    let raw = part;
    let dni = "";
    const dniMatch = raw.match(/\(DNI\s*([\d\.\-]+)\)/i);
    if (dniMatch) {
      dni = cleanDigits(dniMatch[1]);
      raw = raw.replace(/\(DNI\s*[\d\.\-]+\)/i, "").trim();
    }

    const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      const name = match[1].trim();
      const inside = match[2].trim();
      const level = determineLevel(inside);
      const school = determineSchool(level);
      let grade = inside;
      if (inside.includes("-")) {
        const sub = inside.split("-")[1]?.trim();
        if (sub) grade = sub;
      }
      return { name, dni, level, grade, school };
    }

    const level = determineLevel(raw);
    const school = determineSchool(level);
    return { name: raw, dni, level, grade: "-", school };
  });
}

/**
 * Agrupa todos los trámites presentados en Familias Consolidadas y genera Padrón de Base Limpia
 * Regla rectora de Contratos:
 * - Cada estudiante tiene su contrato individual.
 * - Si una familia presentó un trámite para el Hijo A y otro para el Hijo B, AMBOS son VIGENTES OFICIALES.
 * - Solo se marca como HISTÓRICO si hubo re-envíos para el MISMO estudiante.
 */
export function consolidateFamilies(enrollments: any[]): {
  families: ConsolidatedFamilyGroup[];
  cleanStudents: CleanBaseStudent[];
  metrics: {
    totalRawSubmissions: number;
    totalFamilies: number;
    totalUniqueStudents: number;
    duplicateSubmissionsAbsorbed: number;
    familiesWithDuplicates: number;
    familiesWithDiscrepancies: number;
    escuela1030Count: number;
    escuela1739Count: number;
  };
} {
  const reinscripciones = (enrollments || []).filter(e => e.type !== "preinscripcion_general");
  
  // 1. Agrupar por clave familiar primaria (DNI Resp 1 o CUIT Facturación o DNI Titular)
  const familyBuckets = new Map<string, any[]>();

  for (const item of reinscripciones) {
    const p1Dni = cleanDigits(item.parent1Dni || item.tutorPhone);
    const billingCuit = cleanDigits(item.billingCuit);
    const studentDni = cleanDigits(item.studentDni);
    
    let key = "";
    if (p1Dni && p1Dni.length >= 7) {
      key = `P1-${p1Dni}`;
    } else if (billingCuit && billingCuit.length >= 7) {
      key = `CUIT-${billingCuit}`;
    } else if (studentDni && studentDni.length >= 7) {
      key = `STU-${studentDni}`;
    } else {
      key = `NAME-${normalizeName(item.parent1Name || item.billingName || item.studentName)}`;
    }

    if (!familyBuckets.has(key)) {
      familyBuckets.set(key, []);
    }
    familyBuckets.get(key)!.push(item);
  }

  // 2. Procesar cada familia y clasificar trámites por estudiante
  const mergedFamilies: ConsolidatedFamilyGroup[] = [];
  const processedKeys = new Set<string>();

  for (const [key, items] of familyBuckets.entries()) {
    if (processedKeys.has(key)) continue;
    processedKeys.add(key);

    const collectedItems = [...items];

    // Ordenar trámites por fecha de creación descendente (el más nuevo primero)
    collectedItems.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const activeItem = collectedItems[0];
    const isMultiSubmission = collectedItems.length > 1;

    // Detectar discrepancias entre presentaciones
    const discrepancies: FamilyDiscrepancy[] = [];
    if (isMultiSubmission) {
      const phones = new Set(collectedItems.map(i => cleanDigits(i.parent1Phone || i.tutorPhone)).filter(Boolean));
      if (phones.size > 1) {
        discrepancies.push({
          field: "phone",
          description: `Se informaron celulares distintos entre los trámites presentados (${Array.from(phones).join(" / ")}).`,
          severity: "medium"
        });
      }

      const cuits = new Set(collectedItems.map(i => cleanDigits(i.billingCuit)).filter(Boolean));
      if (cuits.size > 1) {
        discrepancies.push({
          field: "cuit",
          description: `Se informaron CUITs de facturación distintos (${Array.from(cuits).join(" / ")}).`,
          severity: "high"
        });
      }

      const addresses = new Set(collectedItems.map(i => (i.parent1Address || "").trim().toLowerCase()).filter(Boolean));
      if (addresses.size > 1) {
        discrepancies.push({
          field: "address",
          description: `El domicilio declarado difiere entre las presentaciones.`,
          severity: "low"
        });
      }

      const singleParentFlags = new Set(collectedItems.map(i => Boolean(i.isSingleParent)));
      if (singleParentFlags.size > 1) {
        discrepancies.push({
          field: "parent2",
          description: `Contradicción en Responsable 2: en un trámite figura segundo responsable y en otro se declaró único responsable.`,
          severity: "medium"
        });
      }
    }

    // Clasificar presentaciones por estudiante titular (para distinguir entre "trámite por hermano" vs "re-envío del mismo alumno")
    const studentSubmissionsMap = new Map<string, any[]>();
    for (const sub of collectedItems) {
      const stuKey = cleanDigits(sub.studentDni) || normalizeName(sub.studentName);
      if (!studentSubmissionsMap.has(stuKey)) {
        studentSubmissionsMap.set(stuKey, []);
      }
      studentSubmissionsMap.get(stuKey)!.push(sub);
    }

    const classifiedSubmissions: ClassifiedFamilySubmission[] = [];
    let officialCount = 0;
    let historicalCount = 0;

    for (const sub of collectedItems) {
      const stuKey = cleanDigits(sub.studentDni) || normalizeName(sub.studentName);
      const studentSubs = studentSubmissionsMap.get(stuKey) || [];
      // El más nuevo para este estudiante es el primero (ya ordenados desc)
      const isWinningForThisStudent = studentSubs.length > 0 && studentSubs[0].id === sub.id;

      if (isWinningForThisStudent) {
        officialCount++;
        classifiedSubmissions.push({
          raw: sub,
          id: sub.id,
          trackingNumber: sub.trackingNumber || sub.id,
          createdAt: sub.createdAt || "",
          studentName: sub.studentName || "Sin Nombre",
          studentDni: sub.studentDni || "-",
          isOfficialForStudent: true,
          statusBadge: "VIGENTE OFICIAL",
          statusReason: `Contrato oficial vigente para ${sub.studentName}`
        });
      } else {
        historicalCount++;
        classifiedSubmissions.push({
          raw: sub,
          id: sub.id,
          trackingNumber: sub.trackingNumber || sub.id,
          createdAt: sub.createdAt || "",
          studentName: sub.studentName || "Sin Nombre",
          studentDni: sub.studentDni || "-",
          isOfficialForStudent: false,
          statusBadge: "HISTÓRICO / REEMPLAZADO",
          statusReason: `Reemplazado por presentación posterior para ${sub.studentName}`
        });
      }
    }

    // Extraer hijos únicos de esta familia y mapear su trámite de origen
    const childrenMap = new Map<string, ConsolidatedChild>();
    const childDirectSubmissionMap = new Map<string, any>();

    for (const sub of collectedItems) {
      // Titular
      const stuDni = cleanDigits(sub.studentDni);
      const stuName = (sub.studentName || "").trim();
      const stuLevel = sub.studentLevel || determineLevel(sub.studentGrade, sub.school);
      const stuSchool = sub.school || determineSchool(stuLevel);
      const stuGrade = sub.studentGrade || "-";

      const childKey = stuDni ? `DNI-${stuDni}` : `NAME-${normalizeName(stuName)}`;
      if (!childDirectSubmissionMap.has(childKey)) {
        childDirectSubmissionMap.set(childKey, sub);
      }

      if (!childrenMap.has(childKey)) {
        childrenMap.set(childKey, {
          dni: stuDni || sub.studentDni || "-",
          name: stuName,
          school: stuSchool,
          level: stuLevel,
          grade: stuGrade,
          isTitularInActiveSubmission: true,
          sourceTrackingNumber: sub.trackingNumber || sub.id
        });
      }

      // Hermanos declarados
      let rawSiblings: any[] = [];
      if (sub.hasSiblings) {
        if (Array.isArray(sub.siblingsList) && sub.siblingsList.length > 0) {
          rawSiblings = sub.siblingsList;
        } else if (typeof sub.siblingDetails === "string" && sub.siblingDetails.trim()) {
          rawSiblings = parseSiblingsFromString(sub.siblingDetails);
        }
      }

      for (const sib of rawSiblings) {
        if (!sib || !sib.name || !sib.name.trim()) continue;
        const sibDni = cleanDigits(sib.dni);
        const sibName = sib.name.trim();
        const sibLevel = sib.level || determineLevel(sib.grade, sib.school);
        const sibSchool = sib.school || determineSchool(sibLevel);
        const sibGrade = sib.grade || "-";

        const sibKey = sibDni ? `DNI-${sibDni}` : `NAME-${normalizeName(sibName)}`;
        if (!childrenMap.has(sibKey)) {
          childrenMap.set(sibKey, {
            dni: sibDni || sib.dni || "-",
            name: sibName,
            school: sibSchool,
            level: sibLevel,
            grade: sibGrade,
            isTitularInActiveSubmission: false,
            sourceTrackingNumber: sub.trackingNumber || sub.id
          });
        }
      }
    }

    const childrenList = Array.from(childrenMap.values());

    const familyDisplayName = activeItem.parent2Name && !activeItem.isSingleParent
      ? `Familia ${activeItem.parent1Name} & ${activeItem.parent2Name}`
      : `Familia ${activeItem.parent1Name || activeItem.billingName || "Sin Titular"}`;

    mergedFamilies.push({
      familyKey: key,
      familyDisplayName,
      activeSubmission: activeItem,
      allSubmissions: collectedItems,
      classifiedSubmissions,
      officialSubmissionsCount: officialCount,
      historicalSubmissionsCount: historicalCount,
      isMultiSubmission,
      totalSubmissions: collectedItems.length,
      children: childrenList,
      totalChildren: childrenList.length,
      discrepancies,
      hasDiscrepancies: discrepancies.length > 0,

      activeTrackingNumber: activeItem.trackingNumber || `FEE-2027-${String(activeItem.id || "").substring(0, 5)}`,
      activeCreatedAt: activeItem.createdAt || new Date().toISOString(),
      parent1Name: activeItem.parent1Name || activeItem.tutorName || "-",
      parent1Dni: activeItem.parent1Dni || "-",
      parent1Phone: activeItem.parent1Phone || activeItem.tutorPhone || "-",
      parent1Email: activeItem.parent1Email || activeItem.tutorEmail || "-",
      parent1Address: activeItem.parent1Address || "-",
      parent2Name: activeItem.isSingleParent ? "Único/a Responsable Declarado/a" : (activeItem.parent2Name || "-"),
      parent2Dni: activeItem.isSingleParent ? "N/A" : (activeItem.parent2Dni || "-"),
      isSingleParent: Boolean(activeItem.isSingleParent),
      billingName: activeItem.billingName || activeItem.parent1Name || "-",
      billingCuit: activeItem.billingCuit || activeItem.parent1Dni || "-",
      billingEmail: activeItem.billingEmail || activeItem.parent1Email || "-",
      billingTaxCondition: activeItem.billingTaxCondition || "Consumidor Final"
    });
  }

  // 3. Generar la Base Limpia de Estudiantes (1 fila y 1 contrato por alumno único)
  const cleanStudents: CleanBaseStudent[] = [];
  let esc1030Count = 0;
  let esc1739Count = 0;

  for (const fam of mergedFamilies) {
    const activeSub = fam.activeSubmission;
    const allSiblingsNames = fam.children.map(c => c.name);

    for (const ch of fam.children) {
      const isSecundario = ch.school.includes("1739") || ch.level.toLowerCase().includes("secundario");
      if (isSecundario) {
        esc1739Count++;
      } else {
        esc1030Count++;
      }

      const otherSiblings = allSiblingsNames.filter(n => n !== ch.name);

      // Buscar si el alumno tiene un trámite directo o usa el trámite de la familia
      const directSub = fam.allSubmissions.find(s => {
        const sDni = cleanDigits(s.studentDni);
        const cDni = cleanDigits(ch.dni);
        if (sDni && cDni && sDni === cDni) return true;
        return normalizeName(s.studentName) === normalizeName(ch.name);
      }) || activeSub;

      cleanStudents.push({
        id: `clean-${ch.dni || normalizeName(ch.name)}-${fam.familyKey}`,
        studentDni: ch.dni,
        studentName: ch.name,
        school: ch.school,
        studentLevel: ch.level,
        studentGrade: ch.grade,
        isTitular: ch.isTitularInActiveSubmission,

        trackingNumber: directSub.trackingNumber || fam.activeTrackingNumber,
        submittedAt: directSub.createdAt || fam.activeCreatedAt,
        familyKey: fam.familyKey,

        parent1Name: fam.parent1Name,
        parent1Dni: fam.parent1Dni,
        parent1Relationship: directSub.parent1Relationship || activeSub.parent1Relationship || "Madre/Padre/Tutor",
        parent1Phone: fam.parent1Phone,
        parent1Email: fam.parent1Email,
        parent1Address: fam.parent1Address,
        parent1City: directSub.parent1City || activeSub.parent1City || "Esquel",
        parent1PostalCode: directSub.parent1PostalCode || activeSub.parent1PostalCode || "9200",
        isSingleParent: fam.isSingleParent,
        parent2Name: fam.parent2Name,
        parent2Dni: fam.parent2Dni,
        parent2Relationship: directSub.parent2Relationship || activeSub.parent2Relationship || "-",
        parent2Phone: directSub.parent2Phone || activeSub.parent2Phone,
        parent2Email: directSub.parent2Email || activeSub.parent2Email,
        parent2Address: directSub.parent2Address || activeSub.parent2Address,
        parent2City: directSub.parent2City || activeSub.parent2City || "Esquel",
        parent2PostalCode: directSub.parent2PostalCode || activeSub.parent2PostalCode || "9200",

        billingName: fam.billingName,
        billingCuit: fam.billingCuit,
        billingTaxCondition: fam.billingTaxCondition,
        billingEmail: fam.billingEmail,
        billingAddress: directSub.billingAddress || activeSub.billingAddress || fam.parent1Address,

        signature1Data: directSub.signature1Data || activeSub.signature1Data || null,
        signature2Data: directSub.signature2Data || activeSub.signature2Data || null,

        hasSiblings: otherSiblings.length > 0,
        totalSiblingsInFamily: fam.totalChildren,
        siblingsSummary: otherSiblings.join(", ") || "Hijo/a único/a",
        hasSubmissionDiscrepancy: fam.hasDiscrepancies
      });
    }
  }

  // Ordenar lista de familias por nombre
  mergedFamilies.sort((a, b) => a.familyDisplayName.localeCompare(b.familyDisplayName));

  // Ordenar base limpia por Escuela -> Nivel -> Curso -> Nombre
  cleanStudents.sort((a, b) => {
    if (a.school !== b.school) return a.school.localeCompare(b.school);
    if (a.studentGrade !== b.studentGrade) return a.studentGrade.localeCompare(b.studentGrade);
    return a.studentName.localeCompare(b.studentName);
  });

  const totalRaw = reinscripciones.length;
  const totalFamilies = mergedFamilies.length;
  const totalStudents = cleanStudents.length;
  const duplicatesAbsorbed = totalRaw > totalFamilies ? totalRaw - totalFamilies : 0;
  const familiesWithDup = mergedFamilies.filter(f => f.isMultiSubmission).length;
  const familiesWithDisc = mergedFamilies.filter(f => f.hasDiscrepancies).length;

  return {
    families: mergedFamilies,
    cleanStudents,
    metrics: {
      totalRawSubmissions: totalRaw,
      totalFamilies,
      totalUniqueStudents: totalStudents,
      duplicateSubmissionsAbsorbed: duplicatesAbsorbed,
      familiesWithDuplicates: familiesWithDup,
      familiesWithDiscrepancies: familiesWithDisc,
      escuela1030Count: esc1030Count,
      escuela1739Count: esc1739Count
    }
  };
}

/**
 * Exporta la Base Limpia en formato CSV compatible con Microsoft Excel (UTF-8 con BOM)
 */
export function exportCleanBaseToCSV(students: CleanBaseStudent[]): void {
  const headers = [
    "N° Trámite Vigente",
    "Estudiante - Nombre y Apellido",
    "Estudiante - DNI",
    "Escuela",
    "Nivel Educativo",
    "Sala / Grado / Año 2027",
    "Carácter en Formulario",
    "Resp. Parental 1 - Nombre",
    "Resp. Parental 1 - DNI",
    "Resp. Parental 1 - Vínculo",
    "Resp. Parental 1 - Celular",
    "Resp. Parental 1 - Email",
    "Resp. Parental 1 - Domicilio",
    "Único Responsable Parental",
    "Resp. Parental 2 - Nombre",
    "Resp. Parental 2 - DNI",
    "Titular de Facturación",
    "CUIT / DNI Facturación",
    "Condición IVA",
    "Email Facturación",
    "Hermanos en Fundación",
    "Detalle de Hermanos",
    "Fecha y Hora de Presentación Vigente"
  ];

  const rows = students.map(s => [
    s.trackingNumber,
    `"${s.studentName.replace(/"/g, '""')}"`,
    s.studentDni,
    `"${s.school}"`,
    `"${s.studentLevel}"`,
    `"${s.studentGrade}"`,
    s.isTitular ? "Titular Principal" : "Hijo/a adicional declarado",
    `"${s.parent1Name.replace(/"/g, '""')}"`,
    s.parent1Dni,
    `"${s.parent1Relationship}"`,
    `"${s.parent1Phone}"`,
    `"${s.parent1Email}"`,
    `"${s.parent1Address.replace(/"/g, '""')}"`,
    s.isSingleParent ? "SI" : "NO",
    `"${s.parent2Name.replace(/"/g, '""')}"`,
    s.parent2Dni,
    `"${s.billingName.replace(/"/g, '""')}"`,
    s.billingCuit,
    `"${s.billingTaxCondition}"`,
    `"${s.billingEmail}"`,
    s.hasSiblings ? `SI (${s.totalSiblingsInFamily} hijos)` : "NO",
    `"${s.siblingsSummary.replace(/"/g, '""')}"`,
    s.submittedAt
  ]);

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `FEE_2027_BASE_LIMPIA_DEPURADA_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
