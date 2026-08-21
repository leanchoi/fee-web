import { jsPDF } from "jspdf";
import { INSTITUTIONAL_SIGNATURE_PNG } from "./institutionalSignature";

export interface SiblingData {
  id?: string;
  name: string;
  level?: string;
  school: string;
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
  level?: string;        // Alias de compatibilidad
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
 * Nombre de archivo exigido por Administración: {DNI_PADRE_FACTURA}_{DNI_ALUMNO}.pdf
 */
export function getContractFilename(data: EnrollmentContractData): string {
  const billingDni = (data.billingCuit || data.parent1Dni || "0").replace(/[^0-9]/g, "") || "0";
  const studentDni = (data.studentDni || "0").replace(/[^0-9]/g, "") || "0";
  return `${billingDni}_${studentDni}.pdf`;
}

/**
 * Genera el documento PDF del Contrato Marco oficial definitivo de la Fundación Educativa Esquel
 */
export function generateContractPdf(data?: EnrollmentContractData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isBlank = !data;
  const now = data?.signedAt ? new Date(data.signedAt) : new Date();
  const day = isBlank ? "___________" : String(now.getDate());
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
    : (data.studentLevel || data.level || determineLevel(data.studentGrade, data.school));

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
    // Encabezado institucional FEE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(24, 60, 52); // Verde institucional
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

    // Si no entra el título y al menos 2 líneas del cuerpo, hacemos salto de página
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

  // Comparecencia oficial
  let comparecencia = "";
  if (isSingle) {
    comparecencia = `En la ciudad de Esquel, a los ${day} días del mes de ${month} del año ${year}, entre la Fundación Educativa Esquel, con domicilio legal en Chacabuco Nº 1029 de la ciudad de Esquel, Provincia del Chubut, en adelante denominada “LA FUNDACIÓN”, y por la otra parte ${p1Title} ${p1Name} D.N.I. Nº ${p1Dni} (en carácter de único/a responsable parental habilitado/a), quien constituye domicilio en ${address} de la ciudad de ${city}, en adelante denominado/a “EL/LA RESPONSABLE PARENTAL”, se celebra el presente contrato sujeto a las siguientes cláusulas y condiciones particulares.`;
  } else {
    comparecencia = `En la ciudad de Esquel, a los ${day} días del mes de ${month} del año ${year}, entre la Fundación Educativa Esquel, con domicilio legal en Chacabuco Nº 1029 de la ciudad de Esquel, Provincia del Chubut, en adelante denominada “LA FUNDACIÓN”, y por la otra parte ${p1Title} ${p1Name} D.N.I. Nº ${p1Dni} y ${p2Title} ${p2Name} D.N.I. Nº ${p2Dni}, quienes constituyen domicilio en ${address} de la ciudad de ${city}, en adelante denominados “LOS RESPONSABLES PARENTALES”, se celebra el presente contrato sujeto a las siguientes cláusulas y condiciones particulares.`;
  }
  printParagraph(comparecencia, { spaceAfter: 3.0 });

  // DISPOSICIONES PRELIMINARES
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
    `A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reserva una vacante para el/la alumno/a ${studentName} D.N.I. Nº ${studentDni} desde el ciclo lectivo ${cycleYear} y hasta la finalización del presente contrato, correspondiente al año/grado/sala ${grade} de Nivel ${level} (${school}). La continuidad en ciclos posteriores requerirá completar el procedimiento anual de reinscripción y cumplir las condiciones vigentes para cada ciclo lectivo.`
  );

  printClause(
    "Cláusula 5° – Adhesión al proyecto institucional",
    "LOS RESPONSABLES PARENTALES declaran conocer y adherir al Proyecto Educativo Institucional, al Acuerdo Escolar de Convivencia y a las reglamentaciones internas vigentes de LA FUNDACIÓN.\n" +
    "Asimismo, aceptan la organización institucional, pedagógica y administrativa dispuesta por LA FUNDACIÓN, incluyendo la distribución horaria, conformación de cursos, reasignación de divisiones y demás adecuaciones razonablemente necesarias para el correcto funcionamiento del servicio educativo.\n" +
    "Toda modificación sustancial que pudiera afectar significativamente las condiciones esenciales de prestación del servicio educativo será informada oportunamente mediante los canales institucionales habituales, siempre que no importen modificaciones irrazonables o sustanciales del servicio originalmente contratado."
  );

