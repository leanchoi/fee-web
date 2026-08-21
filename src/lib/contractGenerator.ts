import { jsPDF } from "jspdf";

export interface EnrollmentContractData {
  id?: string;
  trackingNumber?: string;
  createdAt?: string;

  // Estudiante
  studentName: string;
  studentDni: string;
  school: string; // "Escuela N.º 1030" | "Escuela N.º 1739"
  level?: string; // "Nivel Inicial" | "Nivel Primario" | "Nivel Secundario"
  studentGrade: string; // "Sala de 3", "1° grado", "3° año", etc.
  hasSiblings?: boolean;
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

function determineLevel(school: string, grade: string): string {
  const g = grade.toLowerCase();
  if (g.includes("sala")) return "Nivel Inicial";
  if (g.includes("grado")) return "Nivel Primario";
  if (g.includes("año")) return "Nivel Secundario";
  if (school.includes("1030")) return "Nivel Inicial / Primario";
  return "Nivel Secundario";
}

/**
 * Genera el documento PDF del Contrato Marco (en blanco o con datos pre-rellenados y firmas)
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

  const p1Name = isBlank ? "_____________________________________________________" : data.parent1Name;
  const p1Dni = isBlank ? "__________________" : data.parent1Dni;
  const isSingle = !isBlank && data.isSingleParent;

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
  const school = isBlank ? "Escuela N.º 1030 / 1739" : data.school;
  const level = isBlank
    ? "_________________________________"
    : (data.level || determineLevel(data.school, data.studentGrade));

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2; // 170mm

  const drawHeader = (pageNumber: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);

    // Membrete superior
    doc.text("FUNDACIÓN EDUCATIVA ESQUEL", marginX, 14);
    doc.setFont("helvetica", "normal");
    doc.text("Escuela N.º 1030 | Escuela N.º 1739 - Esquel, Chubut", marginX, 18);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginX, 20, pageWidth - marginX, 20);

    // Número de página al pie
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`{  ${pageNumber}  }`, pageWidth / 2, pageHeight - 12, { align: "center" });
  };

  // Helper para imprimir texto justificado/párrafo
  const printParagraph = (text: string, yPos: number, options?: { bold?: boolean; size?: number; lineHeight?: number }): number => {
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(options?.size || 9.5);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = options?.lineHeight || 4.5;
    doc.text(lines, marginX, yPos);
    return yPos + lines.length * lineHeight;
  };

  // ==========================================
  // PÁGINA 1
  // ==========================================
  drawHeader(1);
  let y = 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("CONTRATO MARCO DE PRESTACIÓN DE SERVICIOS EDUCATIVOS", pageWidth / 2, y, { align: "center" });
  y += 8;

  const comparecencia = `En la ciudad de Esquel, a los ${day} días del mes de ${month} del año ${year}, entre la Fundación Educativa Esquel, con domicilio legal en Chacabuco Nº 1029 de la ciudad de Esquel, Provincia del Chubut, en adelante denominada “LA FUNDACIÓN”, y por la otra parte Sr./Sra. ${p1Name} D.N.I. Nº ${p1Dni} y Sr./Sra. ${p2Name} D.N.I. Nº ${p2Dni}, quienes constituyen domicilio en ${address} de la ciudad de ${city}, en adelante denominados “LOS RESPONSABLES PARENTALES”, se celebra el presente contrato sujeto a las siguientes cláusulas y condiciones particulares.`;
  y = printParagraph(comparecencia, y, { lineHeight: 4.6 }) + 4;

  y = printParagraph("DISPOSICIONES PRELIMINARES", y, { bold: true, size: 10 }) + 2;

  y = printParagraph("Cláusula 1° – Naturaleza del contrato", y, { bold: true, size: 9.5 }) + 1;
  const c1Text = "El presente constituye un contrato marco de prestación de servicios educativos celebrado entre LA FUNDACIÓN y LOS RESPONSABLES PARENTALES del/de la alumno/a, destinado a regular el vínculo educativo mientras subsista la permanencia del/de la alumno/a en cualquiera de los establecimientos dependientes de LA FUNDACIÓN.\n" +
    "La firma del presente instrumento tendrá vigencia continuada durante toda la trayectoria escolar del/de la alumno/a dentro de LA FUNDACIÓN, sin necesidad de suscribir un nuevo contrato en cada ciclo lectivo, salvo modificación sustancial de las condiciones contractuales o requerimiento expreso de LA FUNDACIÓN.\n" +
    "La matriculación anual, reinscripción y continuidad del/de la alumno/a en cada ciclo lectivo quedarán sujetas al cumplimiento de los requisitos académicos, administrativos, arancelarios y de convivencia establecidos en el presente contrato, en la normativa educativa vigente y en las reglamentaciones institucionales aplicables.\n" +
    "La reserva de vacante y reinscripción anual no operarán de manera automática, quedando supeditadas al cumplimiento de las condiciones vigentes al momento de cada ciclo lectivo, y requerirá la aceptación anual expresa de las condiciones educativas y arancelarias vigentes de los RESPONSABLES PARENTALES.";
  y = printParagraph(c1Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 2° – Documentación complementaria", y, { bold: true, size: 9.5 }) + 1;
  const c2Text = "Forman parte integrante del presente contrato los siguientes documentos institucionales:\n" +
    "•  Acuerdo Escolar de Convivencia correspondiente al nivel educativo solicitado.\n" +
    "•  Proyecto Educativo Institucional.\n" +
    "•  Planilla de datos administrativos y de facturación, en la que deberán consignarse los datos de los RESPONSABLES PARENTALES y adjuntarse copia de sus respectivos documentos nacionales de identidad (DNI), así como de un servicio o documentación que permita acreditar y corroborar el domicilio declarado, especificando asimismo cuál de los RESPONSABLES PARENTALES será el designado a efectos de la facturación.\n" +
    "El RESPONSABLE PARENTAL así identificado y el domicilio informado constituirán, respectivamente, la persona y el domicilio principales a efectos de las comunicaciones y notificaciones que correspondan, incluyendo, entre otras, aquellas vinculadas con situaciones de mora o incumplimiento de obligaciones.";
  printParagraph(c2Text, y, { lineHeight: 4.2 });

  // ==========================================
  // PÁGINA 2
  // ==========================================
  doc.addPage();
  drawHeader(2);
  y = 26;

  y = printParagraph("CAPÍTULO I: ASPECTOS INSTITUCIONALES", y, { bold: true, size: 10 }) + 2;

  y = printParagraph("Cláusula 3° – Servicio educativo y marco institucional", y, { bold: true, size: 9.5 }) + 1;
  const c3Text = "LA FUNDACIÓN se compromete a brindar el servicio educativo conforme a la normativa oficial vigente y de acuerdo con los planes y diseños curriculares aprobados por el Ministerio de Educación de la Provincia del Chubut, incorporando además propuestas pedagógicas complementarias acordes a su ideario institucional.\n" +
    "La actividad educativa se desarrollará conforme al Proyecto Educativo Institucional y al Acuerdo Escolar de Convivencia vigentes, cuyos contenidos estarán disponibles para conocimiento de LOS RESPONSABLES PARENTALES.\n" +
    "La matriculación y permanencia del/de la alumno/a implican el conocimiento y aceptación razonable de dichas reglamentaciones institucionales, en tanto resulten compatibles con la normativa educativa y el ordenamiento jurídico vigente.";
  y = printParagraph(c3Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 4° – Reserva de vacante", y, { bold: true, size: 9.5 }) + 1;
  const c4Text = `A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reserva una vacante para el/la alumno/a ${studentName} D.N.I. Nº ${studentDni} desde el ciclo lectivo ${cycleYear} y hasta la finalización del presente contrato, correspondiente al año/grado/sala ${grade} de Nivel ${level} (${school}). A solicitud de LOS RESPONSABLES PARENTALES y sujeto al cumplimiento de las condiciones establecidas en el presente contrato, LA FUNDACIÓN reservará una vacante para el/la alumno/a individualizado/a en la documentación de matriculación, exclusivamente para el ciclo lectivo correspondiente. La continuidad en ciclos posteriores requerirá completar el procedimiento anual de reinscripción y cumplir las condiciones vigentes para cada ciclo lectivo.`;
  y = printParagraph(c4Text, y, { lineHeight: 4.4 }) + 3;

  y = printParagraph("Cláusula 5° – Adhesión al proyecto institucional", y, { bold: true, size: 9.5 }) + 1;
  const c5Text = "LOS RESPONSABLES PARENTALES declaran conocer y adherir al Proyecto Educativo Institucional, al Acuerdo Escolar de Convivencia y a las reglamentaciones internas vigentes de LA FUNDACIÓN.\n" +
    "Asimismo, aceptan la organización institucional, pedagógica y administrativa dispuesta por LA FUNDACIÓN, incluyendo la distribución horaria, conformación de cursos, reasignación de divisiones y demás adecuaciones razonablemente necesarias para el correcto funcionamiento del servicio educativo.\n" +
    "Toda modificación sustancial que pudiera afectar significativamente las condiciones esenciales de prestación del servicio educativo será informada oportunamente mediante los canales institucionales habituales, siempre que no importen modificaciones irrazonables o sustanciales del servicio originalmente contratado.";
  y = printParagraph(c5Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 6° – Reinscripción y prestación del servicio educativo", y, { bold: true, size: 9.5 }) + 1;
  printParagraph("Cumplidas las condiciones académicas, administrativas y arancelarias previstas en el presente contrato, y sujeto a disponibilidad institucional, LA FUNDACIÓN podrá reinscribir al/la alumno/a para el ciclo lectivo siguiente.", y, { lineHeight: 4.3 });

  // ==========================================
  // PÁGINA 3
  // ==========================================
  doc.addPage();
  drawHeader(3);
  y = 26;

  const c6Cont = "Toda decisión de no renovación o negativa de reinscripción deberá fundarse en causas objetivas, razonables y compatibles con la normativa educativa vigente, debiendo ser notificada fehacientemente a LOS RESPONSABLES PARENTALES.\n" +
    "La prestación del servicio educativo comprende:\n" +
    "a)  La enseñanza oficial correspondiente al nivel y año en el que se encuentre matriculado/a el/la alumno/a.\n" +
    "b)  Las actividades institucionales, pedagógicas y formativas organizadas conforme al Proyecto Educativo Institucional.\n" +
    "En caso de repitencia, la reinscripción quedará supeditada a la existencia de vacantes disponibles en el curso correspondiente.";
  y = printParagraph(c6Cont, y, { lineHeight: 4.3 }) + 4;

  y = printParagraph("Cláusula 7° – Uso institucional de imágenes", y, { bold: true, size: 9.5 }) + 1;
  const c7Text = "La autorización para captar, utilizar o difundir imágenes, fotografías y registros audiovisuales en los que aparezca el/la alumno/a se instrumentará mediante un consentimiento específico, separado y revocable. Dicho consentimiento distinguirá, como mínimo, el uso pedagógico interno, la difusión en el sitio web institucional, las redes sociales oficiales y el material gráfico o audiovisual público. LOS RESPONSABLES PARENTALES podrán revocar la autorización otorgada en cualquier momento mediante comunicación escrita dirigida a la Administración de LA FUNDACIÓN, la que no afectará publicaciones impresas ya distribuidas ni registros históricos institucionales. La negativa o revocación de esta autorización no afectará la matriculación ni la prestación del servicio educativo.";
  y = printParagraph(c7Text, y, { lineHeight: 4.3 }) + 4;

  y = printParagraph("Cláusula 8° – Firma y validez contractual", y, { bold: true, size: 9.5 }) + 1;
  const c8Text = "El presente contrato podrá suscribirse en soporte papel o mediante mecanismos electrónicos que permitan identificar a los firmantes, registrar la fecha de aceptación y conservar la integridad del documento. LA FUNDACIÓN pondrá a disposición de LOS RESPONSABLES PARENTALES una copia del contrato suscripto o aceptado.\n" +
    "La validez de la matriculación y continuidad del vínculo educativo quedará sujeta al cumplimiento de las condiciones académicas, administrativas, documentales y arancelarias previstas en el presente contrato y en la normativa institucional vigente para cada ciclo lectivo.\n" +
    "Las actualizaciones de valores arancelarios, reglamentaciones internas, cronogramas administrativos y demás condiciones aplicables a cada ciclo lectivo serán informadas con antelación razonable mediante los canales institucionales habituales. Cuando se modifiquen condiciones esenciales del vínculo, su incorporación al contrato requerirá la aceptación expresa de LOS RESPONSABLES PARENTALES en el procedimiento anual de matriculación o reinscripción.\n" +
    "En caso de incumplimiento de los requisitos establecidos para cada ciclo lectivo dentro de los plazos informados, LA FUNDACIÓN podrá disponer de la vacante previa notificación por los medios institucionales habituales.";
  printParagraph(c8Text, y, { lineHeight: 4.3 });

  // ==========================================
  // PÁGINA 4
  // ==========================================
  doc.addPage();
  drawHeader(4);
  y = 26;

  y = printParagraph("CAPÍTULO II: ASPECTOS ADMINISTRATIVOS Y ECONÓMICOS", y, { bold: true, size: 10 }) + 2;

  y = printParagraph("Cláusula 9° – Aranceles y modalidades de pago", y, { bold: true, size: 9.5 }) + 1;
  const c9Text = "El costo anual del servicio educativo será abonado en once (11) cuotas mensuales y consecutivas, correspondientes a los meses de febrero a diciembre, con vencimiento entre los días 1 y 10 de cada mes, independientemente de la cantidad de días efectivamente dictados durante el período correspondiente. En caso de incorporación una vez iniciado el ciclo lectivo, corresponderá abonar las cuotas de los meses restantes, incluida la del mes de ingreso, de acuerdo con la fecha efectiva de incorporación.\n" +
    "LA FUNDACIÓN habilita los siguientes medios de pago:\n" +
    "•  Transferencias bancarias inmediatas.\n" +
    "•  Débito automático.\n" +
    "•  Otros medios de pago que pudieran incorporarse en el futuro los que serán debidamente informados.\n" +
    "A efectos de solicitar la matriculación para el ciclo lectivo siguiente, resultará aplicable el régimen de libre deuda y acuerdos de pago previsto en la Cláusula 12.\n" +
    "LA FUNDACIÓN no será responsable por alteraciones o imposibilidad de prestación derivadas de supuestos de caso fortuito, fuerza mayor, disposiciones de autoridad competente o circunstancias ajenas razonablemente a su control, conforme a la normativa vigente.\n" +
    "Las partes acuerdan aplicar el principio de esfuerzo compartido frente a procesos inflacionarios, modificaciones regulatorias o variaciones sustanciales de costos que alteren significativamente la ecuación económica del presente contrato.";
  y = printParagraph(c9Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 10° – Beneficios de terceros y medios de pago", y, { bold: true, size: 9.5 }) + 1;
  const c10Text = "Las promociones, descuentos, reintegros o planes de cuotas ofrecidos por entidades bancarias, emisoras de tarjetas o plataformas de pago se regirán por las condiciones, límites y vigencia establecidos por cada entidad. Los reclamos por beneficios o reintegros no aplicados por causas imputables a la entidad deberán tramitarse ante ésta. LA FUNDACIÓN responderá exclusivamente por la información, cargos y condiciones que ella establezca o comunique directamente.";
  y = printParagraph(c10Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 11° – Descuentos y beneficios arancelarios", y, { bold: true, size: 9.5 }) + 1;
  const c11Text = "LA FUNDACIÓN podrá otorgar los siguientes beneficios arancelarios, los cuales deberán ser solicitados al inicio de cada ciclo lectivo y no revisten carácter automático ni permanente:\n" +
    "•  Quince por ciento (15%) de descuento para familias con dos hijos/as matriculados/as, aplicado sobre la cuota de menor valor.\n" +
    "•  Veinticinco por ciento (25%) de descuento para familias con tres o más hijos/as matriculados/as, aplicado sobre la cuota de menor valor.\n" +
    "•  Veinte por ciento (20%) de descuento para hijos/as de empleados de LA FUNDACIÓN.";
  printParagraph(c11Text, y, { lineHeight: 4.3 });

  // ==========================================
  // PÁGINA 5
  // ==========================================
  doc.addPage();
  drawHeader(5);
  y = 26;

  const c11Cont = "Será condición esencial para la conservación de dichos beneficios mantener regularidad en el pago íntegro y oportuno de las obligaciones arancelarias.\n" +
    "Los beneficios podrán ser suspendidos en caso de mora recurrente, entendiéndose por tal la existencia de dos (2) cuotas consecutivas o tres (3) alternadas impagas o abonadas fuera de término durante el mismo ciclo lectivo. La rehabilitación de los beneficios quedará sujeta a evaluación administrativa y podrá efectuarse a partir del siguiente ciclo lectivo.";
  y = printParagraph(c11Cont, y, { lineHeight: 4.3 }) + 4;

  y = printParagraph("Cláusula 12° – Libre deuda y condición de matrícula", y, { bold: true, size: 9.5 }) + 1;
  const c12Text = "Será condición indispensable para completar la matriculación y obtener la reserva definitiva de la vacante no registrar deuda exigible con LA FUNDACIÓN. Las familias que registren deuda deberán cancelarla o formalizar un acuerdo de pago expresamente aceptado por LA FUNDACIÓN. La mera presentación de la solicitud de matriculación no implicará la reserva definitiva de la vacante mientras no se verifique el cumplimiento de esta condición.\n" +
    "Las familias consideradas morosas reincidentes no tendrán derecho automático a acceder a un nuevo acuerdo de pago. Su situación será evaluada por el Consejo de Administración, considerando los antecedentes de pago, los acuerdos previamente incumplidos y las circunstancias particulares debidamente acreditadas. Se considerará que existe mora reincidente cuando LOS RESPONSABLES PARENTALES: a) hayan incumplido dos acuerdos de pago formalizados durante los dos últimos ciclos lectivos; o b) registren tres cuotas consecutivas o cuatro alternadas impagas o abonadas con más de treinta (30) días de atraso y no regularicen su situación luego de una notificación formal de LA FUNDACIÓN. La decisión que se adopte será comunicada a LOS RESPONSABLES PARENTALES.\n" +
    "Para alumnos/as regulares, la Administración verificará internamente la inexistencia de deuda exigible o la existencia de un acuerdo de pago vigente y cumplido. Para nuevos ingresantes se solicitará únicamente la documentación que corresponda conforme al procedimiento de admisión informado por LA FUNDACIÓN.";
  y = printParagraph(c12Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 13° – Reembolsos", y, { bold: true, size: 9.5 }) + 1;
  const c13Text = "Los importes abonados en concepto de reserva de vacante y/o matrícula podrán reintegrarse de forma parcial o proporcional según el momento de la baja y los gastos administrativos efectivamente incurridos, justificados y verificados administrativamente, conforme a las políticas institucionales vigentes y la normativa aplicable, siempre y cuando no haya iniciado el ciclo lectivo, en cuyo caso no será reintegrable, por cuanto LA FUNDACIÓN mantuvo la reserva de lugar, y se procedió a su utilización.";
  y = printParagraph(c13Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 14° – Valor de matrícula y formas de pago", y, { bold: true, size: 9.5 }) + 1;
  const c14Text = "El valor de la reserva de vacante/matrícula equivaldrá a:\n" +
    "•  Uno coma cuatro (1,4) veces el valor de la cuota vigente al mes de agosto para alumnos/as regulares.\n" +
    "•  Uno coma ocho (1,8) veces el valor de la cuota vigente al mes de agosto para nuevos ingresantes.\n" +
    "La matrícula podrá abonarse mediante transferencia bancaria, tarjeta de crédito, planes de pago u otras modalidades habilitadas e informadas por LA FUNDACIÓN. Las promociones, descuentos, planes de cuotas y costos financieros aplicables serán informados anualmente y deberán ser aceptados al formalizar la matriculación.";
  printParagraph(c14Text, y, { lineHeight: 4.3 });

  // ==========================================
  // PÁGINA 6
  // ==========================================
  doc.addPage();
  drawHeader(6);
  y = 26;

  y = printParagraph("Cláusula 15° – Plazos administrativos", y, { bold: true, size: 9.5 }) + 1;
  const c15Text = "Las fechas de matriculación interna y externa, así como los plazos para completar la documentación y acreditar el cumplimiento de los requisitos correspondientes, serán establecidos anualmente por LA FUNDACIÓN y comunicados mediante los canales institucionales habituales.";
  y = printParagraph(c15Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 16° – Actualización de valores", y, { bold: true, size: 9.5 }) + 1;
  const c16Text = "Los valores de las cuotas podrán ser actualizados durante los meses de Marzo, Junio y Octubre de cada ciclo lectivo, juntamente con la tasa correspondiente a intereses punitorios.\n" +
    "Asimismo, podrán efectuarse modificaciones extraordinarias cuando se produzcan variaciones sustanciales en costos salariales, cargas sociales, servicios, impuestos, regulaciones estatales u otros factores que impacten significativamente en la estructura económica del servicio educativo.\n" +
    "Toda modificación arancelaria será informada a LOS RESPONSABLES PARENTALES mediante los canales institucionales habituales con antelación razonable.";
  y = printParagraph(c16Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 17° – Becas", y, { bold: true, size: 9.5 }) + 1;
  const c17Text = "LOS RESPONSABLES PARENTALES podrán solicitar becas o ayudas económicas conforme al Reglamento General de Becas vigente, disponible en la Administración de LA FUNDACIÓN.\n" +
    "La presentación de la solicitud no genera derecho automático a su otorgamiento, renovación ni continuidad, quedando sujeta a evaluación institucional conforme a los criterios establecidos en la reglamentación correspondiente.";
  y = printParagraph(c17Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 18° – Mora y gestión de cobranza", y, { bold: true, size: 9.5 }) + 1;
  const c18Text = "El pago efectuado con posterioridad a la fecha de vencimiento devengará, desde dicha fecha y hasta su efectivo pago, la tasa de intereses punitorios que determine LA FUNDACIÓN, que no podrá ser superior a la tasa activa del Banco del Chubut con hasta una sobretasa del 10% (DIEZ) de la misma, y los cuales serán informados al inicio de cada ciclo lectivo y/o al momento de comunicarse modificaciones arancelarias.\n" +
    "La falta de pago de uno o más aranceles facultará a LA FUNDACIÓN a reclamar las sumas adeudadas, con más los intereses correspondientes y los gastos razonables de cobranza judicial o extrajudicial que resulten procedentes conforme a la normativa vigente.\n" +
    "En caso de mora reiterada o persistente, y previa intimación fehaciente al domicilio constituido por LOS RESPONSABLES PARENTALES, LA FUNDACIÓN podrá iniciar las acciones legales tendientes al cobro de las sumas adeudadas.\n" +
    "Asimismo, la mora persistente podrá constituir causal suficiente para que LA FUNDACIÓN decida no renovar la matrícula o resolver el presente contrato para futuros ciclos lectivos, de conformidad con la normativa educativa aplicable y previa notificación fehaciente.\n" +
    "En caso de no renovación para un ciclo lectivo futuro, LA FUNDACIÓN notificará la decisión con antelación suficiente y brindará la documentación necesaria para facilitar la continuidad educativa y el pase institucional del/de la alumno/a, de conformidad con la normativa aplicable.\n" +
    "LOS RESPONSABLES PARENTALES reconocen el carácter arancelario y exigible de las obligaciones económicas asumidas. Las liquidaciones y certificaciones emitidas por la Administración podrán ser observadas mediante impugnación fundada o acreditación de error material, sin perjuicio de las acciones y procedimientos de cobro que legalmente correspondan.";
  printParagraph(c18Text, y, { lineHeight: 4.1 });

  // ==========================================
  // PÁGINA 7
  // ==========================================
  doc.addPage();
  drawHeader(7);
  y = 26;

  const c18Cont = "Las partes acuerdan que dichas constancias podrán ser utilizadas como instrumento suficiente para promover las acciones judiciales de cobro que correspondan, incluyendo, en su caso, la vía ejecutiva prevista por la normativa procesal aplicable.";
  y = printParagraph(c18Cont, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 19° – Responsabilidad de pago", y, { bold: true, size: 9.5 }) + 1;
  const c19Text = "LOS RESPONSABLES PARENTALES asumen en forma solidaria la obligación de pago de la totalidad de los aranceles, cuotas, matrículas, intereses y demás conceptos derivados del presente contrato, independientemente de su situación personal, familiar, laboral o económica.\n" +
    "Dicha obligación subsiste durante toda la vigencia del vínculo educativo y hasta la cancelación total de las sumas adeudadas.\n" +
    "LA FUNDACIÓN no asume responsabilidad ni intervención alguna en las situaciones particulares de índole familiar, económica o personal de LOS RESPONSABLES PARENTALES, las cuales no afectan la validez, exigibilidad ni cumplimiento de las obligaciones asumidas en el presente contrato.\n" +
    "Sin perjuicio de ello, LA FUNDACIÓN podrá, a su exclusivo criterio institucional y conforme a sus políticas vigentes, evaluar situaciones particulares y eventualmente otorgar facilidades de pago o beneficios, sin que ello implique renuncia, modificación o novación de las obligaciones contractuales.";
  y = printParagraph(c19Text, y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("CAPÍTULO III: ASPECTOS ACADÉMICOS, FORMATIVOS Y DE CONVIVENCIA", y, { bold: true, size: 10 }) + 2;

  y = printParagraph("Cláusula 20° – Participación familiar", y, { bold: true, size: 9.5 }) + 1;
  y = printParagraph("LOS RESPONSABLES PARENTALES reconocen que la educación constituye una tarea conjunta entre familia e institución y se comprometen a participar en las convocatorias institucionales que LA FUNDACIÓN considere necesarias u obligatorias.", y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 21° – Actividades institucionales", y, { bold: true, size: 9.5 }) + 1;
  y = printParagraph("Las actividades recreativas, deportivas, convivencias, torneos y salidas educativas forman parte integrante del Proyecto Educativo Institucional.\nLa participación en dichas actividades implica aceptación de las decisiones organizativas y pedagógicas adoptadas por LA FUNDACIÓN.", y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 22° – Equipos técnicos interdisciplinarios", y, { bold: true, size: 9.5 }) + 1;
  y = printParagraph("LA FUNDACIÓN podrá dar intervención a sus equipos institucionales cuando resulte necesario para acompañar la trayectoria escolar o atender necesidades educativas del/la alumno/a. La intervención de profesionales externos y el tratamiento o comunicación de información sensible se realizarán con conocimiento de LOS RESPONSABLES PARENTALES y, cuando corresponda, mediante consentimiento específico, resguardando la privacidad, confidencialidad y autonomía progresiva del/de la alumno/a.", y, { lineHeight: 4.3 }) + 3;

  y = printParagraph("Cláusula 23° – Uso responsable de redes sociales", y, { bold: true, size: 9.5 }) + 1;
  printParagraph("LOS RESPONSABLES PARENTALES asumen la responsabilidad de promover el uso adecuado y responsable de redes sociales y plataformas digitales por parte de sus hijos/as o tutelados/as, comprometiéndose a colaborar con LA FUNDACIÓN en la prevención de situaciones que afecten la convivencia y bienestar de la comunidad educativa.", y, { lineHeight: 4.3 });

  // ==========================================
  // PÁGINA 8: CIERRE Y FIRMAS
  // ==========================================
  doc.addPage();
  drawHeader(8);
  y = 26;

  const cierreText = "Las partes constituyen domicilio especial en los indicados en el encabezado del presente contrato, donde serán válidas todas las notificaciones judiciales y extrajudiciales, asimismo, acuerdan someter cualquier controversia derivada del presente contrato a los Tribunales Ordinarios de la ciudad de Esquel, renunciando a cualquier otro fuero o jurisdicción.";
  y = printParagraph(cierreText, y, { lineHeight: 4.4 }) + 10;

  // Cuadro de Firmas
  const col1X = marginX + 10;
  const col2X = marginX + 70;
  const col3X = marginX + 125;

  // 1. Firma Responsable 1
  if (!isBlank && data.signature1Data) {
    try {
      doc.addImage(data.signature1Data, "PNG", col1X - 5, y - 4, 45, 20);
    } catch {
      // Fallback si la imagen no puede parsearse
    }
  }
  y += 18;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(col1X - 5, y, col1X + 45, y);
  doc.line(col2X - 5, y, col2X + 40, y);
  doc.line(col3X - 5, y, col3X + 40, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Firma ${isBlank ? "del padre/tutor" : (data.parent1Relationship || "Responsable 1")}`, col1X + 20, y + 4, { align: "center" });
  doc.text(p1Dni, col2X + 17, y + 4, { align: "center" });
  doc.text(p1Name, col3X + 17, y + 4, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("DNI", col2X + 17, y + 8, { align: "center" });
  doc.text("Aclaración", col3X + 17, y + 8, { align: "center" });

  y += 24;

  // 2. Firma Responsable 2
  if (!isBlank && !isSingle && data.signature2Data) {
    try {
      doc.addImage(data.signature2Data, "PNG", col1X - 5, y - 4, 45, 20);
    } catch {
      // Fallback
    }
  } else if (isSingle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("[Declarado único responsable parental]", col1X + 20, y + 8, { align: "center" });
  }

  y += 18;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(col1X - 5, y, col1X + 45, y);
  doc.line(col2X - 5, y, col2X + 40, y);
  doc.line(col3X - 5, y, col3X + 40, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`Firma ${isBlank ? "de la madre/tutora" : (isSingle ? "---" : (data.parent2Relationship || "Responsable 2"))}`, col1X + 20, y + 4, { align: "center" });
  doc.text(p2Dni, col2X + 17, y + 4, { align: "center" });
  doc.text(p2Name, col3X + 17, y + 4, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("DNI", col2X + 17, y + 8, { align: "center" });
  doc.text("Aclaración", col3X + 17, y + 8, { align: "center" });

  y += 24;

  // 3. Firma Institucional (María Cecilia Turró)
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("FUNDACIÓN EDUCATIVA ESQUEL\nRepresentación Legal", col1X + 20, y + 4, { align: "center" });

  y += 18;
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(col1X - 5, y, col1X + 45, y);
  doc.line(col2X - 5, y, col2X + 40, y);
  doc.line(col3X - 5, y, col3X + 40, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text("Firma de la Fundación", col1X + 20, y + 4, { align: "center" });
  doc.text("29.878.978", col2X + 17, y + 4, { align: "center" });
  doc.text("María Cecilia Turró", col3X + 17, y + 4, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("DNI", col2X + 17, y + 8, { align: "center" });
  doc.text("Aclaración", col3X + 17, y + 8, { align: "center" });

  // Recuadro de Metadatos de Validación Digital (Solo si está firmado)
  if (!isBlank) {
    y += 18;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("CONSTANCIA DE REGISTRO Y ACEPTACIÓN DIGITAL - CICLO LECTIVO 2027", marginX + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`N.° de Trámite: ${data.trackingNumber || data.id || "FEE-2027-ONLINE"}   |   Fecha/Hora: ${now.toLocaleDateString("es-AR")} ${now.toLocaleTimeString("es-AR")}`, marginX + 4, y + 11);
    doc.text(`Facturación: ${data.billingName || p1Name} (CUIT/CUIL: ${data.billingCuit || p1Dni}) - Condición: ${data.billingTaxCondition || "Consumidor Final"}`, marginX + 4, y + 16);
    doc.text("Contrato Marco aceptado en su totalidad mediante firma táctil electrónica y casillas de conformidad legal.", marginX + 4, y + 21);
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
