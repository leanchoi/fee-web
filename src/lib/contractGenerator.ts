import { jsPDF } from "jspdf";
import { INSTITUTIONAL_SIGNATURE_PNG } from "./institutionalSignature";

export interface SiblingData {
  id?: string;
  name: string;
  level?: string;
  school: string; // "Escuela N.º 1030" | "Escuela N.º 1739"
  grade: string;
}

export interface EnrollmentContractData {
  id?: string;
  trackingNumber?: string;
  createdAt?: string;

  // Estudiante
  studentName: string;
  studentDni: string;
  studentLevel?: string; // "Nivel Inicial" | "Nivel Primario" | "Nivel Secundario"
  level?: string;        // Alias for compatibility
  school: string;        // "Escuela N.º 1030" | "Escuela N.º 1739"
  studentGrade: string;  // "Sala de 3", "1° Grado", "3° Año", etc.
  hasSiblings?: boolean;
  siblingDetails?: string;
  siblingsList?: SiblingData[];

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
  isSingleParent?: boolean;
  parent2Name?: string;
  parent2Dni?: string;
  parent2Relationship?: string;
  parent2Phone?: string;
  parent2Email?: string;
  parent2Address?: string;
  parent2City?: string;
  parent2PostalCode?: string;

  // Facturación
  billingName?: string;
  billingCuit?: string;
  billingTaxCondition?: string;
  billingEmail?: string;
  billingAddress?: string;

  // Firmas
  signature1Data?: string | null;
  signature2Data?: string | null;
  signedAt?: string;
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export function determineLevel(grade: string, school?: string): string {
  const g = (grade || "").toLowerCase();
  if (g.includes("sala")) return "Nivel Inicial";
  if (g.includes("grado")) return "Nivel Primario";
  if (g.includes("año")) return "Nivel Secundario";
  if (school && school.includes("1739")) return "Nivel Secundario";
  return "Nivel Primario";
}

export function determineSchool(level: string): string {
  const lvl = (level || "").toLowerCase();
  if (lvl.includes("secundario") || lvl.includes("1739")) return "Escuela N.º 1739";
  return "Escuela N.º 1030";
}

function getHonorific(relationship?: string): string {
  if (!relationship) return "Sr./Sra.";
  const rel = relationship.toLowerCase();
  if (rel.includes("padre") || rel.includes("padre/tutor") || rel === "tutor") return "Sr.";
  if (rel.includes("madre") || rel.includes("madre/tutora") || rel === "tutora") return "Sra.";
  return "Sr./Sra.";
}

/**
 * Genera el documento PDF del Contrato Marco oficial optimizado para 4 páginas exactas
 */
export function generateContractPdf(data?: EnrollmentContractData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isBlank = !data;
  const now = data?.signedAt ? new Date(data.signedAt) : new Date();
  const day = isBlank ? "_____" : String(now.getDate());
  const month = isBlank ? "___________________" : MONTH_NAMES[now.getMonth()];
  const year = isBlank ? "_________" : String(now.getFullYear());

  const p1Title = isBlank ? "Sr./Sra." : getHonorific(data?.parent1Relationship);
  const p1Name = isBlank ? "_____________________________________________________" : data.parent1Name;
  const p1Dni = isBlank ? "__________________" : data.parent1Dni;
  const isSingle = !isBlank && data.isSingleParent;

  const p2Title = isBlank ? "Sr./Sra." : getHonorific(data?.parent2Relationship);
  const p2Name = isBlank
    ? "_________________________________________"
    : (isSingle ? "--- (Único responsable parental habilitado) ---" : (data.parent2Name || "---"));
  const p2Dni = isBlank
    ? "_____________________"
    : (isSingle ? "---" : (data.parent2Dni || "---"));

  const address = isBlank
    ? "______________________________________________________________"
    : data.parent1Address;
  const city = isBlank ? "____________________________" : (data.parent1City || "Esquel");

  const studentName = isBlank
    ? "______________________________________________________________________________________"
    : data.studentName;
  const studentDni = isBlank ? "__________________" : data.studentDni;
  const cycleYear = "2027";
  const grade = isBlank ? "_______________________" : data.studentGrade;
  
  const level = isBlank
    ? "_________________________________"
    : (data.studentLevel || determineLevel(data.studentGrade, data.school));

  const school = isBlank 
    ? "Escuela N.º 1030 / Escuela N.º 1739" 
    : (data.school || determineSchool(level));

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2; // 174mm
  const bottomLimit = pageHeight - 16; // 281mm

  let currentPage = 1;

  const drawHeader = (pNum: number) => {
    // Header institucional
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(24, 60, 52); // Brand green
    doc.text("FUNDACIÓN EDUCATIVA ESQUEL", marginX, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text("Escuela N.º 1030 | Escuela N.º 1739 — Chacabuco Nº 1029, Esquel, Chubut", marginX, 15.5);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, 17.5, pageWidth - marginX, 17.5);

    // Número de página al pie
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`{  ${pNum}  }`, pageWidth / 2, pageHeight - 9, { align: "center" });
  };