  printClause(
    "Cláusula 6° – Reinscripción y prestación del servicio educativo",
    "Cumplidas las condiciones académicas, administrativas y arancelarias previstas en el presente contrato, y sujeto a disponibilidad institucional, LA FUNDACIÓN podrá reinscribir al/la alumno/a para el ciclo lectivo siguiente.\n" +
    "Toda decisión de no renovación o negativa de reinscripción deberá fundarse en causas objetivas, razonables y compatibles con la normativa educativa vigente, debiendo ser notificada fehacientemente a LOS RESPONSABLES PARENTALES.\n" +
    "La prestación del servicio educativo comprende:\n" +
    "a)  La enseñanza oficial correspondiente al nivel y año en el que se encuentre matriculado/a el/la alumno/a.\n" +
    "b)  Las actividades institucionales, pedagógicas y formativas organizadas conforme al Proyecto Educativo Institucional.\n" +
    "En caso de repitencia, la reinscripción quedará supeditada a la existencia de vacantes disponibles en el curso correspondiente."
  );

  printClause(
    "Cláusula 7° – Uso institucional de imágenes",
    "La autorización para captar, utilizar o difundir imágenes, fotografías y registros audiovisuales en los que aparezca el/la alumno/a se instrumentará mediante un consentimiento específico, separado y revocable. Dicho consentimiento distinguirá, como mínimo, el uso pedagógico interno, la difusión en el sitio web institucional, las redes sociales oficiales y el material gráfico o audiovisual público. LOS RESPONSABLES PARENTALES podrán revocar la autorización otorgada en cualquier momento mediante comunicación escrita dirigida a la Administración de LA FUNDACIÓN, la que no afectará publicaciones impresas ya distribuidas ni registros históricos institucionales. La negativa o revocación de esta autorización no afectará la matriculación ni la prestación del servicio educativo."
  );

  printClause(
    "Cláusula 8° – Firma y validez contractual",
    "El presente contrato podrá suscribirse en soporte papel o mediante mecanismos electrónicos que permitan identificar a los firmantes, registrar la fecha de aceptación y conservar la integridad del documento. LA FUNDACIÓN pondrá a disposición de LOS RESPONSABLES PARENTALES una copia del contrato suscripto o aceptado.\n" +
    "La validez de la matriculación y continuidad del vínculo educativo quedará sujeta al cumplimiento de las condiciones académicas, administrativas, documentales y arancelarias previstas en el presente contrato y en la normativa institucional vigente para cada ciclo lectivo.\n" +
    "Las actualizaciones de valores arancelarios, reglamentaciones internas, cronogramas administrativos y demás condiciones aplicables a cada ciclo lectivo serán informadas con antelación razonable mediante los canales institucionales habituales. Cuando se modifiquen condiciones esenciales del vínculo, su incorporación al contrato requerirá la aceptación expresa de LOS RESPONSABLES PARENTALES en el procedimiento anual de matriculación o reinscripción.\n" +
    "En caso de incumplimiento de los requisitos establecidos para cada ciclo lectivo dentro de los plazos informados, LA FUNDACIÓN podrá disponer de la vacante previa notificación por los medios institucionales habituales."
  );

  // CAPÍTULO II
  printSectionHeader("CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS");

  printClause(
    "Cláusula 9° – Aranceles y modalidades de pago",
    "El costo anual del servicio educativo será abonado en once (11) cuotas mensuales y consecutivas de Febrero a Diciembre, con vencimiento entre los días 1 y 10 de cada mes, independientemente de la cantidad de días efectivamente dictados durante el período correspondiente. En caso de tratarse una incorporación una vez iniciado el ciclo lectivo, corresponderá abonar las cuotas mensualizadas de los meses restantes.\n" +
    "LA FUNDACIÓN habilita los siguientes medios de pago:\n" +
    "•  Transferencias bancarias inmediatas.\n" +
    "•  Débito automático.\n" +
    "•  Otros medios de pago que pudieran incorporarse en el futuro los que serán debidamente informados, a su debido tiempo.\n" +
    "A efectos de solicitar la matriculación para el ciclo lectivo siguiente, resultará aplicable el régimen de libre deuda y acuerdos de pago previsto en la Cláusula 12.\n" +
    "LA FUNDACIÓN no será responsable por alteraciones o imposibilidad de prestación derivadas de supuestos de caso fortuito, fuerza mayor, disposiciones de autoridad competente o circunstancias ajenas razonablemente a su control, conforme a la normativa vigente.\n" +
    "Las partes acuerdan aplicar el principio de esfuerzo compartido frente a procesos inflacionarios, modificaciones regulatorias o variaciones sustanciales de costos que alteren significativamente la ecuación económica del presente contrato."
  );

