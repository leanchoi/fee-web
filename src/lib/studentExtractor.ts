import { determineLevel, determineSchool } from "./contractGenerator";

export interface ExtractedStudent {
  uniqueId: string;
  enrollmentId: string;
  trackingNumber: string;
  studentType: "Titular" | "Hermano/a declarado/a";
  studentName: string;
  studentDni: string;
  studentLevel: string;
  studentGrade: string;
  school: string;
  hasSiblings: boolean;
  totalSiblingsInFamily: number;
  familyPrimaryStudent: string;
  familyPrimaryDni: string;

  // Responsables
  parent1Name: string;
  parent1Dni: string;
  parent1Relationship: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Address: string;
  parent1City: string;
  parent1PostalCode: string;

  isSingleParent: boolean;
  parent2Name?: string;
  parent2Dni?: string;
  parent2Relationship?: string;
  parent2Phone?: string;
  parent2Email?: string;

  // Facturación
  billingName: string;
  billingCuit: string;
  billingTaxCondition: string;
  billingEmail: string;
  billingAddress: string;

  status: string;
  createdAt: string;
  signature1Data?: string | null;
  signature2Data?: string | null;
  rawEnrollment: any;
}

/**
 * Parsea un texto de hermanos guardado como string si no viene en lista estructurada
 * Ej: "Juan Perez (Nivel Inicial - Sala de 4) | Sofia Perez (Nivel Primario - 2° Grado)"
 */
function parseSiblingDetailsString(detailsStr: string): Array<{ name: string; dni?: string; level: string; grade: string; school: string }> {
  if (!detailsStr || !detailsStr.trim()) return [];
  const parts = detailsStr.split(/[|;\n]+/).map(p => p.trim()).filter(Boolean);
  
  return parts.map(part => {
    let rawPart = part;
    let dni = "";

    // Extraer DNI si viene con formato (DNI 12345678)
    const dniMatch = rawPart.match(/\(DNI\s*([\d\.\-]+)\)/i);
    if (dniMatch) {
      dni = dniMatch[1].replace(/[^0-9]/g, "");
      rawPart = rawPart.replace(/\(DNI\s*[\d\.\-]+\)/i, "").trim();
    }

    // Si viene en formato "Nombre (Nivel - Grado)" o similar
    const match = rawPart.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      const name = match[1].trim();
      const inside = match[2].trim();
      const level = determineLevel(inside);
      const school = determineSchool(level);
      // Extraer grado
      let grade = inside;
      if (inside.includes("-")) {
        const sub = inside.split("-")[1]?.trim();
        if (sub) grade = sub;
      }
      return { name, dni, level, grade, school };
    }

    const level = determineLevel(rawPart);
    const school = determineSchool(level);
    return { name: rawPart, dni, level, grade: "-", school };
  });
}

/**
 * Desglosa una inscripción en entidades de estudiantes independientes (Titular + Hermanos)
 */
export function extractStudentsFromEnrollment(e: any): ExtractedStudent[] {
  if (!e) return [];

  const primaryLevel = e.studentLevel || determineLevel(e.studentGrade, e.school);
  const primarySchool = e.school || determineSchool(primaryLevel);

  // Lista de hermanos
  let siblings: Array<{ name: string; level?: string; grade: string; school?: string; dni?: string }> = [];

  if (e.hasSiblings) {
    if (Array.isArray(e.siblingsList) && e.siblingsList.length > 0) {
      siblings = e.siblingsList.filter((s: any) => s && s.name && s.name.trim().length > 0);
    } else if (typeof e.siblingDetails === "string" && e.siblingDetails.trim().length > 0) {
      siblings = parseSiblingDetailsString(e.siblingDetails);
    }
  }

  const totalInFamily = 1 + siblings.length;

  const baseShared = {
    enrollmentId: e.id,
    trackingNumber: e.trackingNumber || `FEE-2027-${String(e.id || "").substring(0, 5)}`,
    hasSiblings: Boolean(e.hasSiblings && siblings.length > 0),
    totalSiblingsInFamily: totalInFamily,
    familyPrimaryStudent: e.studentName || "-",
    familyPrimaryDni: e.studentDni || "-",

    parent1Name: e.parent1Name || e.tutorName || "-",
    parent1Dni: e.parent1Dni || "-",
    parent1Relationship: e.parent1Relationship || "Madre/Padre/Tutor",
    parent1Phone: e.parent1Phone || e.tutorPhone || "-",
    parent1Email: e.parent1Email || e.tutorEmail || "-",
    parent1Address: e.parent1Address || "-",
    parent1City: e.parent1City || "Esquel",
    parent1PostalCode: e.parent1PostalCode || "9200",

    isSingleParent: Boolean(e.isSingleParent),
    parent2Name: e.parent2Name || "-",
    parent2Dni: e.parent2Dni || "-",
    parent2Relationship: e.parent2Relationship || "-",
    parent2Phone: e.parent2Phone || "-",
    parent2Email: e.parent2Email || "-",

    billingName: e.billingName || e.parent1Name || e.tutorName || "-",
    billingCuit: e.billingCuit || e.parent1Dni || "-",
    billingTaxCondition: e.billingTaxCondition || "Consumidor Final",
    billingEmail: e.billingEmail || e.parent1Email || e.tutorEmail || "-",
    billingAddress: e.billingAddress || e.parent1Address || "-",

    status: e.status || "PENDING",
    createdAt: e.createdAt || new Date().toISOString(),
    signature1Data: e.signature1Data || null,
    signature2Data: e.signature2Data || null,
    rawEnrollment: e
  };

  // 1. Estudiante Titular
  const primaryStudent: ExtractedStudent = {
    ...baseShared,
    uniqueId: `${e.id}-primary`,
    studentType: "Titular",
    studentName: e.studentName || "-",
    studentDni: e.studentDni || "-",
    studentLevel: primaryLevel,
    studentGrade: e.studentGrade || "-",
    school: primarySchool
  };

  // 2. Hermanos/as independientes
  const siblingStudents: ExtractedStudent[] = siblings.map((sib, index) => {
    const sibLevel = sib.level || determineLevel(sib.grade, sib.school);
    const sibSchool = sib.school || determineSchool(sibLevel);

    return {
      ...baseShared,
      uniqueId: `${e.id}-sibling-${index + 1}`,
      studentType: "Hermano/a declarado/a",
      studentName: sib.name.trim(),
      studentDni: sib.dni ? sib.dni.trim() : "- (Legajo familiar)",
      studentLevel: sibLevel,
      studentGrade: sib.grade || "-",
      school: sibSchool
    };
  });

  return [primaryStudent, ...siblingStudents];
}

/**
 * Desglosa una lista completa de trámites de reinscripción en todos sus estudiantes individuales
 */
export function extractAllStudents(enrollmentsList: any[]): ExtractedStudent[] {
  if (!Array.isArray(enrollmentsList)) return [];
  return enrollmentsList.flatMap(e => extractStudentsFromEnrollment(e));
}