  drawHeader(currentPage);
  let y = 23.5;

  const checkPageBreak = (neededHeight: number): void => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      currentPage++;
      drawHeader(currentPage);
      y = 23.5;
    }
  };

  const printParagraph = (text: string, options?: { bold?: boolean; size?: number; lineHeight?: number; spaceAfter?: number }): void => {
    const bold = options?.bold || false;
    const size = options?.size || 8.6;
    const lineHeight = options?.lineHeight || 3.75;
    const spaceAfter = options?.spaceAfter ?? 2.0;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(30, 41, 59);

    const lines = doc.splitTextToSize(text, contentWidth);
    const totalBlockHeight = lines.length * lineHeight;

    checkPageBreak(totalBlockHeight + spaceAfter);

    doc.text(lines, marginX, y);
    y += totalBlockHeight + spaceAfter;
  };

  const printClause = (clauseTitle: string, clauseBody: string): void => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    const titleLines = doc.splitTextToSize(clauseTitle, contentWidth);
    const titleHeight = titleLines.length * 3.75;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    const bodyLines = doc.splitTextToSize(clauseBody, contentWidth);
    const bodyHeight = bodyLines.length * 3.75;

    // Si no entra el título y al menos 2 líneas del cuerpo, hacemos salto
    checkPageBreak(titleHeight + Math.min(bodyHeight, 10));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, marginX, y);
    y += titleHeight + 0.8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.setTextColor(30, 41, 59);
    doc.text(bodyLines, marginX, y);
    y += bodyHeight + 2.2;
  };

  const printSectionHeader = (title: string): void => {
    checkPageBreak(9);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, y);
    y += 4.5;
  };

  // Título Principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS EDUCATIVOS", pageWidth / 2, y, { align: "center" });
  y += 5.5;

  // Comparecencia
  let comparecencia = "";
  if (isSingle) {
    comparecencia = `En la ciudad de Esquel, a los ${day} días del mes de ${month} del año ${year}, entre la Fundación Educativa Esquel, con domicilio legal en Chacabuco Nº 1029 de la ciudad de Esquel, Provincia del Chubut, en adelante denominada “LA FUNDACIÓN”, y por la otra parte ${p1Title} ${p1Name} D.N.I. Nº ${p1Dni} (en carácter de único/a responsable parental habilitado/a), quien constituye domicilio en ${address} de la ciudad de ${city}, en adelante denominado/a “EL/LA RESPONSABLE PARENTAL”, se celebra el presente contrato sujeto a las siguientes cláusulas y condiciones particulares.`;
  } else {
    comparecencia = `En la ciudad de Esquel, a los ${day} días del mes de ${month} del año ${year}, entre la Fundación Educativa Esquel, con domicilio legal en Chacabuco Nº 1029 de la ciudad de Esquel, Provincia del Chubut, en adelante denominada “LA FUNDACIÓN”, y por la otra parte ${p1Title} ${p1Name} D.N.I. Nº ${p1Dni} y ${p2Title} ${p2Name} D.N.I. Nº ${p2Dni}, quienes constituyen domicilio en ${address} de la ciudad de ${city}, en adelante denominados “LOS RESPONSABLES PARENTALES”, se celebra el presente contrato sujeto a las siguientes cláusulas y condiciones particulares.`;
  }
  printParagraph(comparecencia, { spaceAfter: 3.0 });

  // Disposiciones Preliminares
  printSectionHeader("DISPOSICIONES PRELIMINARES");

  printClause(
    "Cláusula 1° – Naturaleza del contrato",
    "El presente constituye un contrato marco de prestación de servicios educativos celebrado entre LA FUNDACIÓN y LOS RESPONSABLES PARENTALES del/de la alumno/a, destinado a regular el vínculo educativo mientras subsista la permanencia del/de la alumno/a en cualquiera de los establecimientos dependientes de LA FUNDACIÓN.\n" +
    "La firma del presente instrumento tendrá vigencia continuada durante toda la trayectoria escolar del/de la alumno/a dentro de LA FUNDACIÓN, sin necesidad de suscribir un nuevo contrato en cada ciclo lectivo, salvo modificación sustancial de las condiciones contractuales o requerimiento expreso de LA FUNDACIÓN.\n" +
    "La matriculación anual, reinscripción y continuidad del/de la alumno/a en cada ciclo lectivo quedarán sujetas al cumplimiento de los requisitos académicos, administrativos, arancelarios y de convivencia establecidos en el presente contrato, en la normativa educativa vigente y en las reglamentaciones institucionales aplicables.\n" +
    "La reserva de vacante y reinscripción anual no operarán de manera automática, quedando supeditadas al cumplimiento de las condiciones vigentes al momento de cada ciclo lectivo, y requerirá la aceptación anual expresa de las condiciones educativas y arancelarias vigentes de los RESPONSABLES PARENTALES."
  );

  printClause(
    "Cláusula 2° – Documentación complementaria",
    "Forman parte integrante del presente contrato los siguientes documentos institucionales:\n" +
    "•  Acuerdo Escolar de Convivencia correspondiente al nivel educativo solicitado.\n" +
    "•  Proyecto Educativo Institucional.\n" +
    "•  Planilla de datos administrativos y de facturación, en la que deberán consignarse los datos de los RESPONSABLES PARENTALES y adjuntarse copia de sus respectivos documentos nacionales de identidad (DNI), así como de un servicio o documentación que permita acreditar y corroborar el domicilio declarado, especificando asimismo cuál de los RESPONSABLES PARENTALES será el designado a efectos de la facturación.\n" +
    "El RESPONSABLE PARENTAL así identificado y el domicilio informado constituirán, respectivamente, la persona y el domicilio principales a efectos de las comunicaciones y notificaciones que correspondan, incluyendo, entre otras, aquellas vinculadas con situaciones de mora o incumplimiento de obligaciones."
  );

  // CAPÍTULO I
  printSectionHeader("CAPÍTULO I: ASPECTOS INSTITUCIONALES");

  printClause(
    "Cláusula 3° – Servicio educativo y marco institucional",
    "LA FUNDACIÓN se compromete a brindar el servicio educativo conforme a la normativa oficial vigente y de acuerdo con los planes y diseños curriculares aprobados por el Ministerio de Educación de la Provincia del Chubut, incorporando además propuestas pedagógicas complementarias acordes a su ideario institucional.\n" +
    "La actividad educativa se desarrollará conforme al Proyecto Educativo Institucional y al Acuerdo Escolar de Convivencia vigentes, cuyos contenidos estarán disponibles para conocimiento de LOS RESPONSABLES PARENTALES.\n" +
    "La matriculación y permanencia del/de la alumno/a implican el conocimiento y aceptación razonable de dichas reglamentaciones institucionales, en tanto resulten compatibles con la normativa educativa y el ordenamiento jurídico vigente."
  );

  printClause(
    "Cláusula 4° – Reserva de vacante",
    `A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reserva una vacante para el/la alumno/a ${studentName} D.N.I. Nº ${studentDni} desde el ciclo lectivo ${cycleYear} y hasta la finalización del presente contrato, correspondiente al año/grado/sala ${grade} de ${level} (${school}). A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reservará una vacante para el/la alumno/a individualizado/a en la documentación de matriculación, exclusivamente para el ciclo lectivo correspondiente. La continuidad en ciclos posteriores requerirá completar el procedimiento anual de reinscripción y cumplir las condiciones vigentes para cada ciclo lectivo.`
  );

  printClause(
    "Cláusula 5° – Adhesión al proyecto institucional",
    "LOS RESPONSABLES PARENTALES declaran conocer y adherir al Proyecto Educativo Institucional, al Acuerdo Escolar de Convivencia y a las reglamentaciones internas vigentes de LA FUNDACIÓN.\n" +
    "Asimismo, aceptan la organización institucional, pedagógica y administrativa dispuesta por LA FUNDACIÓN, incluyendo la distribución horaria, conformación de cursos, reasignación de divisiones y demás adecuaciones razonablemente necesarias para el correcto funcionamiento del servicio educativo.\n" +
    "Toda modificación sustancial que pudiera afectar significativamente las condiciones esenciales de prestación del servicio educativo será informada oportunamente mediante los canales institucionales habituales, siempre que no importen modificaciones irrazonables o sustanciales del servicio originalmente contratado."
  );

  printClause(
    "Cláusula 6° – Reinscripción y prestación del servicio educativo",
    "Cumplidas las condiciones académicas, administrativas y arancelarias previstas en el presente contrato, y sujeto a disponibilidad institucional, LA FUNDACIÓN podrá reinscribir al/la alumno/a para el ciclo lectivo siguiente."
  );

  printClause(
    "Cláusula 7° – Uso institucional de imágenes",
    "LOS RESPONSABLES PARENTALES autorizan a LA FUNDACIÓN a utilizar imágenes y registros audiovisuales del/de la alumno/a obtenidos en actividades escolares, pedagógicas, recreativas, culturales e institucionales, con fines exclusivamente pedagógicos, divulgativos e institucionales, en publicaciones oficiales, plataformas educativas, sitio web y redes sociales de LA FUNDACIÓN, sin fines de lucro comercial y en el marco de la normativa de protección de datos personales y de la niñez y adolescencia.\n" +
    "Dicha autorización podrá ser revocada o limitada en cualquier momento mediante notificación expresa y fehaciente por escrito dirigida a la Administración de LA FUNDACIÓN."
  );

  printClause(
    "Cláusula 8° – Firma y validez contractual",
    "El presente contrato podrá ser suscripto en soporte papel mediante firma ológrafa o a través de medios electrónicos mediante firma electrónica, reconociendo ambas partes su plena validez, eficacia jurídica y fuerza obligatoria."
  );

  // CAPÍTULO II
  printSectionHeader("CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS");

  printClause(
    "Cláusula 9° – Aranceles y modalidades de pago",
    "El costo del servicio educativo correspondiente a cada ciclo lectivo se compone de un arancel anual que se divide, a los efectos de su pago, en ONCE (11) cuotas mensuales y consecutivas, correspondientes a los meses de FEBRERO a DICIEMBRE inclusive de cada año.\n" +
    "Las cuotas mensuales vencerán del día 1 al 10 de cada mes. En caso de que el día 10 fuera inhábil o feriado, el vencimiento operará el primer día hábil posterior.\n" +
    "Las cuotas no devengan intereses dentro del período que corre hasta su fecha de vencimiento.\n" +
    "Los pagos deberán realizarse por los medios electrónicos o bancarios que LA FUNDACIÓN habilite oportunamente."
  );

  printClause(
    "Cláusula 10° – Beneficios de terceros y medios de pago",
    "Los descuentos, promociones, reintegros o beneficios derivados de convenios celebrados con entidades bancarias o financieras serán de exclusiva responsabilidad de dichas entidades, no asumiendo LA FUNDACIÓN responsabilidad alguna por su otorgamiento, modificación o suspensión."
  );

  printClause(
    "Cláusula 11° – Descuentos y beneficios arancelarios",
    "LA FUNDACIÓN otorga beneficios arancelarios a familias con más de un/a hijo/a matriculado/a en sus establecimientos:\n" +
    "•  Familias con dos (2) hijos/as: 15% de descuento sobre el valor de la cuota mensual del arancel de menor valor.\n" +
    "•  Familias con tres (3) o más hijos/as: 25% de descuento sobre el valor de las cuotas mensuales de los aranceles de menor valor.\n" +
    "Estos descuentos no son acumulables con otros beneficios arancelarios y caducarán automáticamente en caso de mora en el pago de cualquiera de las cuotas mensuales, reanudándose a partir del mes siguiente al de la cancelación total de las sumas adeudadas."
  );

  printClause(
    "Cláusula 12° – Libre deuda y condición de matrícula",
    "Es condición indispensable para formalizar la matriculación inicial, la reinscripción en cada ciclo lectivo posterior y la reserva definitiva de vacante no registrar deuda exigible por ningún concepto con LA FUNDACIÓN al momento de efectivizarse el trámite correspondiente."
  );

  printClause(
    "Cláusula 13° – Reembolsos",
    "Los importes abonados en concepto de matrícula y cuotas mensuales no serán reintegrables, excepto cuando el/la aspirante no hubiera obtenido vacante por causas no imputables a LOS RESPONSABLES PARENTALES, o mediara cancelación formal de la vacante solicitada con una antelación mínima de diez (10) días corridos previos al inicio del ciclo lectivo correspondiente."
  );

  printClause(
    "Cláusula 14° – Valor de matrícula y formas de pago",
    "El valor de la matrícula para cada ciclo lectivo se fijará conforme a las siguientes pautas:\n" +
    "•  Alumnos/as regulares: El valor de la matrícula para el ciclo lectivo siguiente será equivalente a una coma cuatro (1,4) veces el valor de la cuota mensual vigente al mes de agosto del año en curso.\n" +
    "•  Nuevos/as ingresantes: El valor de la matrícula será equivalente a una coma ocho (1,8) veces el valor de la cuota mensual vigente al mes de agosto del año en curso.\n" +
    "El importe de la matrícula podrá abonarse en un pago único o en hasta cuatro (4) cuotas mensuales iguales y consecutivas, en las condiciones y fechas que LA FUNDACIÓN determine anualmente."
  );

  printClause(
    "Cláusula 15° – Requisitos adicionales para nuevos/as ingresantes",
    "Para los/as alumnos/as que ingresen por primera vez a LA FUNDACIÓN, además de los requisitos generales, será condición necesaria para la matriculación definitiva la acreditación de la documentación académica previa y la aprobación de los procesos de admisión que la institución determine conforme a su Proyecto Educativo Institucional."
  );

  printClause(
    "Cláusula 16° – Modificación de aranceles",
    "Los valores de las cuotas podrán ser actualizados durante los meses de Marzo, Junio y Octubre de cada ciclo lectivo, juntamente con la tasa correspondiente a intereses punitorios.\n" +
    "Asimismo, podrán efectuarse modificaciones extraordinarias cuando se produzcan variaciones sustanciales en costos salariales, cargas sociales, servicios, impuestos, regulaciones estatales u otros factores que impacten significativamente en la estructura económica del servicio educativo.\n" +
    "Toda modificación arancelaria será informada a LOS RESPONSABLES PARENTALES mediante los canales institucionales habituales con antelación razonable."
  );

  printClause(
    "Cláusula 17° – Becas",
    "LOS RESPONSABLES PARENTALES podrán solicitar becas o ayudas económicas conforme al Reglamento General de Becas vigente, disponible en la Administración de LA FUNDACIÓN.\n" +
    "La presentación de la solicitud no genera derecho automático a su otorgamiento, renovación ni continuidad, quedando sujeta a evaluación institucional conforme a los criterios establecidos en la reglamentación correspondiente."
  );

  printClause(
    "Cláusula 18° – Mora y gestión de cobranza",
    "El pago efectuado con posterioridad a la fecha de vencimiento devengará, desde dicha fecha y hasta su efectivo pago, la tasa de intereses punitorios que determine LA FUNDACIÓN, que no podrá ser superior a la tasa activa del Banco del Chubut con hasta una sobretasa del 10% (DIEZ) de la misma, y los cuales serán informados al inicio de cada ciclo lectivo y/o al momento de comunicarse modificaciones arancelarias.\n" +
    "La falta de pago de uno o más aranceles facultará a LA FUNDACIÓN a reclamar las sumas adeudadas, con más los intereses correspondientes y los gastos razonables de cobranza judicial o extrajudicial que resulten procedentes conforme a la normativa vigente.\n" +
    "En caso de mora reiterada o persistente, y previa intimación fehaciente al domicilio constituido por LOS RESPONSABLES PARENTALES, LA FUNDACIÓN podrá iniciar las acciones legales tendientes al cobro de las sumas adeudadas.\n" +
    "Asimismo, la mora persistente podrá constituir causal suficiente para que LA FUNDACIÓN decida no renovar la matrícula o resolver el presente contrato para futuros ciclos lectivos, de conformidad con la normativa educativa aplicable y previa notificación fehaciente.\n" +
    "En caso de no renovación para un ciclo lectivo futuro, LA FUNDACIÓN notificará la decisión con antelación suficiente y brindará la documentación necesaria para facilitar la continuidad educativa y el pase institucional del/de la alumno/a, de conformidad con la normativa aplicable.\n" +
    "LOS RESPONSABLES PARENTALES reconocen el carácter arancelario y exigible de las obligaciones económicas asumidas. Las liquidaciones y certificaciones emitidas por la Administración podrán ser observadas mediante impugnación fundada o acreditación de error material, sin perjuicio de las acciones y procedimientos de cobro que legalmente correspondan.\n" +
    "Las partes acuerdan que dichas constancias podrán ser utilizadas como instrumento suficiente para promover las acciones judiciales de cobro que correspondan, incluyendo, en su caso, la vía ejecutiva prevista por la normativa procesal aplicable."
  );

  printClause(
    "Cláusula 19° – Responsabilidad de pago",
    "LOS RESPONSABLES PARENTALES asumen en forma solidaria la obligación de pago de la totalidad de los aranceles, cuotas, matrículas, intereses y demás conceptos derivados del presente contrato, independientemente de su situación personal, familiar, laboral o económica.\n" +
    "Dicha obligación subsiste durante toda la vigencia del vínculo educativo y hasta la cancelación total de las sumas adeudadas.\n" +
    "LA FUNDACIÓN no asume responsabilidad ni intervención alguna en las situaciones particulares de índole familiar, económica o personal de LOS RESPONSABLES PARENTALES, las cuales no afectan la validez, exigibilidad ni cumplimiento de las obligaciones asumidas en el presente contrato.\n" +
    "Sin perjuicio de ello, LA FUNDACIÓN podrá, a su exclusivo criterio institucional y conforme a sus políticas vigentes, evaluar situaciones particulares y eventualmente otorgar facilidades de pago o beneficios, sin que ello implique renuncia, modificación o novación de las obligaciones contractuales."
  );

  // CAPÍTULO III
  printSectionHeader("CAPÍTULO III: ASPECTOS ACADÉMICOS, FORMATIVOS Y DE CONVIVENCIA");

  printClause(
    "Cláusula 20° – Participación familiar",
    "LOS RESPONSABLES PARENTALES reconocen que la educación constituye una tarea conjunta entre familia e institución y se comprometen a participar en las convocatorias institucionales que LA FUNDACIÓN considere necesarias u obligatorias."
  );

  printClause(
    "Cláusula 21° – Actividades institucionales",
    "Las actividades recreativas, deportivas, convivencias, torneos y salidas educativas forman parte integrante del Proyecto Educativo Institucional.\n" +
    "La participación en dichas actividades implica aceptación de las decisiones organizativas y pedagógicas adoptadas por LA FUNDACIÓN."
  );

  printClause(
    "Cláusula 22° – Equipos técnicos interdisciplinarios",
    "LA FUNDACIÓN podrá dar intervención a sus equipos institucionales cuando resulte necesario para acompañar la trayectoria escolar o atender necesidades educativas del/la alumno/a. La intervención de profesionales externos y el tratamiento o comunicación de información sensible se realizarán con conocimiento de LOS RESPONSABLES PARENTALES y, cuando corresponda, mediante consentimiento específico, resguardando la privacidad, confidencialidad y autonomía progresiva del/de la alumno/a."
  );

  printClause(
    "Cláusula 23° – Uso responsable de redes sociales",
    "LOS RESPONSABLES PARENTALES asumen la responsabilidad de promover el uso adecuado y responsable de redes sociales y plataformas digitales por parte de sus hijos/as o tutelados/as, comprometiéndose a colaborar con LA FUNDACIÓN en la prevención de situaciones que afecten la convivencia y bienestar de la comunidad educativa."
  );

  // CIERRE Y JURISDICCIÓN
  const cierreText = "Las partes constituyen domicilio especial en los indicados en el encabezado del presente contrato, donde serán válidas todas las notificaciones judiciales y extrajudiciales, asimismo, acuerdan someter cualquier controversia derivada del presente contrato a los Tribunales Ordinarios de la ciudad de Esquel, renunciando a cualquier otro fuero o jurisdicción.";
  printParagraph(cierreText, { spaceAfter: 4 });

  // ==========================================
  // BLOQUE DE FIRMAS PERFECTAMENTE ALINEADO
  // ==========================================
  checkPageBreak(58);

  const col1X = marginX + 3;
  const col2X = marginX + 62;
  const col3X = marginX + 115;
  const colW1 = 52;
  const colW2 = 45;
  const colW3 = 54;

  // --- FILA 1: RESPONSABLE 1 ---
  let lineY = y + 14;

  // Arriba de la línea:
  if (!isBlank && data.signature1Data) {
    try {
      doc.addImage(data.signature1Data, "PNG", col1X + 4, lineY - 14, 44, 13.5);
    } catch {
      // Fallback
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  if (!isBlank) {
    doc.text(p1Dni, col2X + colW2 / 2, lineY - 2, { align: "center" });
    doc.text(p1Name, col3X + colW3 / 2, lineY - 2, { align: "center" });
  }

  // Las líneas:
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(col1X, lineY, col1X + colW1, lineY);
  doc.line(col2X, lineY, col2X + colW2, lineY);
  doc.line(col3X, lineY, col3X + colW3, lineY);

  // Abajo de la línea:
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const resp1Label = isBlank
    ? "Firma Padre / Madre / Tutor"
    : `Firma ${data.parent1Relationship || "Responsable 1"}`;
  doc.text(resp1Label, col1X + colW1 / 2, lineY + 3.5, { align: "center" });
  doc.text("DNI", col2X + colW2 / 2, lineY + 3.5, { align: "center" });
  doc.text("Aclaración", col3X + colW3 / 2, lineY + 3.5, { align: "center" });

  // --- FILA 2: RESPONSABLE 2 ---
  lineY += 17;

  // Arriba de la línea:
  if (!isBlank && !isSingle && data.signature2Data) {
    try {
      doc.addImage(data.signature2Data, "PNG", col1X + 4, lineY - 14, 44, 13.5);
    } catch {
      // Fallback
    }
  } else if (isSingle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text("[Declaración Responsable Único/a]", col1X + colW1 / 2, lineY - 2, { align: "center" });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  if (!isBlank && !isSingle) {
    doc.text(p2Dni, col2X + colW2 / 2, lineY - 2, { align: "center" });
    doc.text(p2Name, col3X + colW3 / 2, lineY - 2, { align: "center" });
  }

  // Las líneas:
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(col1X, lineY, col1X + colW1, lineY);
  doc.line(col2X, lineY, col2X + colW2, lineY);
  doc.line(col3X, lineY, col3X + colW3, lineY);

  // Abajo de la línea:
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const resp2Label = isBlank
    ? "Firma Padre / Madre / Tutora"
    : (isSingle ? "---" : `Firma ${data.parent2Relationship || "Responsable 2"}`);
  doc.text(resp2Label, col1X + colW1 / 2, lineY + 3.5, { align: "center" });
  doc.text("DNI", col2X + colW2 / 2, lineY + 3.5, { align: "center" });
  doc.text("Aclaración", col3X + colW3 / 2, lineY + 3.5, { align: "center" });

  // --- FILA 3: FUNDACIÓN EDUCATIVA ESQUEL (REPRESENTANTE LEGAL CON FIRMA Y SELLO OFICIAL) ---
  lineY += 17;

  // Arriba de la línea: Firma y sello oficial institucional
  try {
    doc.addImage(INSTITUTIONAL_SIGNATURE_PNG, "PNG", col1X + 16, lineY - 17, 20, 20);
  } catch {
    // Fallback
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  doc.text("29.878.978", col2X + colW2 / 2, lineY - 2, { align: "center" });
  doc.text("María Cecilia Turró", col3X + colW3 / 2, lineY - 2, { align: "center" });

  // Las líneas:
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(col1X, lineY, col1X + colW1, lineY);
  doc.line(col2X, lineY, col2X + colW2, lineY);
  doc.line(col3X, lineY, col3X + colW3, lineY);

  // Abajo de la línea:
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Representación Legal", col1X + colW1 / 2, lineY + 3.5, { align: "center" });
  doc.text("DNI", col2X + colW2 / 2, lineY + 3.5, { align: "center" });
  doc.text("Aclaración", col3X + colW3 / 2, lineY + 3.5, { align: "center" });

  // Recuadro de Metadatos Digitales (Solo si está firmado)
  if (!isBlank) {
    lineY += 9;
    checkPageBreak(16);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, lineY, contentWidth, 14, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text("CONSTANCIA DE REGISTRO ELECTRÓNICO INSTITUCIONAL — CICLO LECTIVO 2027", marginX + 3.5, lineY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Trámite: ${data.trackingNumber || data.id || "FEE-2027-ONLINE"}  |  Fecha/Hora: ${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR")}  |  Facturación: ${data.billingName || p1Name} (${data.billingCuit || p1Dni})`, marginX + 3.5, lineY + 8);
    doc.text("Suscripción digital mediante firma electrónica táctil y aceptación de los 23 artículos del Contrato Marco.", marginX + 3.5, lineY + 11.5);
  }

  return doc;
}

/**
 * Descarga directamente el modelo en blanco del contrato oficial
 */
export function downloadBlankContract(): void {
  const doc = generateContractPdf();
  doc.save("Contrato_Marco_Prestacion_Servicios_Educativos_FEE_Modelo.pdf");
}

/**
 * Descarga el contrato completo completado y firmado
 */
export function downloadFilledContract(data: EnrollmentContractData): void {
  const doc = generateContractPdf(data);
  const cleanName = data.studentName.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `Contrato_Reinscripcion_2027_${cleanName}_${data.studentDni || "FEE"}.pdf`;
  doc.save(filename);
}