  printClause(
    "Cláusula 10° – Beneficios de terceros y medios de pago:",
    "Las promociones, descuentos, reintegros o planes de cuotas ofrecidos por entidades bancarias, emisoras de tarjetas o plataformas de pago se regirán por las condiciones, límites y vigencia establecidos por cada entidad. Los reclamos por beneficios o reintegros no aplicados por causas imputables a la entidad deberán tramitarse ante ésta. LA FUNDACIÓN responderá exclusivamente por la información, cargos y condiciones que ella establezca o comunique directamente."
  );

  printClause(
    "Cláusula 11° – Descuentos y beneficios arancelarios",
    "LA FUNDACIÓN podrá otorgar los siguientes beneficios arancelarios, los cuales deberán ser solicitados al inicio de cada ciclo lectivo y no revisten carácter automático ni permanente:\n" +
    "•  Quince por ciento (15%) de descuento para familias con dos hijos/as matriculados/as, aplicado sobre la cuota de menor valor.\n" +
    "•  Veinticinco por ciento (25%) de descuento para familias con tres o más hijos/as matriculados/as, aplicado sobre la cuota de menor valor.\n" +
    "•  Veinte por ciento (20%) de descuento para hijos/as de empleados de LA FUNDACIÓN.\n" +
    "Será condición esencial para la conservación de dichos beneficios mantener regularidad en el pago íntegro y oportuno de las obligaciones arancelarias.\n" +
    "Los beneficios podrán ser suspendidos en caso de mora recurrente, entendiéndose por tal la existencia de dos (2) cuotas consecutivas o tres (3) alternadas impagas o abonadas fuera de término durante el mismo ciclo lectivo. La rehabilitación de los beneficios quedará sujeta a evaluación administrativa y podrá efectuarse a partir del siguiente ciclo lectivo."
  );

  printClause(
    "Cláusula 12° – Libre deuda y condición de matrícula",
    "Será condición indispensable para completar la matriculación y obtener la reserva definitiva de la vacante no registrar deuda exigible con LA FUNDACIÓN. Las familias que registren deuda deberán cancelarla o formalizar un acuerdo de pago expresamente aceptado por LA FUNDACIÓN. La mera presentación de la solicitud de matriculación no implicará la reserva definitiva de la vacante mientras no se verifique el cumplimiento de esta condición.\n" +
    "Las familias consideradas morosas reincidentes no tendrán derecho automático a acceder a un nuevo acuerdo de pago. Su situación será evaluada por el Consejo de Administración, considerando los antecedentes de pago, los acuerdos previamente incumplidos y las circunstancias particulares debidamente acreditadas. Se considerará que existe mora reincidente cuando LOS RESPONSABLES PARENTALES: a) hayan incumplido dos acuerdos de pago formalizados durante los dos últimos ciclos lectivos; o b) registren tres cuotas consecutivas o cuatro alternadas impagas o abonadas con más de treinta (30) días de atraso y no regularicen su situación luego de una notificación formal de LA FUNDACIÓN. La decisión que se adopte será comunicada a LOS RESPONSABLES PARENTALES.\n" +
    "Para alumnos/as regulares, la Administración verificará internamente la inexistencia de deuda exigible o la existencia de un acuerdo de pago vigente y cumplido. Para nuevos ingresantes se solicitará únicamente la documentación que corresponda conforme al procedimiento de admisión informado por LA FUNDACIÓN."
  );

  printClause(
    "Cláusula 13° – Reembolsos",
    "Los importes abonados en concepto de reserva de vacante y/o matrícula podrán reintegrarse de forma parcial o proporcional según el momento de la baja y los gastos administrativos efectivamente incurridos, justificados y verificados administrativamente, conforme a las políticas institucionales vigentes y la normativa aplicable, siempre y cuando no haya iniciado el ciclo lectivo, en cuyo caso no será reintegrable, por cuanto LA FUNDACIÓN mantuvo la reserva de lugar, y se procedió a su utilización."
  );

