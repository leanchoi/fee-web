export interface Reinscripcion2027Input {
  // Estudiante
  studentName: string;
  studentDni: string;
  school: string;
  studentGrade: string;
  studentLevel?: string;
  hasSiblings: boolean;
  siblingDetails?: string;

  // Responsable 1
  parent1Name: string;
  parent1Dni: string;
  parent1Relationship: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Address: string;
  parent1City: string;
  parent1PostalCode: string;

  // Responsable 2
  isSingleParent: boolean;
  parent2Name?: string;
  parent2Dni?: string;
  parent2Relationship?: string;
  parent2Phone?: string;
  parent2Email?: string;
  parent2Address?: string;
  parent2City?: string;
  parent2PostalCode?: string;

  // Facturación
  billingName: string;
  billingCuit: string;
  billingTaxCondition: string;
  billingEmail: string;
  billingAddress: string;

  // Declaraciones y Firmas
  contractAccepted: boolean;
  dataAccepted: boolean;
  termsAccepted: boolean;
  signature1Data: string | null;
  signature2Data?: string | null;
  comments?: string;
}

export async function submitEnrollment(data: any) {
  try {
    const res = await fetch("/api/enroll.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const rawText = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(rawText);
    } catch {
      return { 
        success: false, 
        error: `Error del servidor (${res.status}): ${rawText.substring(0, 200)}` 
      };
    }
    return json;
  } catch (error: any) {
    return { success: false, error: error.message || "Ocurrió un error al procesar tu solicitud." };
  }
}