  printClause(
    "Cláusula 14° – Valor de matrícula y formas de pago",
    "El valor de la reserva de vacante/matrícula equivaldrá a:\n" +
    "•  Uno coma cuatro (1,4) veces el valor de la cuota vigente al mes de agosto para alumnos/as regulares.\n" +
    "•  Uno coma ocho (1,8) veces el valor de la cuota vigente al mes de agosto para nuevos ingresantes.\n" +
    "La matrícula podrá abonarse mediante transferencia bancaria, tarjeta de crédito, planes de pago u otras modalidades habilitadas e informadas por LA FUNDACIÓN. Las promociones, descuentos, planes de cuotas y costos financieros aplicables serán informados anualmente y deberán ser aceptados al formalizar la matriculación."
  );

  printClause(
    "Cláusula 15° – Plazos administrativos",
    "Las fechas de matriculación interna y externa, así como los plazos para completar la documentación y acreditar el cumplimiento de los requisitos correspondientes, serán establecidos anualmente por LA FUNDACIÓN y comunicados mediante los canales institucionales habituales."
  );

  printClause(
    "Cláusula 16° – Actualización de valores",
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
    "LA FUNDACIÓN podrá dar intervención a sus equipos institucionales cuando resulte necesario para acompañar la trayectoria escolar o atender necesidades educativas del/la alumno(a). La intervención de profesionales externos y el tratamiento o comunicación de información sensible se realizarán con conocimiento de LOS RESPONSABLES PARENTALES y, cuando corresponda, mediante consentimiento específico, resguardando la privacidad, confidencialidad y autonomía progresiva del/de (la) alumno(a)."
  );

  printClause(
    "Cláusula 23° – Uso responsable de redes sociales",
    "LOS RESPONSABLES PARENTALES asumen la responsabilidad de promover el uso adecuado y responsable de redes sociales y plataformas digitales por parte de sus hijos/as o tutelados/as, comprometiéndose a colaborar con LA FUNDACIÓN en la prevención de situaciones que afecten la convivencia y bienestar de la comunidad educativa."
  );

  // CIERRE Y JURISDICCIÓN
  const cierreText = "Las partes constituyen domicilio especial en los indicados en el encabezado del presente contrato, donde serán válidas todas las notificaciones judiciales y extrajudiciales, asimismo, acuerdan someter cualquier controversia derivada del presente contrato a los Tribunales Ordinarios de la ciudad de Esquel, renunciando a cualquier otro fuero o jurisdicción.";
  printParagraph(cierreText, { spaceAfter: 4 });

  // ==========================================
  // BLOQUE DE FIRMAS Y REGISTRO DE ALUMNOS
  // ==========================================
  checkPageBreak(65);

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
    ? "Firma del padre/tutor"
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
    ? "Firma de la madre/tutora"
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

  // Recuadro de Metadatos Digitales y Registro de Alumnos Reinscriptos
  if (!isBlank) {
    lineY += 8.5;
    const boxHeight = data.hasSiblings && data.siblingDetails ? 20 : 16;
    checkPageBreak(boxHeight + 2);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, lineY, contentWidth, boxHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text("REGISTRO ELECTRÓNICO INSTITUCIONAL — CONSTANCIA DE REINSCRIPCIÓN 2027", marginX + 3.5, lineY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`• ESTUDIANTE: ${studentName} (DNI ${studentDni}) — ${level} (${grade}) - ${school}`, marginX + 3.5, lineY + 7.5);
    
    let subY = lineY + 11;
    if (data.hasSiblings && data.siblingDetails) {
      doc.text(`• HERMANOS/AS: ${data.siblingDetails}`, marginX + 3.5, subY);
      subY += 3.5;
    }

    doc.setTextColor(100, 116, 139);
    doc.text(`Trámite: ${data.trackingNumber || data.id || "FEE-2027-ONLINE"}  |  Fecha/Hora: ${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR")}  |  Facturación: ${data.billingName || p1Name} (DNI/CUIT ${data.billingCuit || p1Dni})`, marginX + 3.5, subY);
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
 * Descarga el contrato completo completado y firmado con nomenclatura: {DNI_PADRE}_{DNI_ALUMNO}.pdf
 */
export function downloadFilledContract(data: EnrollmentContractData): void {
  const doc = generateContractPdf(data);
  const filename = getContractFilename(data);
  doc.save(filename);
}
