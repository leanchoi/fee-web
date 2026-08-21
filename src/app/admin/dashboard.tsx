"use client";

import { useState, useRef, useMemo } from "react";
import { 
  logoutAdmin, 
  createPost, 
  updatePost, 
  deletePost, 
  togglePostPublish, 
  createUserAction, 
  deleteUser, 
  changePasswordAction,
  resetUserPasswordAction,
  deleteEnrollment,
  uploadMediaAction,
  deleteContactMessage,
  saveGalleryItemAction,
  deleteGalleryItemAction
} from "@/actions/admin";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LogOut, 
  FileText, 
  Users, 
  Eye, 
  EyeOff, 
  Trash2, 
  PlusCircle, 
  UserPlus, 
  ArrowUp, 
  ArrowDown, 
  Type, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Edit, 
  X, 
  Lock, 
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Check,
  Upload,
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
  SlidersHorizontal,
  Printer,
  Clock,
  ChevronRight,
  Copy,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Download,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FolderArchive,
  ExternalLink
} from "lucide-react";
import JSZip from "jszip";
import { generateContractPdf, downloadFilledContract, determineLevel, determineSchool, getContractFilename } from "@/lib/contractGenerator";
import { extractAllStudents, extractStudentsFromEnrollment, ExtractedStudent } from "@/lib/studentExtractor";
import { Post, Enrollment, User, ContactMessage } from "@prisma/client";

interface Block {
  id: string;
  type: "text" | "image" | "video";
  data: any;
}

const DEFAULT_GALLERY_ITEMS = [
  {
    id: "gal-1",
    image: "/photos/fee_photo_21.jpg",
    category: "Salidas Educativas",
    title: "Exploración en los Bosques Andinos",
    desc: "Caminatas y salidas de estudio en contacto con la flora y fauna nativa de la región.",
    order: 1
  },
  {
    id: "gal-2",
    image: "/photos/fee_photo_12.jpg",
    category: "Inglés & Teatro",
    title: "English Concert & Drama Festival",
    desc: "Obras teatrales y musicales íntegramente en inglés sobre el escenario.",
    order: 2
  },
  {
    id: "gal-3",
    image: "/photos/fee_photo_24.jpg",
    category: "Campamentos & Convivencia",
    title: "Jornadas Recreativas en la Naturaleza",
    desc: "Campamentos anuales y picnics formativos para afianzar vínculos y compañerismo.",
    order: 3
  },
  {
    id: "gal-4",
    image: "/photos/fee_photo_07.jpg",
    category: "Identidad & Valores",
    title: "Compromiso Cívico e Institucional",
    desc: "Nuestros abanderados y escoltas portando los símbolos de la escuela y la bandera patria.",
    order: 4
  },
  {
    id: "gal-5",
    image: "/photos/fee_photo_14.jpg",
    category: "Comunidad de Familias",
    title: "Kermesse y Encuentros Solidarios",
    desc: "El gimnasio colmado de familias en celebraciones y proyectos cooperativos.",
    order: 5
  },
  {
    id: "gal-6",
    image: "/photos/fee_photo_09.jpg",
    category: "Tecnología & Innovación",
    title: "Robótica y Pensamiento Digital",
    desc: "Alumnos experimentando con proyectos digitales y herramientas informáticas en el aula.",
    order: 6
  },
  {
    id: "gal-7",
    image: "/photos/fee_photo_06.jpg",
    category: "Ciencias Naturales",
    title: "Inmersión Científica en Instituto Balseiro",
    desc: "Salidas de estudio a centros de investigación nuclear (CNEA RA-6) y laboratorios avanzados.",
    order: 7
  },
  {
    id: "gal-8",
    image: "/photos/fee_photo_15.jpg",
    category: "Nivel Inicial",
    title: "Juego y Socialización en el Patio",
    desc: "Jornadas de descubrimiento y contención afectiva en las salas de 3, 4 y 5 años.",
    order: 8
  },
  {
    id: "gal-9",
    image: "/photos/fee_photo_22.jpg",
    category: "Certificaciones",
    title: "Acreditaciones Internacionales Cambridge",
    desc: "Entrega de diplomas y reconocimiento al mérito académico en idioma inglés.",
    order: 9
  },
  {
    id: "gal-10",
    image: "/photos/fee_photo_20.jpg",
    category: "Vida al Aire Libre",
    title: "Navegación y Campamentos en Lagos Andinos",
    desc: "Experiencias de travesía y aprendizaje en contacto con el agua y la montaña.",
    order: 10
  },
  {
    id: "gal-11",
    image: "/photos/fee_photo_10.jpg",
    category: "Cultura y Lengua",
    title: "Feria del Libro en Inglés (Book Fair)",
    desc: "Fomento del hábito lector y exploración de literatura bilingüe en biblioteca.",
    order: 11
  },
  {
    id: "gal-12",
    image: "/photos/fee_photo_08.jpg",
    category: "Nivel Secundario",
    title: "Colación y Fiesta de Egresados",
    desc: "Cierre de ciclo formativo y celebración del futuro de nuestros estudiantes.",
    order: 12
  }
];

function generateSuggestedPassword(): string {
  const words = ["Esquel", "Patagonia", "Futaleufu", "Cordillera", "Andes", "Nieve", "Puelo", "Maiten"];
  const symbols = ["#", "$", "!", "&", "@"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${word}${symbol}${num}${rand}`;
}

export function AdminDashboard({ 
  posts, 
  enrollments, 
  contactMessages = [],
  users, 
  gallery = [],
  session,
  onLogout 
}: { 
  posts: Post[], 
  enrollments: Enrollment[], 
  contactMessages: ContactMessage[],
  users: User[], 
  gallery?: any[],
  session: any,
  onLogout?: () => void 
}) {
  const router = useRouter();
  
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const userPerms = session.permissions?.split(",") || [];
  const hasBlogPerm = isSuperAdmin || userPerms.includes("blog");
  const hasEnrollmentsPerm = isSuperAdmin || userPerms.includes("enrollments");
  const hasContactsPerm = isSuperAdmin || userPerms.includes("contacts");

  const [activeTab, setActiveTab] = useState<"posts" | "reinscripciones" | "preinscripciones" | "contacts" | "users" | "gallery">(() => {
    if (userPerms.includes("enrollments") || isSuperAdmin) return "reinscripciones";
    if (isSuperAdmin || userPerms.includes("blog")) return "posts";
    if (userPerms.includes("contacts")) return "contacts";
    return "reinscripciones";
  });
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Gallery State (default to preloaded official 12 items if empty)
  const [galleryList, setGalleryList] = useState<any[]>(() => {
    if (Array.isArray(gallery) && gallery.length > 0) return gallery;
    return DEFAULT_GALLERY_ITEMS;
  });
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<any | null>(null);

  // Enrollments and Contacts State
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>(enrollments || []);
  const [contactList, setContactList] = useState<ContactMessage[]>(contactMessages || []);

  // Partition between Reinscripciones 2027 and Preinscripciones Generales
  const reinscripcionesList = useMemo(() => {
    return enrollmentList.filter((e: any) => {
      if (e.type === "preinscripcion_general") return false;
      return true; // Todos los de 2027 o con datos de contrato
    });
  }, [enrollmentList]);

  const preinscripcionesList = useMemo(() => {
    return enrollmentList.filter((e: any) => {
      return e.type === "preinscripcion_general" || (!e.studentDni && !e.signature1Data && !e.parent1Dni);
    });
  }, [enrollmentList]);

  // Enrollments Filtering, Selection & ZIP Export State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState("");
  const [enrollmentSchoolFilter, setEnrollmentSchoolFilter] = useState<"all" | "Escuela N.º 1030" | "Escuela N.º 1739">("all");
  const [enrollmentLevelFilter, setEnrollmentLevelFilter] = useState<"all" | "inicial" | "primario" | "secundario">("all");
  const [enrollmentDatePreset, setEnrollmentDatePreset] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "thisYear" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [enrollmentViewMode, setEnrollmentViewMode] = useState<"cards" | "table">("cards");
  const [studentEntityViewMode, setStudentEntityViewMode] = useState<"students" | "forms">("students");
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [inspectingEnrollment, setInspectingEnrollment] = useState<any | null>(null);

  // Desglose de todos los alumnos individuales (Titulares + Hermanos)
  const allExtractedStudents = useMemo(() => {
    return extractAllStudents(reinscripcionesList);
  }, [reinscripcionesList]);

  const filteredExtractedStudents = useMemo(() => {
    return allExtractedStudents.filter((s: ExtractedStudent) => {
      // 1. Search Query
      if (enrollmentSearchQuery.trim()) {
        const q = enrollmentSearchQuery.toLowerCase();
        const matchName = (s.studentName || "").toLowerCase().includes(q);
        const matchDni = (s.studentDni || "").toLowerCase().includes(q);
        const matchTutor = (s.parent1Name || "").toLowerCase().includes(q);
        const matchEmail = (s.parent1Email || "").toLowerCase().includes(q);
        const matchPhone = (s.parent1Phone || "").toLowerCase().includes(q);
        const matchGrade = (s.studentGrade || "").toLowerCase().includes(q);
        const matchSchool = (s.school || "").toLowerCase().includes(q);
        const matchTracking = (s.trackingNumber || "").toLowerCase().includes(q);
        if (!matchName && !matchDni && !matchTutor && !matchEmail && !matchPhone && !matchGrade && !matchSchool && !matchTracking) {
          return false;
        }
      }

      // 2. School Filter
      if (enrollmentSchoolFilter !== "all") {
        const sch = s.school.toLowerCase();
        if (enrollmentSchoolFilter === "Escuela N.º 1030" && !sch.includes("1030")) return false;
        if (enrollmentSchoolFilter === "Escuela N.º 1739" && !sch.includes("1739")) return false;
      }

      // 3. Level Filter
      if (enrollmentLevelFilter !== "all") {
        const lvl = s.studentLevel.toLowerCase();
        if (!lvl.includes(enrollmentLevelFilter)) return false;
      }

      // 4. Date Preset Filter
      const itemDate = new Date(s.createdAt);
      const now = new Date();
      if (enrollmentDatePreset === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (itemDate < startOfToday || itemDate > endOfToday) return false;
      } else if (enrollmentDatePreset === "yesterday") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        if (itemDate < startOfYesterday || itemDate > endOfYesterday) return false;
      } else if (enrollmentDatePreset === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < sevenDaysAgo) return false;
      } else if (enrollmentDatePreset === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < thirtyDaysAgo) return false;
      } else if (enrollmentDatePreset === "thisYear") {
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        if (itemDate < startOfYear) return false;
      } else if (enrollmentDatePreset === "custom") {
        if (customStartDate) {
          const sDate = new Date(customStartDate + "T00:00:00");
          if (itemDate < sDate) return false;
        }
        if (customEndDate) {
          const eDate = new Date(customEndDate + "T23:59:59");
          if (itemDate > eDate) return false;
        }
      }

      return true;
    });
  }, [allExtractedStudents, enrollmentSearchQuery, enrollmentSchoolFilter, enrollmentLevelFilter, enrollmentDatePreset, customStartDate, customEndDate]);

  const filteredEnrollments = useMemo(() => {
    return reinscripcionesList.filter((e: any) => {
      // 1. Search Query
      if (enrollmentSearchQuery.trim()) {
        const q = enrollmentSearchQuery.toLowerCase();
        const matchName = (e.studentName || "").toLowerCase().includes(q);
        const matchDni = (e.studentDni || "").toLowerCase().includes(q);
        const matchTutor = (e.parent1Name || e.tutorName || "").toLowerCase().includes(q);
        const matchEmail = (e.parent1Email || e.tutorEmail || "").toLowerCase().includes(q);
        const matchPhone = (e.parent1Phone || e.tutorPhone || "").toLowerCase().includes(q);
        const matchGrade = (e.studentGrade || "").toLowerCase().includes(q);
        const matchSchool = (e.school || "").toLowerCase().includes(q);
        const matchComments = (e.comments || "").toLowerCase().includes(q);
        if (!matchName && !matchDni && !matchTutor && !matchEmail && !matchPhone && !matchGrade && !matchSchool && !matchComments) {
          return false;
        }
      }

      // 2. School Filter
      if (enrollmentSchoolFilter !== "all") {
        const sch = (e.school || "Escuela N.º 1030").toLowerCase();
        if (enrollmentSchoolFilter === "Escuela N.º 1030" && !sch.includes("1030")) return false;
        if (enrollmentSchoolFilter === "Escuela N.º 1739" && !sch.includes("1739")) return false;
      }

      // 3. Level Filter
      if (enrollmentLevelFilter !== "all") {
        const lvl = (e.studentLevel || e.studentGrade || "").toLowerCase();
        if (!lvl.includes(enrollmentLevelFilter)) return false;
      }

      // 4. Date Preset Filter
      const itemDate = new Date(e.createdAt);
      const now = new Date();
      if (enrollmentDatePreset === "today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (itemDate < startOfToday || itemDate > endOfToday) return false;
      } else if (enrollmentDatePreset === "yesterday") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        if (itemDate < startOfYesterday || itemDate > endOfYesterday) return false;
      } else if (enrollmentDatePreset === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < sevenDaysAgo) return false;
      } else if (enrollmentDatePreset === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < thirtyDaysAgo) return false;
      } else if (enrollmentDatePreset === "thisYear") {
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        if (itemDate < startOfYear) return false;
      } else if (enrollmentDatePreset === "custom") {
        if (customStartDate) {
          const s = new Date(customStartDate + "T00:00:00");
          if (itemDate < s) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + "T23:59:59");
          if (itemDate > end) return false;
        }
      }

      return true;
    });
  }, [reinscripcionesList, enrollmentSearchQuery, enrollmentSchoolFilter, enrollmentLevelFilter, enrollmentDatePreset, customStartDate, customEndDate]);

  const handleSelectAllEnrollments = () => {
    if (selectedEnrollmentIds.length === filteredEnrollments.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(filteredEnrollments.map(e => e.id));
    }
  };

  const handleToggleSelectEnrollment = (id: string) => {
    setSelectedEnrollmentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDownloadSinglePdf = (e: any) => {
    downloadFilledContract({
      studentName: e.studentName || "",
      studentDni: e.studentDni || "",
      school: e.school || "Escuela N.º 1030",
      studentLevel: e.studentLevel || determineLevel(e.studentGrade, e.school),
      level: e.studentLevel || determineLevel(e.studentGrade, e.school),
      studentGrade: e.studentGrade || "",
      hasSiblings: Boolean(e.hasSiblings),
      siblingDetails: e.siblingDetails || "",
      parent1Name: e.parent1Name || e.tutorName || "",
      parent1Dni: e.parent1Dni || "",
      parent1Relationship: e.parent1Relationship || "Madre/Padre/Tutor",
      parent1Phone: e.parent1Phone || e.tutorPhone || "",
      parent1Email: e.parent1Email || e.tutorEmail || "",
      parent1Address: e.parent1Address || "",
      parent1City: e.parent1City || "Esquel",
      parent1PostalCode: e.parent1PostalCode || "9200",
      isSingleParent: Boolean(e.isSingleParent),
      parent2Name: e.parent2Name || "",
      parent2Dni: e.parent2Dni || "",
      parent2Relationship: e.parent2Relationship || "",
      parent2Phone: e.parent2Phone || "",
      parent2Email: e.parent2Email || "",
      parent2Address: e.parent2Address || "",
      parent2City: e.parent2City || "Esquel",
      parent2PostalCode: e.parent2PostalCode || "9200",
      billingName: e.billingName || e.parent1Name || e.tutorName || "",
      billingCuit: e.billingCuit || e.parent1Dni || "",
      billingTaxCondition: e.billingTaxCondition || "Consumidor Final",
      billingEmail: e.billingEmail || e.parent1Email || e.tutorEmail || "",
      billingAddress: e.billingAddress || e.parent1Address || "",
      signature1Data: e.signature1Data || null,
      signature2Data: e.signature2Data || null,
      trackingNumber: e.trackingNumber || e.id,
      signedAt: e.createdAt
    });
  };

  const handleDownloadZip = async (itemsToZip: any[], zipName: string) => {
    if (itemsToZip.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of itemsToZip) {
        const doc = generateContractPdf({
          studentName: item.studentName || "",
          studentDni: item.studentDni || "",
          school: item.school || "Escuela N.º 1030",
          studentLevel: item.studentLevel || determineLevel(item.studentGrade, item.school),
          level: item.studentLevel || determineLevel(item.studentGrade, item.school),
          studentGrade: item.studentGrade || "",
          hasSiblings: Boolean(item.hasSiblings),
          siblingDetails: item.siblingDetails || "",
          parent1Name: item.parent1Name || item.tutorName || "",
          parent1Dni: item.parent1Dni || "",
          parent1Relationship: item.parent1Relationship || "Madre/Padre/Tutor",
          parent1Phone: item.parent1Phone || item.tutorPhone || "",
          parent1Email: item.parent1Email || item.tutorEmail || "",
          parent1Address: item.parent1Address || "",
          parent1City: item.parent1City || "Esquel",
          parent1PostalCode: item.parent1PostalCode || "9200",
          isSingleParent: Boolean(item.isSingleParent),
          parent2Name: item.parent2Name || "",
          parent2Dni: item.parent2Dni || "",
          parent2Relationship: item.parent2Relationship || "",
          parent2Phone: item.parent2Phone || "",
          parent2Email: item.parent2Email || "",
          parent2Address: item.parent2Address || "",
          parent2City: item.parent2City || "Esquel",
          parent2PostalCode: item.parent2PostalCode || "9200",
          billingName: item.billingName || item.parent1Name || item.tutorName || "",
          billingCuit: item.billingCuit || item.parent1Dni || "",
          billingTaxCondition: item.billingTaxCondition || "Consumidor Final",
          billingEmail: item.billingEmail || item.parent1Email || item.tutorEmail || "",
          billingAddress: item.billingAddress || item.parent1Address || "",
          signature1Data: item.signature1Data || null,
          signature2Data: item.signature2Data || null,
          trackingNumber: item.trackingNumber || item.id,
          signedAt: item.createdAt
        });
        const pdfBlob = doc.output("blob");
        const pdfFileName = getContractFilename({
          studentName: item.studentName || "",
          studentDni: item.studentDni || "",
          parent1Dni: item.parent1Dni || "",
          billingCuit: item.billingCuit || item.parent1Dni || "",
          parent1Name: item.parent1Name || item.tutorName || "",
          parent1Relationship: item.parent1Relationship || "Padre/Madre/Tutor",
          parent1Phone: item.parent1Phone || item.tutorPhone || "",
          parent1Email: item.parent1Email || item.tutorEmail || "",
          parent1Address: item.parent1Address || "",
          parent1City: item.parent1City || "Esquel",
          parent1PostalCode: item.parent1PostalCode || "9200",
          school: item.school || "Escuela N.º 1030",
          studentGrade: item.studentGrade || ""
        });
        const schoolFolder = (item.school || "Escuela_1030").includes("1739") ? "Escuela_1739" : "Escuela_1030";
        zip.folder(schoolFolder)?.file(pdfFileName, pdfBlob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${zipName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating zip:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredExtractedStudents;
    if (exportData.length === 0) return;
    const headers = [
      "ID Trámite",
      "N.° Trámite",
      "Tipo de Alumno",
      "Fecha Solicitud",
      "Nivel Educativo",
      "Sala/Grado/Año",
      "Escuela",
      "Nombre y Apellido Alumno",
      "DNI Alumno",
      "Hermanos en Familia",
      "Alumno Titular del Trámite",
      "Responsable 1",
      "DNI Resp 1",
      "Vínculo Resp 1",
      "Teléfono Resp 1",
      "Email Resp 1",
      "Domicilio",
      "Ciudad",
      "Código Postal",
      "Único Responsable",
      "Responsable 2",
      "DNI Resp 2",
      "Facturación Titular",
      "Facturación CUIT/DNI",
      "Facturación Condición",
      "Facturación Email",
      "Facturación Domicilio",
      "Estado",
      "Firma 1 Registrada",
      "Firma 2 Registrada"
    ];

    const rows = exportData.map((s: ExtractedStudent) => [
      s.enrollmentId,
      s.trackingNumber,
      s.studentType,
      new Date(s.createdAt).toLocaleDateString() + " " + new Date(s.createdAt).toLocaleTimeString(),
      s.studentLevel,
      s.studentGrade,
      s.school,
      s.studentName,
      s.studentDni,
      s.hasSiblings ? `SÍ (${s.totalSiblingsInFamily} alumnos en total)` : "NO",
      s.familyPrimaryStudent,
      s.parent1Name,
      s.parent1Dni,
      s.parent1Relationship,
      s.parent1Phone,
      s.parent1Email,
      s.parent1Address,
      s.parent1City,
      s.parent1PostalCode,
      s.isSingleParent ? "SÍ" : "NO",
      s.parent2Name || "-",
      s.parent2Dni || "-",
      s.billingName,
      s.billingCuit,
      s.billingTaxCondition,
      s.billingEmail,
      s.billingAddress,
      s.status,
      s.signature1Data ? "SÍ" : "NO",
      s.signature2Data ? "SÍ" : (s.isSingleParent ? "N/A" : "NO")
    ]);

    const csvContent = "\uFEFF" + [
      headers.map(h => `"${h}"`).join(";"),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reinscripciones_2027_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // User Management State
  const [userList, setUserList] = useState<any[]>(users || []);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState(() => generateSuggestedPassword());
  const [newRole, setNewRole] = useState("EDITOR");
  const [permBlog, setPermBlog] = useState(true);
  const [permEnrollments, setPermEnrollments] = useState(false);
  const [permContacts, setPermContacts] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [resetPasswordTargetUser, setResetPasswordTargetUser] = useState<any | null>(null);

  // First Login Mandatory Password Change Modal
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(!!session.mustChangePassword);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (e) {}
    if (typeof document !== "undefined") {
      document.cookie = "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
    }
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = "/admin";
    }
  };

  const handleNewGalleryItem = () => {
    setEditingGalleryItem(null);
    setShowGalleryModal(true);
  };

  const handleEditGalleryItem = (item: any) => {
    setEditingGalleryItem(item);
    setShowGalleryModal(true);
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!confirm("¿Eliminar esta foto de la galería principal?")) return;
    try {
      const res = await deleteGalleryItemAction(id);
      if (res.success && res.gallery) {
        setGalleryList(res.gallery);
      } else {
        setGalleryList(prev => prev.filter(it => it.id !== id));
      }
    } catch (err: any) {
      alert("Error al eliminar");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("¿Eliminar este post definitivamente?")) return;
    try {
      const res = await deletePost(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar");
      }
    } catch (err: any) {
      alert(err.message || "Error");
    }
  };

  const handleToggleState = async (id: string, current: boolean) => {
    try {
      await togglePostPublish(id, current);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Error");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    setIsSubmittingUser(true);

    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (!cleanUsername || cleanUsername.length < 3) {
      setUserError("El nombre de usuario debe tener al menos 3 caracteres alfanuméricos (sin @ ni espacios).");
      setIsSubmittingUser(false);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setUserError("La contraseña debe contener al menos 6 caracteres.");
      setIsSubmittingUser(false);
      return;
    }

    const permsArray: string[] = [];
    if (permBlog) permsArray.push("blog");
    if (permEnrollments) permsArray.push("enrollments");
    if (permContacts) permsArray.push("contacts");

    try {
      const res = await createUserAction({
        username: cleanUsername,
        name: newName.trim() || cleanUsername,
        password: newPassword.trim(),
        role: newRole,
        permissions: newRole === "SUPER_ADMIN" ? "blog,contacts,enrollments,users,gallery" : permsArray.join(","),
      });

      if (res.success) {
        setUserSuccess(res.message || `Usuario '${cleanUsername}' creado correctamente.`);
        setUserList(prev => [
          {
            id: 'user-' + Date.now(),
            username: cleanUsername,
            email: cleanUsername + '@fee.local',
            name: newName.trim() || cleanUsername,
            role: newRole,
            permissions: newRole === "SUPER_ADMIN" ? "blog,contacts,enrollments,users,gallery" : permsArray.join(","),
            mustChangePassword: 1,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
        setNewUsername("");
        setNewName("");
        setNewPassword(generateSuggestedPassword());
        setNewRole("EDITOR");
        setPermBlog(true);
        setPermEnrollments(false);
        setPermContacts(false);
        router.refresh();
      } else {
        setUserError(res.error || "Error al crear usuario");
      }
    } catch (err: any) {
      setUserError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;
    try {
      const res = await deleteUser(id);
      if (res.success) {
        setUserList(prev => prev.filter(u => u.id !== id));
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar usuario");
      }
    } catch (err: any) {
      alert(err.message || "Error al conectar con el servidor");
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleDeleteContactMessage = async (id: string) => {
    if (!confirm("¿Eliminar esta consulta de contacto definitivamente?")) return;
    try {
      const res = await deleteContactMessage(id);
      if (res.success) {
        setContactList(prev => prev.filter(m => m.id !== id));
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar");
      }
    } catch (err: any) {
      alert(err.message || "Error");
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseás eliminar esta solicitud de inscripción definitivamente?")) return;
    try {
      const res = await deleteEnrollment(id);
      if (res.success) {
        setEnrollmentList(prev => prev.filter(e => e.id !== id));
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar la inscripción");
      }
    } catch (err: any) {
      alert(err.message || "Error al conectar con el servidor");
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowModal(true);
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setShowModal(true);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-brand-gray/10 overflow-hidden">
      
      {/* Dashboard Nav */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b px-8 py-6 bg-brand-gray/5">
        <div className="flex flex-wrap gap-2">
          {hasBlogPerm && (
            <button 
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === "posts" ? "bg-brand-blue text-white shadow-md" : "text-brand-blue hover:bg-brand-gray/10"}`}
            >
              <FileText className="w-4 h-4" /> Novedades
            </button>
          )}

          {hasBlogPerm && (
            <button 
              onClick={() => setActiveTab("gallery")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === "gallery" ? "bg-brand-blue text-white shadow-md" : "text-brand-blue hover:bg-brand-gray/10"}`}
            >
              <ImageIcon className="w-4 h-4" /> Galería Home
            </button>
          )}
          
          {hasEnrollmentsPerm && (
            <button 
              onClick={() => setActiveTab("reinscripciones")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer",
                activeTab === "reinscripciones" ? "bg-emerald-700 text-white shadow-md" : "text-emerald-800 hover:bg-emerald-50"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Reinscripciones 2027</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black",
                activeTab === "reinscripciones" ? "bg-white text-emerald-900" : "bg-emerald-100 text-emerald-800"
              )}>
                {reinscripcionesList.length}
              </span>
            </button>
          )}

          {hasEnrollmentsPerm && (
            <button 
              onClick={() => setActiveTab("preinscripciones")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer",
                activeTab === "preinscripciones" ? "bg-brand-blue text-white shadow-md" : "text-brand-blue hover:bg-brand-blue/10"
              )}
            >
              <Users className="w-4 h-4" />
              <span>Preinscripciones</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black",
                activeTab === "preinscripciones" ? "bg-white text-brand-blue" : "bg-brand-blue/10 text-brand-blue"
              )}>
                {preinscripcionesList.length}
              </span>
            </button>
          )}
          
          {hasContactsPerm && (
            <button 
              onClick={() => setActiveTab("contacts")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === "contacts" ? "bg-teal-700 text-white shadow-md" : "text-teal-700 hover:bg-brand-gray/10"}`}
            >
              <Mail className="w-4 h-4" /> Consultas
            </button>
          )}
          
          {isSuperAdmin && (
            <button 
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === "users" ? "bg-brand-yellow-dark text-brand-blue shadow-md bg-brand-yellow/30" : "text-brand-blue hover:bg-brand-gray/10"}`}
            >
              <UserCheck className="w-4 h-4" /> Usuarios
            </button>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-full transition-colors self-end sm:self-auto"
        >
          Salir <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8 md:p-12">
        {hasBlogPerm && activeTab === "posts" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-blue">Gestión de Novedades</h2>
              <button 
                onClick={handleNewPost}
                className="flex items-center gap-2 bg-brand-blue text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-brand-green transition-all shadow-md"
              >
                <PlusCircle className="w-5 h-5" /> Nueva Entrada
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-gray/5 text-brand-blue text-sm">
                    <th className="p-4 font-bold border-b">Título</th>
                    <th className="p-4 font-bold border-b">Categoría</th>
                    <th className="p-4 font-bold border-b">Fecha</th>
                    <th className="p-4 font-bold border-b">Estado</th>
                    <th className="p-4 font-bold border-b text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {posts.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-brand-gray/5 transition-colors">
                      <td className="p-4 font-medium max-w-[200px] truncate">{p.title}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-brand-yellow/20 text-brand-yellow-dark rounded-md font-semibold text-xs">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 text-brand-foreground/70">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md font-semibold text-xs ${p.published ? 'bg-green-100 text-green-700' : 'bg-brand-gray/20 text-brand-gray'}`}>
                          {p.published ? "Público" : "Borrador"}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => handleEditPost(p)} className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors" title="Editar Contenido">
                          <Edit className="w-4 h-4"/>
                        </button>
                        <button onClick={() => handleToggleState(p.id, p.published)} className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors" title={p.published ? "Ocultar" : "Publicar"}>
                          {p.published ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => handleDeletePost(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-brand-gray">No hay novedades cargadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hasEnrollmentsPerm && activeTab === "reinscripciones" && (
          <div>
            {/* Header with Title and Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-brand-green">Reinscripciones y Solicitudes 2027</h2>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Ciclo 2027
                  </span>
                </div>
                <p className="text-xs text-brand-foreground/70 mt-1 font-medium">
                  Gestión integral de reinscripciones de las Escuelas N.º 1030 y N.º 1739 con contratos firmados y exportación.
                </p>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button 
                  onClick={() => setShowAnalyticsModal(true)}
                  className="flex items-center gap-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-brand-green/20 cursor-pointer shadow-2xs"
                >
                  <BarChart3 className="w-4 h-4" /> Métricas
                </button>

                <button 
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-emerald-200 cursor-pointer shadow-2xs"
                  title="Exportar base de datos completa a Excel / CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Excel
                </button>

                {selectedEnrollmentIds.length > 0 && (
                  <button 
                    disabled={isZipping}
                    onClick={() => handleDownloadZip(filteredEnrollments.filter(e => selectedEnrollmentIds.includes(e.id)), `Contratos_Seleccionados_${selectedEnrollmentIds.length}`)}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderArchive className="w-4 h-4" />}
                    Descargar Seleccionados ({selectedEnrollmentIds.length} ZIP)
                  </button>
                )}

                <button 
                  disabled={isZipping || filteredEnrollments.length === 0}
                  onClick={() => handleDownloadZip(filteredEnrollments, `Contratos_Reinscripciones_2027_Total_${filteredEnrollments.length}`)}
                  className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-green text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  title="Descargar todos los contratos filtrados en un archivo comprimido ZIP"
                >
                  {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Descargar Todos (ZIP)
                </button>

                <div className="bg-brand-gray/10 p-1 rounded-xl flex items-center shrink-0 border ml-auto lg:ml-0">
                  <button
                    onClick={() => setEnrollmentViewMode("cards")}
                    className={cn(
                      "p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      enrollmentViewMode === "cards" ? "bg-white text-brand-blue shadow-2xs" : "text-brand-foreground/60 hover:text-brand-blue"
                    )}
                    title="Vista en Fichas"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEnrollmentViewMode("table")}
                    className={cn(
                      "p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      enrollmentViewMode === "table" ? "bg-white text-brand-blue shadow-2xs" : "text-brand-foreground/60 hover:text-brand-blue"
                    )}
                    title="Vista en Tabla"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Banner */}
            {(() => {
              const totalStudentsCount = allExtractedStudents.length;
              const totalFormsCount = reinscripcionesList.length;
              const inicialCount = allExtractedStudents.filter((s: ExtractedStudent) => s.studentLevel === "Nivel Inicial").length;
              const primarioCount = allExtractedStudents.filter((s: ExtractedStudent) => s.studentLevel === "Nivel Primario").length;
              const secundarioCount = allExtractedStudents.filter((s: ExtractedStudent) => s.studentLevel === "Nivel Secundario").length;

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <button
                      onClick={() => {
                        setEnrollmentSchoolFilter("all");
                        setEnrollmentLevelFilter("all");
                      }}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "all" && enrollmentSchoolFilter === "all" ? "bg-slate-900 text-white shadow-md scale-[1.01] border-slate-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-0.5", enrollmentLevelFilter === "all" && enrollmentSchoolFilter === "all" ? "text-white/80" : "text-slate-600")}>
                        Total Estudiantes
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "all" && enrollmentSchoolFilter === "all" ? "text-white" : "text-slate-900")}>
                        {totalStudentsCount}
                      </span>
                      <span className={cn("text-[10px] block mt-0.5 font-medium", enrollmentLevelFilter === "all" && enrollmentSchoolFilter === "all" ? "text-white/70" : "text-slate-500")}>
                        {totalFormsCount} trámites familiares
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setEnrollmentSchoolFilter("all");
                        setEnrollmentLevelFilter("inicial");
                      }}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "inicial" ? "bg-teal-700 text-white shadow-md scale-[1.01] border-teal-700" : "bg-teal-50/70 border-teal-200 hover:bg-teal-100"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-0.5", enrollmentLevelFilter === "inicial" ? "text-white/80" : "text-teal-800")}>
                        Nivel Inicial (Jardín)
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "inicial" ? "text-white" : "text-teal-800")}>
                        {inicialCount}
                      </span>
                      <span className={cn("text-[10px] block mt-0.5 font-medium", enrollmentLevelFilter === "inicial" ? "text-white/70" : "text-teal-700")}>
                        Alumnos matriculados
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setEnrollmentSchoolFilter("all");
                        setEnrollmentLevelFilter("primario");
                      }}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "primario" ? "bg-emerald-700 text-white shadow-md scale-[1.01] border-emerald-700" : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-0.5", enrollmentLevelFilter === "primario" ? "text-white/80" : "text-emerald-800")}>
                        Nivel Primario (Esc. 1030)
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "primario" ? "text-white" : "text-emerald-800")}>
                        {primarioCount}
                      </span>
                      <span className={cn("text-[10px] block mt-0.5 font-medium", enrollmentLevelFilter === "primario" ? "text-white/70" : "text-emerald-700")}>
                        Alumnos matriculados
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setEnrollmentSchoolFilter("all");
                        setEnrollmentLevelFilter("secundario");
                      }}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "secundario" ? "bg-blue-800 text-white shadow-md scale-[1.01] border-blue-800" : "bg-blue-50/70 border-blue-200 hover:bg-blue-100"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-0.5", enrollmentLevelFilter === "secundario" ? "text-white/80" : "text-blue-900")}>
                        Nivel Secundario (Esc. 1739)
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "secundario" ? "text-white" : "text-blue-900")}>
                        {secundarioCount}
                      </span>
                      <span className={cn("text-[10px] block mt-0.5 font-medium", enrollmentLevelFilter === "secundario" ? "text-white/70" : "text-blue-700")}>
                        Alumnos matriculados
                      </span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-xs mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-brand-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={enrollmentSearchQuery}
                          onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                          placeholder="Buscar por alumno, hermano/a, DNI, responsable, teléfono, email, curso..."
                          className="w-full pl-10 pr-9 py-2 border rounded-xl text-xs sm:text-sm font-medium bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                        />
                        {enrollmentSearchQuery && (
                          <button
                            onClick={() => setEnrollmentSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-foreground/40 hover:text-brand-blue cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Period Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-brand-foreground/60 mr-1 flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> Período:
                        </span>
                        {[
                          { key: "all", label: "Todo" },
                          { key: "today", label: "Hoy" },
                          { key: "yesterday", label: "Ayer" },
                          { key: "7days", label: "7 Días" },
                          { key: "30days", label: "Último Mes" },
                          { key: "thisYear", label: "2027" },
                          { key: "custom", label: "Personalizado" },
                        ].map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => setEnrollmentDatePreset(preset.key as any)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                              enrollmentDatePreset === preset.key
                                ? "bg-slate-900 text-white shadow-2xs"
                                : "bg-brand-gray/10 text-brand-foreground/70 hover:bg-brand-gray/20"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range Picker */}
                    {enrollmentDatePreset === "custom" && (
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-gray/5 rounded-xl border text-xs animate-in fade-in duration-200">
                        <span className="font-bold text-brand-blue">Rango de fechas:</span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-brand-foreground/60">Desde:</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="px-2.5 py-1 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-brand-foreground/60">Hasta:</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="px-2.5 py-1 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-brand-blue"
                          />
                        </div>
                      </div>
                    )}

                    {/* Active Filters, Mode Switcher & Multi-Select Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
                      {/* Switcher: Alumnos Individuales vs Trámites Familiares */}
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setStudentEntityViewMode("students")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                            studentEntityViewMode === "students" 
                              ? "bg-white text-slate-900 shadow-2xs font-extrabold" 
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          Alumnos Individuales ({filteredExtractedStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentEntityViewMode("forms")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                            studentEntityViewMode === "forms" 
                              ? "bg-white text-slate-900 shadow-2xs font-extrabold" 
                              : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Trámites / Contratos ({filteredEnrollments.length})
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSelectAllEnrollments}
                          className="font-bold text-brand-blue hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          {selectedEnrollmentIds.length === filteredEnrollments.length && filteredEnrollments.length > 0 ? (
                            <>
                              <CheckSquare className="w-4 h-4 text-emerald-600" /> Deseleccionar todo
                            </>
                          ) : (
                            <>
                              <Square className="w-4 h-4 text-slate-400" /> Seleccionar todos ({filteredEnrollments.length})
                            </>
                          )}
                        </button>
                        <span className="text-brand-foreground/60">|</span>
                        <span className="text-brand-foreground/70 font-semibold">
                          Total en vista: <strong className="text-brand-blue">{filteredExtractedStudents.length}</strong> alumnos ({filteredEnrollments.length} formularios)
                        </span>
                      </div>

                      {(enrollmentSearchQuery || enrollmentSchoolFilter !== "all" || enrollmentLevelFilter !== "all" || enrollmentDatePreset !== "all" || customStartDate || customEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEnrollmentSearchQuery("");
                            setEnrollmentSchoolFilter("all");
                            setEnrollmentLevelFilter("all");
                            setEnrollmentDatePreset("all");
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }}
                          className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Reestablecer filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render Cards or Table */}
                  {studentEntityViewMode === "students" ? (
                    // VISTA 1: ALUMNOS INDIVIDUALES (TITULARES + HERMANOS DESGLOSADOS)
                    enrollmentViewMode === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {filteredExtractedStudents.map((s: ExtractedStudent) => {
                          const isEsc1739 = s.school.includes("1739");
                          const isSibling = s.studentType !== "Titular";

                          return (
                            <div 
                              key={s.uniqueId} 
                              className={cn(
                                "bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative",
                                isSibling ? "border-amber-200 bg-amber-50/10" : ""
                              )}
                            >
                              <div>
                                {/* Header Card */}
                                <div className="flex justify-between items-start gap-2 mb-3">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={cn(
                                      "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border",
                                      isEsc1739 ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    )}>
                                      {s.school}
                                    </span>
                                    {isSibling ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                        Hermano/a
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        Titular
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                    {s.trackingNumber}
                                  </span>
                                </div>

                                {/* Student Info */}
                                <div className="mb-3">
                                  <h4 className="font-extrabold text-slate-900 text-base leading-snug">
                                    {s.studentName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5 font-medium">
                                    <span>DNI: {s.studentDni}</span>
                                    <span>•</span>
                                    <span className="font-bold text-emerald-700">{s.studentLevel} — {s.studentGrade}</span>
                                  </div>
                                  {isSibling && (
                                    <p className="text-[10px] text-amber-800 bg-amber-50 rounded-md px-2 py-0.5 mt-1.5 border border-amber-200 inline-block">
                                      Vinculado a legajo de: <strong>{s.familyPrimaryStudent}</strong>
                                    </p>
                                  )}
                                </div>

                                {/* Responsible & Contact */}
                                <div className="space-y-1.5 border-t pt-3 text-xs mb-3 text-slate-700">
                                  <p className="truncate">
                                    <span className="font-bold text-slate-900">Resp. 1:</span> {s.parent1Name} ({s.parent1Relationship})
                                  </p>
                                  <p className="flex items-center gap-1.5 truncate text-slate-600">
                                    <Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" /> {s.parent1Email}
                                  </p>
                                  <p className="flex items-center gap-1.5 text-slate-600">
                                    <Phone className="w-3.5 h-3.5 text-brand-green shrink-0" /> {s.parent1Phone}
                                  </p>
                                </div>

                                {/* Signatures indicator */}
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/60 mb-3">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>Firma Digital 1: {s.signature1Data ? "✓ Registrada" : "Pendiente"}</span>
                                  {s.isSingleParent ? (
                                    <span className="text-amber-700 ml-auto">(Único Resp.)</span>
                                  ) : (
                                    <span className="ml-auto">F2: {s.signature2Data ? "✓" : "---"}</span>
                                  )}
                                </div>
                              </div>

                              {/* Card Footer Actions */}
                              <div className="border-t pt-3 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSinglePdf(s.rawEnrollment)}
                                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" /> Descargar Contrato Familiar (PDF)
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInspectingEnrollment(s.rawEnrollment)}
                                    className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                                  >
                                    Ver Ficha Familiar
                                  </button>
                                  <a 
                                    href={`mailto:${s.parent1Email}`} 
                                    className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors border cursor-pointer"
                                    title="Enviar correo"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </a>
                                  <button 
                                    onClick={() => handleDeleteEnrollment(s.enrollmentId)} 
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer border" 
                                    title="Eliminar inscripción"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredExtractedStudents.length === 0 && (
                          <div className="col-span-full py-12 text-center text-brand-gray border border-dashed rounded-3xl">
                            No se encontraron alumnos con los filtros seleccionados.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border mb-8 shadow-xs bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 text-xs border-b">
                              <th className="p-4 font-bold">Fecha / N.°</th>
                              <th className="p-4 font-bold">Tipo</th>
                              <th className="p-4 font-bold">Nivel & Curso</th>
                              <th className="p-4 font-bold">Alumno / Hermano</th>
                              <th className="p-4 font-bold">Responsable Principal</th>
                              <th className="p-4 font-bold">Firmas</th>
                              <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            {filteredExtractedStudents.map((s: ExtractedStudent) => {
                              const isSibling = s.studentType !== "Titular";
                              return (
                                <tr key={s.uniqueId} className={cn("border-b last:border-0 hover:bg-emerald-50/30 transition-colors", isSibling ? "bg-amber-50/20" : "")}>
                                  <td className="p-4 text-slate-500 whitespace-nowrap">
                                    <span className="font-semibold text-slate-800 block">{new Date(s.createdAt).toLocaleDateString()}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{s.trackingNumber}</span>
                                  </td>
                                  <td className="p-4">
                                    {isSibling ? (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-[10px] inline-block border border-amber-300">
                                        Hermano/a
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] inline-block border border-slate-200">
                                        Titular
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 block">{s.studentLevel}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[10px] inline-block">
                                        {s.studentGrade}
                                      </span>
                                      <span className="text-[10px] text-slate-400">({s.school})</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-brand-blue">
                                    <div>{s.studentName}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">DNI: {s.studentDni}</div>
                                    {isSibling && (
                                      <div className="text-[10px] text-amber-700 font-normal">Titular: {s.familyPrimaryStudent}</div>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-800">{s.parent1Name}</div>
                                    <div className="text-[11px] text-slate-500">{s.parent1Phone} • {s.parent1Email}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                                      s.signature1Data ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                    )}>
                                      <ShieldCheck className="w-3 h-3" />
                                      {s.signature1Data ? "Firmado" : "Pendiente"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadSinglePdf(s.rawEnrollment)}
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                        title="Descargar Contrato Familiar PDF"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInspectingEnrollment(s.rawEnrollment)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                        title="Ver Ficha Familiar"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteEnrollment(s.enrollmentId)} 
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Eliminar registro"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredExtractedStudents.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                  No se encontraron alumnos con los filtros seleccionados.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    // VISTA 2: TRÁMITES / FORMULARIOS FAMILIARES (1 POR FORMULARIO)
                    enrollmentViewMode === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {filteredEnrollments.map((e: any) => {
                          const isSelected = selectedEnrollmentIds.includes(e.id);
                          const isEsc1739 = (e.school || "").includes("1739");

                          return (
                            <div 
                              key={e.id} 
                              className={cn(
                                "bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative",
                                isSelected ? "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/20" : ""
                              )}
                            >
                              <div>
                                {/* Header Card */}
                                <div className="flex justify-between items-start gap-3 mb-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectEnrollment(e.id)}
                                      className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className={cn(
                                      "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border",
                                      isEsc1739 ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    )}>
                                      {e.school || "Escuela N.º 1030"}
                                    </span>
                                  </label>
                                  <span className="text-[10px] text-brand-foreground/50 font-semibold">
                                    {new Date(e.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Student Info */}
                                <div className="mb-3">
                                  <h4 className="font-extrabold text-brand-blue text-base leading-snug">
                                    {e.studentName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-foreground/70 mt-0.5 font-medium">
                                    <span>DNI: {e.studentDni || "---"}</span>
                                    <span>•</span>
                                    <span className="font-bold text-emerald-700">{e.studentLevel || determineLevel(e.studentGrade, e.school)} — {e.studentGrade}</span>
                                  </div>
                                  {e.hasSiblings && (
                                    <p className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-0.5 mt-1.5 border border-amber-200 inline-block">
                                      Hno/a: {e.siblingDetails || "Sí"}
                                    </p>
                                  )}
                                </div>

                                {/* Responsible & Contact */}
                                <div className="space-y-1.5 border-t pt-3 text-xs mb-3 text-slate-700">
                                  <p className="truncate">
                                    <span className="font-bold text-slate-900">Resp. 1:</span> {e.parent1Name || e.tutorName || "---"} ({e.parent1Relationship || "Tutor"})
                                  </p>
                                  <p className="flex items-center gap-1.5 truncate text-slate-600">
                                    <Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" /> {e.parent1Email || e.tutorEmail}
                                  </p>
                                  <p className="flex items-center gap-1.5 text-slate-600">
                                    <Phone className="w-3.5 h-3.5 text-brand-green shrink-0" /> {e.parent1Phone || e.tutorPhone}
                                  </p>
                                </div>

                                {/* Signatures indicator */}
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200/60 mb-3">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>Firma Digital 1: {e.signature1Data ? "✓ Registrada" : "Pendiente"}</span>
                                  {e.isSingleParent ? (
                                    <span className="text-amber-700 ml-auto">(Único Resp.)</span>
                                  ) : (
                                    <span className="ml-auto">F2: {e.signature2Data ? "✓" : "---"}</span>
                                  )}
                                </div>
                              </div>

                              {/* Card Footer Actions */}
                              <div className="border-t pt-3 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSinglePdf(e)}
                                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" /> Descargar Contrato (PDF)
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setInspectingEnrollment(e)}
                                    className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                                  >
                                    Ver Ficha
                                  </button>
                                  <a 
                                    href={`mailto:${e.parent1Email || e.tutorEmail}`} 
                                    className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors border cursor-pointer"
                                    title="Enviar correo"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </a>
                                  <button 
                                    onClick={() => handleDeleteEnrollment(e.id)} 
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer border" 
                                    title="Eliminar inscripción"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredEnrollments.length === 0 && (
                          <div className="col-span-full py-12 text-center text-brand-gray border border-dashed rounded-3xl">
                            No se encontraron reinscripciones con los filtros seleccionados.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border mb-8 shadow-xs bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 text-xs border-b">
                              <th className="p-4 w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedEnrollmentIds.length === filteredEnrollments.length && filteredEnrollments.length > 0}
                                  onChange={handleSelectAllEnrollments}
                                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                              </th>
                              <th className="p-4 font-bold">Fecha / N.°</th>
                              <th className="p-4 font-bold">Escuela & Curso</th>
                              <th className="p-4 font-bold">Aspirante</th>
                              <th className="p-4 font-bold">Responsable Principal</th>
                              <th className="p-4 font-bold">Firmas</th>
                              <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            {filteredEnrollments.map((e: any) => {
                              const isSelected = selectedEnrollmentIds.includes(e.id);
                              return (
                                <tr key={e.id} className={cn("border-b last:border-0 hover:bg-emerald-50/30 transition-colors", isSelected ? "bg-emerald-50/40" : "")}>
                                  <td className="p-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectEnrollment(e.id)}
                                      className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-4 text-slate-500 whitespace-nowrap">
                                    <span className="font-semibold text-slate-800 block">{new Date(e.createdAt).toLocaleDateString()}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{e.trackingNumber || `FEE-${e.id.substring(0, 5)}`}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-bold text-slate-900 block">{e.studentLevel || determineLevel(e.studentGrade, e.school)}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[10px] inline-block">
                                        {e.studentGrade}
                                      </span>
                                      <span className="text-[10px] text-slate-400">({e.school || "Escuela N.º 1030"})</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-brand-blue">
                                    <div>{e.studentName}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">DNI: {e.studentDni || "---"}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-800">{e.parent1Name || e.tutorName}</div>
                                    <div className="text-[11px] text-slate-500">{e.parent1Phone || e.tutorPhone} • {e.parent1Email || e.tutorEmail}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                                      e.signature1Data ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                    )}>
                                      <ShieldCheck className="w-3 h-3" />
                                      {e.signature1Data ? "Firmado" : "Pendiente"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadSinglePdf(e)}
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                        title="Descargar Contrato PDF"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInspectingEnrollment(e)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                        title="Ver Ficha"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteEnrollment(e.id)} 
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Eliminar inscripción"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredEnrollments.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                  No se encontraron reinscripciones con los filtros seleccionados.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB DE PREINSCRIPCIONES GENERALES */}
        {hasEnrollmentsPerm && activeTab === "preinscripciones" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-brand-blue">Preinscripciones Generales</h2>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Nuevos Ingresantes
                  </span>
                </div>
                <p className="text-xs text-brand-foreground/70 mt-1">
                  Aspirantes a vacantes nuevas y lista de espera para Nivel Inicial, Primario y Secundario.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-full">
                  Total: {preinscripcionesList.length} aspirantes
                </span>
              </div>
            </div>

            {/* Listado de Preinscripciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {preinscripcionesList.map((e: any) => {
                const initial = e.studentName ? e.studentName.charAt(0).toUpperCase() : "A";
                return (
                  <div key={e.id} className="bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center font-extrabold text-brand-blue shrink-0">
                          {initial}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-brand-foreground/50 font-semibold block">
                            {new Date(e.createdAt).toLocaleDateString()}
                          </span>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 bg-blue-50 text-blue-800 border-blue-200">
                            {e.studentLevel || "Nivel Primario"}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-brand-blue text-base mb-1">{e.studentName}</h4>
                      <p className="text-xs text-brand-foreground/60 mb-4 font-semibold">Grado/Año: {e.studentGrade}</p>

                      <div className="space-y-1.5 border-t pt-3 text-xs mb-4 text-slate-700">
                        <p className="truncate"><span className="font-bold text-slate-900">Tutor:</span> {e.tutorName || e.parent1Name || "---"}</p>
                        <p className="flex items-center gap-1.5 truncate text-slate-600"><Mail className="w-3.5 h-3.5 text-brand-blue shrink-0" /> {e.tutorEmail || e.parent1Email}</p>
                        <p className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-brand-green shrink-0" /> {e.tutorPhone || e.parent1Phone}</p>
                      </div>

                      {e.comments && (
                        <div className="bg-slate-50 border p-2.5 rounded-xl text-[11px] text-slate-700 leading-normal max-h-24 overflow-y-auto mb-4">
                          <span className="font-bold block mb-0.5 text-slate-900">Comentarios:</span>
                          {e.comments}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t pt-3">
                      <a 
                        href={`mailto:${e.tutorEmail || e.parent1Email}`} 
                        className="flex-1 text-center bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Enviar Mail
                      </a>
                      <a 
                        href={`tel:${e.tutorPhone || e.parent1Phone}`} 
                        className="flex-1 text-center bg-brand-green/5 hover:bg-brand-green/10 text-brand-green font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Llamar
                      </a>
                      <button 
                        onClick={() => handleDeleteEnrollment(e.id)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer border" 
                        title="Eliminar solicitud"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {preinscripcionesList.length === 0 && (
                <div className="col-span-full py-12 text-center text-brand-gray border border-dashed rounded-3xl">
                  No hay solicitudes de preinscripción registradas actualmente.
                </div>
              )}
            </div>
          </div>
        )}

        {hasContactsPerm && activeTab === "contacts" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-brand-blue">Consultas de Contacto</h2>
              <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-800 rounded-full">
                Total: {contactList.length} consultas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactList.map((msg) => {
                const initials = msg.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={msg.id} className="bg-brand-gray/5 border border-brand-gray/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h3 className="font-bold text-brand-blue text-sm leading-tight">{msg.name}</h3>
                            <span className="text-[10px] text-brand-foreground/60">
                              {new Date(msg.createdAt).toLocaleDateString()} a las {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <span className="inline-block text-[10px] font-bold px-2 py-1 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow-dark rounded-full">
                          {msg.subject}
                        </span>
                      </div>

                      <div className="bg-white/80 backdrop-blur-[2px] p-4 rounded-xl border text-sm text-brand-foreground/80 italic leading-relaxed mb-4 whitespace-pre-line">
                        "{msg.message}"
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t text-xs">
                      <div className="flex flex-col gap-1">
                        <a 
                          href={`mailto:${msg.email}`} 
                          className="flex items-center gap-1 text-brand-blue font-bold hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" /> {msg.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDeleteContactMessage(msg.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border"
                          title="Eliminar consulta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                          className="bg-brand-blue text-white px-3 py-1.5 rounded-full font-bold text-[11px] hover:bg-brand-green transition-colors"
                        >
                          Responder
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {contactMessages.length === 0 && (
                <div className="col-span-full py-16 text-center text-brand-gray border border-dashed rounded-3xl bg-brand-gray/5">
                  <Mail className="w-12 h-12 mx-auto opacity-30 mb-3" />
                  <p className="font-semibold">No se han registrado consultas de contacto aún.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isSuperAdmin && activeTab === "users" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-blue">Gestión de Usuarios</h2>
                <p className="text-xs text-brand-foreground/70 mt-1">
                  Creá y administrá los accesos al panel mediante nombres de usuario (sin necesidad de correo).
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-full">
                Total: {userList.length} cuentas
              </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form to Create User */}
              <div className="bg-brand-gray/5 p-6 rounded-3xl border border-brand-gray/15 h-max shadow-sm">
                <h3 className="font-bold text-brand-blue mb-4 flex items-center gap-2 text-base">
                  <UserPlus className="w-5 h-5 text-brand-green" /> Crear Nuevo Usuario
                </h3>
                
                {userError && (
                  <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}
                {userSuccess && (
                  <div className="flex items-center gap-2 text-green-700 text-xs font-semibold bg-green-50 p-3 rounded-xl mb-4 border border-green-200">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{userSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">
                      Nombre de Usuario (Login)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-brand-foreground/40 font-bold text-xs">@</span>
                      <input 
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                        required 
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full pl-8 pr-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-brand-blue outline-none font-medium" 
                        placeholder="ej: preceptor, inicial_dir, secretaria" 
                      />
                    </div>
                    <p className="text-[10px] text-brand-foreground/60 mt-1">
                      Sin espacios ni @. El ingreso no distingue mayúsculas ni minúsculas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">
                      Nombre Completo / Cargo
                    </label>
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required 
                      className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-brand-blue outline-none font-medium" 
                      placeholder="Ej: Lic. Laura Gómez (Preceptoría)" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-brand-blue">
                        Contraseña Sugerida (Provisoria)
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewPassword(generateSuggestedPassword())}
                        className="text-[11px] font-bold text-brand-blue hover:text-brand-green flex items-center gap-1 transition-colors cursor-pointer"
                        title="Generar otra clave aleatoria"
                      >
                        <RefreshCw className="w-3 h-3" /> Generar otra
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                        className="w-full px-3 py-2 text-sm border rounded-xl bg-amber-50/50 border-amber-200 text-brand-blue font-mono font-bold focus:ring-2 focus:ring-brand-blue outline-none" 
                        placeholder="Clave provisoria" 
                      />
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="bg-brand-blue/10 hover:bg-brand-blue hover:text-white text-brand-blue font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                        title="Copiar contraseña"
                      >
                        {copiedToast ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedToast ? "Copiada" : "Copiar"}
                      </button>
                    </div>

                    {/* Security Tip Box */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/40 text-[11px] text-amber-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>1° Ingreso Seguro:</strong> Al iniciar sesión por primera vez, el sistema le exigirá automáticamente a este usuario cambiar esta clave por una personal y secreta.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Tipo de Rol</label>
                    <select 
                      value={newRole} 
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-xl bg-white focus:ring-2 focus:ring-brand-blue outline-none font-medium"
                    >
                      <option value="EDITOR">Gestor Personalizado (Secciones a definir)</option>
                      <option value="SUPER_ADMIN">Super Administrador (Acceso Total)</option>
                    </select>
                  </div>

                  {newRole === "EDITOR" && (
                    <div className="space-y-2 pt-3 border-t border-brand-gray/15">
                      <label className="block text-xs font-bold text-brand-blue mb-1">Permisos de Acceso Asignados</label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-brand-foreground/80 cursor-pointer bg-white p-2 rounded-lg border border-brand-gray/10 hover:bg-brand-gray/5 transition-all">
                        <input 
                          type="checkbox" 
                          checked={permBlog}
                          onChange={(e) => setPermBlog(e.target.checked)}
                          className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4" 
                        />
                        <span>Gestionar Novedades, Blog & Galería</span>
                      </label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-brand-foreground/80 cursor-pointer bg-white p-2 rounded-lg border border-brand-gray/10 hover:bg-brand-gray/5 transition-all">
                        <input 
                          type="checkbox" 
                          checked={permEnrollments}
                          onChange={(e) => setPermEnrollments(e.target.checked)}
                          className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4" 
                        />
                        <span>Ver & Gestionar Solicitudes de Inscripción</span>
                      </label>
                      
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-brand-foreground/80 cursor-pointer bg-white p-2 rounded-lg border border-brand-gray/10 hover:bg-brand-gray/5 transition-all">
                        <input 
                          type="checkbox" 
                          checked={permContacts}
                          onChange={(e) => setPermContacts(e.target.checked)}
                          className="rounded text-brand-blue focus:ring-brand-blue w-4 h-4" 
                        />
                        <span>Ver & Gestionar Mensajes de Contacto</span>
                      </label>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmittingUser}
                    className="w-full bg-brand-green text-white py-3 rounded-full font-bold hover:bg-brand-blue transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {isSubmittingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Guardar y Crear Usuario
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="lg:col-span-2 overflow-x-auto rounded-3xl border border-brand-gray/15 bg-white shadow-sm h-max">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-gray/5 text-brand-blue text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 border-b">Usuario</th>
                      <th className="p-4 border-b">Nombre / Cargo</th>
                      <th className="p-4 border-b">Rol & Permisos</th>
                      <th className="p-4 border-b text-center">Estado Seguridad</th>
                      <th className="p-4 border-b text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-brand-gray/10">
                    {userList.map(u => {
                      const displayUsername = u.username || (u.email ? u.email.replace('@fee.local', '').replace('@fundacionesquel.edu.ar', '') : 'admin');
                      const isMasterAdmin = u.id === 'fee-super-admin-01' || displayUsername === 'admin';
                      const isSelf = u.id === session.userId;

                      return (
                        <tr key={u.id} className="hover:bg-brand-gray/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs uppercase">
                                {displayUsername.slice(0, 2)}
                              </span>
                              <div>
                                <span className="font-bold text-brand-blue block">@{displayUsername}</span>
                                <span className="text-[10px] text-brand-foreground/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Activo'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-brand-foreground/90">{u.name || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-block ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                              {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Gestor'}
                            </span>
                            {u.role !== 'SUPER_ADMIN' && u.permissions && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {u.permissions.split(',').map((p: string) => (
                                  <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-gray/10 text-brand-foreground/70 rounded">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {u.mustChangePassword ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200" title="Deberá cambiar su clave en su próximo inicio de sesión">
                                <KeyRound className="w-3 h-3 text-amber-700" /> 1° Login pendiente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-700" /> Clave Activa
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {!isMasterAdmin && !isSelf ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => setResetPasswordTargetUser(u)} 
                                  className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-xl transition-colors cursor-pointer" 
                                  title="Resetear o asignar nueva clave"
                                >
                                  <KeyRound className="w-4 h-4 text-amber-600"/>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)} 
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" 
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-brand-foreground/40 font-semibold italic">Protegido</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {userList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-brand-gray">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
        {hasBlogPerm && activeTab === "gallery" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-blue">Vida de la Escuela en Fotos (Home)</h2>
                <p className="text-xs text-brand-foreground/70 mt-1">
                  Administrá las fotos, categorías, títulos y descripciones que aparecen en el carrusel de la portada.
                </p>
              </div>
              <button 
                onClick={handleNewGalleryItem}
                className="flex items-center gap-2 bg-brand-blue text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-brand-green transition-all shadow-md shrink-0"
              >
                <PlusCircle className="w-5 h-5" /> Agregar Foto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryList.map((item, idx) => (
                <div key={item.id || idx} className="bg-white border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden bg-brand-gray/10">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-brand-blue text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-brand-blue text-base mb-1">{item.title}</h3>
                      <p className="text-xs text-brand-foreground/75 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t bg-brand-gray/5 flex justify-end gap-2">
                    <button 
                      onClick={() => handleEditGalleryItem(item)}
                      className="p-2 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteGalleryItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {galleryList.length === 0 && (
                <div className="col-span-full py-12 text-center text-brand-gray border border-dashed rounded-3xl">
                  No hay fotos en la galería. Hacé clic en "Agregar Foto" para comenzar.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showModal && (
        <PostEditorModal 
          post={editingPost} 
          onClose={() => {
            setShowModal(false);
            setEditingPost(null);
          }} 
        />
      )}

      {/* Gallery Editor Modal */}
      {showGalleryModal && (
        <GalleryEditorModal 
          item={editingGalleryItem}
          onClose={() => {
            setShowGalleryModal(false);
            setEditingGalleryItem(null);
          }}
          onSave={(updatedList) => {
            setGalleryList(updatedList);
          }}
        />
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalyticsModal && (
        <EnrollmentAnalyticsModal 
          enrollments={enrollmentList}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* Inspect Enrollment Details & Signatures Modal */}
      {inspectingEnrollment && (
        <InspectEnrollmentModal
          enrollment={inspectingEnrollment}
          onClose={() => setInspectingEnrollment(null)}
          onDownloadPdf={handleDownloadSinglePdf}
        />
      )}

      {/* First Login Mandatory Password Change Modal */}
      {showFirstLoginModal && (
        <FirstLoginPasswordChangeModal 
          session={session}
          onSuccess={() => {
            setShowFirstLoginModal(false);
          }}
        />
      )}

      {/* Reset User Password Modal (Super Admin) */}
      {resetPasswordTargetUser && (
        <ResetUserPasswordModal 
          user={resetPasswordTargetUser}
          onClose={() => setResetPasswordTargetUser(null)}
          onSuccess={() => {
            setUserList(prev => prev.map(u => u.id === resetPasswordTargetUser.id ? { ...u, mustChangePassword: 1 } : u));
            setUserSuccess(`Contraseña restablecida exitosamente para @${resetPasswordTargetUser.username || resetPasswordTargetUser.name}.`);
            setResetPasswordTargetUser(null);
          }}
        />
      )}
    </div>
  );
}

function PostEditorModal({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || "");
  const [category, setCategory] = useState(post?.category || "Institucional");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (post && post.content) {
      if (post.content.trim().startsWith("[")) {
        try {
          return JSON.parse(post.content);
        } catch (e) {
          // Fallback if parsing fails
        }
      }
      // Wrap legacy HTML content in a single text block
      return [{ 
        id: "legacy", 
        type: "text", 
        data: { text: post.content, tag: "div", color: "text-brand-blue", fontFamily: "font-sans", align: "left" } 
      }];
    }
    // New post default
    return [{ 
      id: "1", 
      type: "text", 
      data: { text: "", tag: "p", color: "text-brand-blue", fontFamily: "font-sans", align: "left" } 
    }];
  });

  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    
    // Set the content as the serialized blocks JSON string
    fd.set("content", JSON.stringify(blocks));
    
    try {
      if (post) {
        await updatePost(post.id, fd);
      } else {
        await createPost(fd);
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Error al guardar el post");
    } finally {
      setLoading(false);
    }
  };

  const addTextBlock = () => {
    setBlocks(prev => [
      ...prev,
      { id: Date.now().toString(), type: "text", data: { text: "", tag: "p", color: "text-brand-blue", fontFamily: "font-sans", align: "left" } }
    ]);
  };

  const addImageBlock = () => {
    setBlocks(prev => [
      ...prev,
      { id: Date.now().toString(), type: "image", data: { layout: "single", images: [], autoplay: false } }
    ]);
  };

  const addVideoBlock = () => {
    setBlocks(prev => [
      ...prev,
      { id: Date.now().toString(), type: "video", data: { videoType: "youtube", youtubeUrl: "", videoUrl: "" } }
    ]);
  };

  const updateBlockData = (id: string, newData: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b));
  };

  const removeBlock = (id: string) => {
    if (blocks.length === 1) {
      alert("La nota debe tener al menos un bloque de contenido.");
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    
    setBlocks(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  const handleFileUpload = async (blockId: string, file: File, blockType: "image" | "video") => {
    setUploadingBlockId(blockId);
    
    const fd = new FormData();
    fd.append("file", file);
    
    try {
      const res = await uploadMediaAction(fd);
      if (res.success && res.url) {
        if (blockType === "image") {
          const currentImages = blocks.find(b => b.id === blockId)?.data.images || [];
          updateBlockData(blockId, { images: [...currentImages, res.url] });
        } else {
          updateBlockData(blockId, { videoUrl: res.url });
        }
      } else {
        alert(res.error || "Error al subir");
      }
    } catch (err: any) {
      alert(err.message || "Error al subir archivo");
    } finally {
      setUploadingBlockId(null);
    }
  };

  const handleMultipleFileUploads = async (blockId: string, files: File[]) => {
    setUploadingBlockId(blockId);
    
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadMediaAction(fd);
        if (res.success && res.url) {
          urls.push(res.url);
        } else {
          alert(`Error al subir ${file.name}: ${res.error || "Error desconocido"}`);
        }
      }
      
      if (urls.length > 0) {
        const currentImages = blocks.find(b => b.id === blockId)?.data.images || [];
        updateBlockData(blockId, { images: [...currentImages, ...urls] });
      }
    } catch (err: any) {
      alert(err.message || "Error al subir archivos");
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6">
      <div className="bg-white rounded-[2.5rem] w-full h-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-brand-blue hover:bg-brand-gray/10 rounded-full transition-colors z-50 bg-white shadow-sm border"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
          {/* Lado Izquierdo: Editor Form */}
          <div className="lg:col-span-6 flex flex-col p-6 md:p-8 overflow-y-auto h-full border-r border-brand-gray/10">
            <h3 className="text-xl font-extrabold text-brand-blue mb-6">
              {post ? "Modificar Entrada" : "Nueva Entrada por Bloques"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-blue mb-1">Título de la Novedad</label>
                    <input 
                      name="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Título..." 
                      required 
                      className="w-full px-4 py-2 border rounded-xl bg-brand-gray/5 font-semibold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Categoría</label>
                    <select 
                      name="category" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full px-4 py-2 border rounded-xl bg-white text-brand-blue font-bold outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="Institucional">Institucional</option>
                      <option value="Eventos">Eventos</option>
                      <option value="Comunidad">Comunidad</option>
                      <option value="Inglés">Inglés</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-brand-blue mb-1">Imagen de Portada (Opcional - Reemplazar en edición)</label>
                    <input 
                      type="file" 
                      name="imageFile" 
                      accept="image/png, image/jpeg, image/webp" 
                      className="w-full px-4 py-1.5 border rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 text-xs" 
                    />
                  </div>
                  {post?.imageUrl && (
                    <div className="text-xs text-brand-foreground/75 truncate bg-brand-gray/5 border p-2 rounded-xl flex items-center gap-2">
                      <span className="font-bold">Actual:</span>
                      <span className="truncate">{post.imageUrl}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-blue mb-1">Resumen corto (Explicación de 1-2 líneas para la grilla)</label>
                  <textarea 
                    name="excerpt" 
                    value={excerpt} 
                    onChange={(e) => setExcerpt(e.target.value)} 
                    placeholder="Escribí un copete..." 
                    rows={2} 
                    required 
                    className="w-full px-4 py-2 border rounded-xl resize-none text-sm bg-brand-gray/5 outline-none focus:ring-2 focus:ring-brand-blue" 
                  />
                </div>

                {/* Bloques del Editor */}
                <div className="space-y-4 border-t pt-4">
                  <label className="block text-sm font-bold text-brand-blue">Bloques de la Nota</label>
                  
                  <div className="space-y-4">
                    {blocks.map((block, index) => (
                      <div key={block.id} className="border border-brand-gray/20 rounded-2xl p-4 bg-brand-gray/5 hover:border-brand-blue/30 transition-all flex flex-col gap-3">
                        <div className="flex justify-between items-center border-b pb-2 text-xs">
                          <span className="font-bold text-brand-blue uppercase flex items-center gap-1.5">
                            {block.type === "text" && <Type className="w-3.5 h-3.5" />}
                            {block.type === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                            {block.type === "video" && <VideoIcon className="w-3.5 h-3.5" />}
                            Bloque {index + 1}: {block.type}
                          </span>
                          
                          <div className="flex gap-1">
                            <button type="button" onClick={() => moveBlock(index, "up")} disabled={index === 0} className="p-1 hover:bg-white rounded border disabled:opacity-30">
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => moveBlock(index, "down")} disabled={index === blocks.length - 1} className="p-1 hover:bg-white rounded border disabled:opacity-30">
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button type="button" onClick={() => removeBlock(block.id)} className="p-1 text-red-500 hover:bg-red-50 rounded border border-red-200">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Render block controls */}
                        {block.type === "text" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <label className="block font-bold mb-1">Jerarquía</label>
                                <select 
                                  value={block.data.tag}
                                  onChange={(e) => updateBlockData(block.id, { tag: e.target.value })}
                                  className="w-full border rounded p-1 bg-white"
                                >
                                  <option value="p">Párrafo (P)</option>
                                  <option value="h1">Título Grande (H1)</option>
                                  <option value="h2">Subtítulo (H2)</option>
                                  <option value="h3">Subtítulo Chico (H3)</option>
                                  <option value="span">Cita / Destacado (Span)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Color</label>
                                <select 
                                  value={block.data.color}
                                  onChange={(e) => updateBlockData(block.id, { color: e.target.value })}
                                  className="w-full border rounded p-1 bg-white"
                                >
                                  <option value="text-brand-blue">Azul FEE</option>
                                  <option value="text-brand-green">Verde FEE</option>
                                  <option value="text-brand-yellow-dark">Amarillo FEE</option>
                                  <option value="text-gray-700">Gris Standard</option>
                                  <option value="text-red-600">Rojo Alerta</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Tipografía</label>
                                <select 
                                  value={block.data.fontFamily}
                                  onChange={(e) => updateBlockData(block.id, { fontFamily: e.target.value })}
                                  className="w-full border rounded p-1 bg-white"
                                >
                                  <option value="font-sans">Sans (Inter)</option>
                                  <option value="font-serif">Serif (Clásica)</option>
                                  <option value="font-mono">Mono (Código/Carta)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-bold mb-1">Alineación</label>
                                <select 
                                  value={block.data.align}
                                  onChange={(e) => updateBlockData(block.id, { align: e.target.value })}
                                  className="w-full border rounded p-1 bg-white"
                                >
                                  <option value="left">Izquierda</option>
                                  <option value="center">Centro</option>
                                  <option value="right">Derecha</option>
                                </select>
                              </div>
                            </div>
                            
                            <textarea
                              value={block.data.text}
                              onChange={(e) => updateBlockData(block.id, { text: e.target.value })}
                              placeholder="Escribí el texto aquí..."
                              rows={3}
                              className="w-full border p-2.5 rounded-xl text-sm bg-white"
                              required
                            />
                          </div>
                        )}

                        {block.type === "image" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-bold mb-1">Diseño de Imagen</label>
                                <select 
                                  value={block.data.layout}
                                  onChange={(e) => updateBlockData(block.id, { layout: e.target.value })}
                                  className="w-full border rounded p-1 bg-white"
                                >
                                  <option value="single">Foto única</option>
                                  <option value="carousel">Carrusel interactivo (Botones)</option>
                                  <option value="slider">Presentación automática (Autoplay)</option>
                                </select>
                              </div>
                              {block.data.layout === "slider" && (
                                <div className="flex items-center gap-2 pt-5">
                                  <input 
                                    type="checkbox" 
                                    id={`autoplay-${block.id}`}
                                    checked={block.data.autoplay}
                                    onChange={(e) => updateBlockData(block.id, { autoplay: e.target.checked })}
                                  />
                                  <label htmlFor={`autoplay-${block.id}`}>Reproducción automática</label>
                                </div>
                              )}
                            </div>

                            {/* Upload files */}
                            <div className="flex flex-col gap-2">
                              <label className="block text-xs font-bold">Subir foto para el bloque:</label>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                disabled={uploadingBlockId === block.id}
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (files && files.length > 0) {
                                    await handleMultipleFileUploads(block.id, Array.from(files));
                                  }
                                }}
                                className="text-xs border p-1 bg-white rounded-lg file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue"
                              />
                              {uploadingBlockId === block.id && <span className="text-xs text-brand-green font-bold animate-pulse">Subiendo archivo...</span>}
                            </div>

                            {/* Display current image list */}
                            {block.data.images && block.data.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                                {block.data.images.map((url: string, imgIdx: number) => (
                                  <div key={imgIdx} className="relative w-16 h-16 border rounded-lg overflow-hidden group">
                                    <img src={url} alt={`img-${imgIdx}`} className="w-full h-full object-cover" />
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const filtered = block.data.images.filter((_: string, idx: number) => idx !== imgIdx);
                                        updateBlockData(block.id, { images: filtered });
                                      }}
                                      className="absolute inset-0 bg-red-600/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === "video" && (
                          <div className="space-y-3">
                            <div className="text-xs">
                              <label className="block font-bold mb-1">Origen del Video</label>
                              <select 
                                  value={block.data.videoType}
                                  onChange={(e) => updateBlockData(block.id, { videoType: e.target.value })}
                                  className="w-full border rounded p-1 bg-white max-w-xs"
                              >
                                <option value="youtube">YouTube (URL / Embed)</option>
                                <option value="upload">Subir Video (Máx 50MB)</option>
                              </select>
                            </div>

                            {block.data.videoType === "youtube" ? (
                              <div>
                                <label className="block text-xs font-bold mb-1">YouTube URL o Código de Video</label>
                                <input 
                                  type="text"
                                  value={block.data.youtubeUrl}
                                  onChange={(e) => updateBlockData(block.id, { youtubeUrl: e.target.value })}
                                  placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                  className="w-full border px-3 py-1.5 rounded-lg text-sm bg-white"
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="block text-xs font-bold">Subir archivo de video (MP4/WebM, Máx 50MB)</label>
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  disabled={uploadingBlockId === block.id}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(block.id, file, "video");
                                  }}
                                  className="text-xs border p-1 bg-white rounded-lg file:mr-2 file:py-1 file:px-2 file:border-0 file:rounded-md file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue"
                                />
                                {uploadingBlockId === block.id && <span className="text-xs text-brand-green font-bold animate-pulse">Subiendo video pesado...</span>}
                                
                                {block.data.videoUrl && (
                                  <div className="text-xs text-brand-green font-medium flex gap-1.5 items-center bg-green-50 p-2 rounded-lg border">
                                    <span className="font-bold">Cargado:</span>
                                    <span className="truncate">{block.data.videoUrl}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Block Appenders */}
                  <div className="flex gap-2 justify-center py-4 border-b">
                    <button type="button" onClick={addTextBlock} className="flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-full font-bold text-xs hover:bg-brand-blue/20">
                      <Type className="w-3.5 h-3.5" /> + Texto
                    </button>
                    <button type="button" onClick={addImageBlock} className="flex items-center gap-1.5 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full font-bold text-xs hover:bg-brand-green/20">
                      <ImageIcon className="w-3.5 h-3.5" /> + Imagen / Carrusel
                    </button>
                    <button type="button" onClick={addVideoBlock} className="flex items-center gap-1.5 bg-brand-yellow/20 text-brand-yellow-dark px-4 py-2 rounded-full font-bold text-xs hover:bg-brand-yellow/30">
                      <VideoIcon className="w-3.5 h-3.5" /> + Video / YouTube
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 justify-end mt-8 border-t pt-4 bg-white sticky bottom-0">
                <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-brand-gray hover:text-brand-blue">Cancelar</button>
                <button type="submit" disabled={loading || uploadingBlockId !== null} className="px-8 py-3 bg-brand-blue text-white rounded-full font-bold shadow-md hover:bg-brand-green disabled:opacity-40">
                  {loading ? "Guardando..." : (post ? "Guardar Cambios" : "Publicar Nota")}
                </button>
              </div>
            </form>
          </div>

          {/* Lado Derecho: Live Preview */}
          <div className="lg:col-span-6 bg-slate-50 p-6 md:p-8 overflow-y-auto h-full hidden lg:flex flex-col gap-6">
            <div className="border-b border-brand-gray/20 pb-4">
              <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest block mb-1">Previsualización en Vivo</span>
              <h4 className="text-sm font-medium text-brand-gray">Así se verá tu novedad una vez publicada en la web pública:</h4>
            </div>

            {/* Simulated Public Article Page */}
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-lg border border-brand-gray/10 flex-1 flex flex-col gap-6 min-h-max">
              <div>
                <span className="inline-block px-3 py-1 bg-brand-yellow/10 text-brand-yellow-dark text-xs font-bold rounded-full mb-4">
                  {category}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-brand-blue leading-tight mb-4">
                  {title || <span className="text-gray-300 italic">Sin título aún...</span>}
                </h1>
                <div className="flex items-center gap-3 text-xs text-brand-foreground/60 font-medium">
                  <Calendar className="w-4 h-4 text-brand-green" />
                  <span>{new Date().toLocaleDateString("es-AR", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span>• Dirección Institucional</span>
                </div>
              </div>

              {excerpt && (
                <p className="text-brand-foreground/80 font-medium leading-relaxed italic border-l-4 border-brand-yellow pl-4 py-1 bg-brand-yellow/5 rounded-r-xl text-sm">
                  {excerpt}
                </p>
              )}

              {/* Dynamic preview block renderer */}
              <div className="space-y-6 pt-4 border-t border-brand-gray/10 flex-1">
                {blocks.map((block) => {
                  if (block.type === "text") {
                    const Tag = (block.data.tag || "p") as any;
                    const colorClass = block.data.color || "text-brand-blue";
                    const alignClass = block.data.align === "center" ? "text-center" : block.data.align === "right" ? "text-right" : "text-left";
                    const fontClass = block.data.fontFamily === "serif" ? "font-serif" : block.data.fontFamily === "mono" ? "font-mono" : "font-sans";
                    
                    return (
                      <Tag key={block.id} className={cn(colorClass, alignClass, fontClass, "leading-relaxed text-sm md:text-base font-semibold")}>
                        {block.data.text || <span className="text-gray-300 italic">Bloque de texto vacío...</span>}
                      </Tag>
                    );
                  }
                  if (block.type === "image") {
                    const images = block.data.images || [];
                    if (images.length === 0) {
                      return (
                        <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray gap-2">
                          <ImageIcon className="w-6 h-6 text-brand-gray/60" />
                          <span>Bloque de Imagen (sin fotos aún)</span>
                        </div>
                      );
                    }
                    return (
                      <div key={block.id} className="space-y-2">
                        <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider block">Vista: {block.data.layout} ({images.length} fotos)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((img: string, idx: number) => (
                            <img key={idx} src={img} alt="preview" className="rounded-xl object-cover w-full aspect-video border" />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (block.type === "video") {
                    const { videoType, youtubeUrl, videoUrl } = block.data;
                    if (videoType === "youtube") {
                      if (!youtubeUrl) {
                        return (
                          <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray gap-2">
                            <VideoIcon className="w-6 h-6 text-brand-gray/60" />
                            <span>YouTube (falta ingresar dirección)</span>
                          </div>
                        );
                      }
                      return (
                        <div key={block.id} className="aspect-video w-full rounded-2xl overflow-hidden bg-black text-white flex flex-col items-center justify-center text-xs p-4 text-center gap-2">
                          <VideoIcon className="w-6 h-6 text-brand-yellow" />
                          <span className="font-bold">Video de YouTube Incrustado:</span>
                          <span className="text-[10px] text-white/60 truncate w-full">{youtubeUrl}</span>
                        </div>
                      );
                    } else {
                      if (!videoUrl) {
                        return (
                          <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray gap-2">
                            <VideoIcon className="w-6 h-6 text-brand-gray/60" />
                            <span>Video Local (falta subir archivo)</span>
                          </div>
                        );
                      }
                      return (
                        <video key={block.id} src={videoUrl} controls className="w-full rounded-2xl aspect-video bg-black" />
                      );
                    }
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AVAILABLE_PHOTOS = [
  { url: "/photos/fee_photo_01.jpg", label: "01. Inicial: Ronda de pintura y arte" },
  { url: "/photos/fee_photo_02.jpg", label: "02. Secundaria: Clase en aula audiovisual" },
  { url: "/photos/fee_photo_03.jpg", label: "03. Secundaria: Encuentro institucional" },
  { url: "/photos/fee_photo_04.jpg", label: "04. Primaria: Biblioteca y lectura" },
  { url: "/photos/fee_photo_05.jpg", label: "05. Primaria: Taller de expresión" },
  { url: "/photos/fee_photo_06.jpg", label: "06. Ciencias: Instituto Balseiro RA-6" },
  { url: "/photos/fee_photo_07.jpg", label: "07. Institucional: Abanderados patrios" },
  { url: "/photos/fee_photo_08.jpg", label: "08. Secundaria: Egresados y fiesta" },
  { url: "/photos/fee_photo_09.jpg", label: "09. Tecnología: Taller de programación" },
  { url: "/photos/fee_photo_10.jpg", label: "10. Inglés: Feria del libro en inglés" },
  { url: "/photos/fee_photo_11.jpg", label: "11. Hero: Panorámica cordillera Esquel" },
  { url: "/photos/fee_photo_12.jpg", label: "12. Inglés: Concert & Drama en escenario" },
  { url: "/photos/fee_photo_13.jpg", label: "13. Arte: Celebraciones y disfraces" },
  { url: "/photos/fee_photo_14.jpg", label: "14. Comunidad: Gran Kermesse en SUM" },
  { url: "/photos/fee_photo_15.jpg", label: "15. Inicial: Patio soleado y juegos" },
  { url: "/photos/fee_photo_16.jpg", label: "16. Primaria: Actividades grupales" },
  { url: "/photos/fee_photo_17.jpg", label: "17. Salidas: Península Valdés dunas" },
  { url: "/photos/fee_photo_18.jpg", label: "18. Inglés: Teatro y canciones" },
  { url: "/photos/fee_photo_19.jpg", label: "19. Campamento: Fogón nocturno" },
  { url: "/photos/fee_photo_20.jpg", label: "20. Naturaleza: Navegación en el lago" },
  { url: "/photos/fee_photo_21.jpg", label: "21. Salidas: Trekking Los Alerces" },
  { url: "/photos/fee_photo_22.jpg", label: "22. Inglés: Diplomas Cambridge" },
  { url: "/photos/fee_photo_23.jpg", label: "23. Naturaleza: Avistaje de ballenas" },
  { url: "/photos/fee_photo_24.jpg", label: "24. Campamento: Picnic en el lago" },
  { url: "/photos/fee_photo_25.jpg", label: "25. Recreación: Deportes y juegos" },
  { url: "/photos/fee_photo_26.jpg", label: "26. Campamento: Juegos al aire libre" }
];

function GalleryEditorModal({ 
  item, 
  onClose, 
  onSave 
}: { 
  item: any | null; 
  onClose: () => void; 
  onSave: (savedList: any[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(item?.image || "/photos/fee_photo_21.jpg");
  const [category, setCategory] = useState(item?.category || "Salidas Educativas");
  const [title, setTitle] = useState(item?.title || "");
  const [desc, setDesc] = useState(item?.desc || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadMediaAction(fd);
      if (res.success && res.url) {
        setImage(res.url);
      } else {
        alert(res.error || "Error al subir la imagen");
      }
    } catch (err: any) {
      alert("Error al conectar con el servidor para la subida");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !title) {
      alert("Por favor completá la imagen y el título");
      return;
    }
    setLoading(true);
    try {
      const res = await saveGalleryItemAction({
        id: item?.id,
        image,
        category,
        title,
        desc
      });
      if (res.success && res.gallery) {
        onSave(res.gallery);
        onClose();
      } else {
        alert(res.error || "Error al guardar");
      }
    } catch (err: any) {
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-brand-blue hover:bg-brand-gray/10 rounded-full transition-colors z-50 bg-white shadow-sm border"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <h3 className="text-2xl font-extrabold text-brand-blue mb-2">
            {item ? "Editar Foto de la Galería" : "Agregar Foto a la Galería"}
          </h3>
          <p className="text-xs text-brand-foreground/70 mb-6 font-medium">
            Esta tarjeta se mostrará en el carrusel &quot;La Vida Escolar en Imágenes&quot; de la página principal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Preview & Selector */}
            <div>
              <label className="block text-xs font-bold text-brand-blue mb-2">Foto Seleccionada</label>
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-brand-gray/10 border mb-3">
                <img src={image} alt="Vista previa" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/95 text-brand-blue text-xs font-bold px-3 py-1 rounded-full shadow">
                  {category}
                </div>
              </div>

              {/* Botón para subir archivo desde la PC */}
              <div className="mb-4 bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="block text-xs font-bold text-brand-blue">Subir foto desde tu dispositivo</span>
                  <span className="text-[11px] text-brand-foreground/70">JPG, PNG o WebP desde tu computadora o celular.</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-blue text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-brand-green transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Elegir Archivo
                    </>
                  )}
                </button>
              </div>

              <label className="block text-xs font-bold text-brand-foreground/75 mb-1.5">
                O elegí una foto del archivo escolar (26 disponibles):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-2 bg-brand-gray/5 rounded-xl border">
                {AVAILABLE_PHOTOS.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => setImage(p.url)}
                    className={cn(
                      "relative rounded-lg overflow-hidden aspect-square border-2 transition-all group cursor-pointer",
                      image === p.url ? "border-brand-green ring-2 ring-brand-green/30 scale-95" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    title={p.label}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    {image === p.url && (
                      <div className="absolute inset-0 bg-brand-green/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <label className="block text-[11px] font-semibold text-brand-foreground/60 mb-1">O pegá la ruta / URL directa de la imagen:</label>
                <input 
                  type="text" 
                  value={image} 
                  onChange={(e) => setImage(e.target.value)} 
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white font-medium"
                  placeholder="/photos/fee_photo_01.jpg"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-brand-blue mb-1">Categoría / Etiqueta</label>
              <input 
                type="text" 
                required 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl bg-brand-gray/5 text-sm font-semibold"
                placeholder="Ej: Salidas Educativas, Inglés & Teatro, Campamentos, Robótica"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Salidas Educativas", "Inglés & Teatro", "Campamentos & Convivencia", "Identidad & Valores", "Comunidad de Familias", "Tecnología & Innovación", "Nivel Inicial", "Ciencias Naturales", "Certificaciones"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-brand-gray/10 hover:bg-brand-yellow/30 text-brand-blue rounded-full transition-colors cursor-pointer"
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-brand-blue mb-1">Título de la Tarjeta</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl bg-brand-gray/5 text-sm font-bold text-brand-blue"
                placeholder="Ej: Exploración en los Bosques Andinos"
              />
            </div>

            {/* Desc */}
            <div>
              <label className="block text-xs font-bold text-brand-blue mb-1">Descripción / Subtítulo</label>
              <textarea 
                rows={3} 
                required 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl bg-brand-gray/5 text-sm font-medium"
                placeholder="Breve reseña sobre la actividad, vivencia o proyecto..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 rounded-full text-xs font-bold text-brand-gray hover:bg-brand-gray/10 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading || uploading}
                className="px-8 py-2.5 rounded-full text-xs font-bold bg-brand-green text-white hover:bg-brand-blue transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                {loading ? "Guardando..." : "Guardar en Galería"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EnrollmentAnalyticsModal({
  enrollments,
  onClose
}: {
  enrollments: Enrollment[];
  onClose: () => void;
}) {
  const total = enrollments.length;
  const inicialList = enrollments.filter(e => (e.studentLevel || "").toLowerCase().includes("inicial"));
  const primarioList = enrollments.filter(e => (e.studentLevel || "").toLowerCase().includes("primario"));
  const secundarioList = enrollments.filter(e => (e.studentLevel || "").toLowerCase().includes("secundario"));

  const inicialCount = inicialList.length;
  const primarioCount = primarioList.length;
  const secundarioCount = secundarioList.length;

  const inicialPct = total > 0 ? Math.round((inicialCount / total) * 100) : 0;
  const primarioPct = total > 0 ? Math.round((primarioCount / total) * 100) : 0;
  const secundarioPct = total > 0 ? Math.max(0, 100 - inicialPct - primarioPct) : 0;

  // Donut SVG segments calculation (R = 54, Circ = 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const inicialStroke = (inicialCount / (total || 1)) * circumference;
  const primarioStroke = (primarioCount / (total || 1)) * circumference;
  const secundarioStroke = (secundarioCount / (total || 1)) * circumference;

  const inicialOffset = 0;
  const primarioOffset = -inicialStroke;
  const secundarioOffset = -(inicialStroke + primarioStroke);

  // Group by grade/sala
  const gradeCounts: { [key: string]: number } = {};
  enrollments.forEach(e => {
    const g = (e.studentGrade || "Sin especificar").trim();
    gradeCounts[g] = (gradeCounts[g] || 0) + 1;
  });
  const sortedGrades = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Monthly breakdown
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthlyStats = monthNames.map((name, idx) => {
    const count = enrollments.filter(e => {
      const d = new Date(e.createdAt);
      return d.getMonth() === idx;
    }).length;
    return { name, count };
  });
  const maxMonthCount = Math.max(...monthlyStats.map(m => m.count), 1);

  // Data completeness
  const withComments = enrollments.filter(e => e.comments && e.comments.trim().length > 0).length;
  const withPhone = enrollments.filter(e => e.tutorPhone && e.tutorPhone.trim().length > 0).length;
  const withEmail = enrollments.filter(e => e.tutorEmail && e.tutorEmail.trim().length > 0).length;

  return (
    <div className="fixed inset-0 bg-brand-blue/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative my-auto border border-brand-gray/10 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b bg-gradient-to-r from-brand-blue/5 via-brand-green/5 to-brand-yellow/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-md shadow-brand-green/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-brand-blue">
                Dashboard Analítico de Inscripciones
              </h3>
              <p className="text-xs text-brand-foreground/70 font-medium">
                Métricas consolidadas, distribución por niveles y tendencias temporales de solicitudes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2.5 text-brand-blue hover:bg-white rounded-full transition-colors border shadow-sm flex items-center gap-1.5 text-xs font-bold bg-white/80 cursor-pointer"
              title="Imprimir / Exportar reporte"
            >
              <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2.5 text-brand-blue hover:bg-brand-gray/10 rounded-full transition-colors bg-white shadow-sm border cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-brand-blue/5 border border-brand-blue/15 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-brand-blue uppercase tracking-wider">Total Recibidas</span>
                <Users className="w-4 h-4 text-brand-blue/60" />
              </div>
              <span className="text-3xl sm:text-4xl font-black text-brand-blue">{total}</span>
              <span className="text-[10px] text-brand-foreground/60 mt-1 font-semibold">100% de la demanda</span>
            </div>

            <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-brand-yellow-dark uppercase tracking-wider">Nivel Inicial</span>
                <span className="text-xs font-extrabold bg-brand-yellow/40 text-brand-yellow-dark px-2 py-0.5 rounded-full">{inicialPct}%</span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-brand-yellow-dark">{inicialCount}</span>
              <div className="w-full bg-brand-yellow/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-yellow-dark h-full rounded-full" style={{ width: `${inicialPct}%` }}></div>
              </div>
            </div>

            <div className="bg-brand-green/5 border border-brand-green/20 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">Nivel Primario</span>
                <span className="text-xs font-extrabold bg-brand-green/20 text-brand-green px-2 py-0.5 rounded-full">{primarioPct}%</span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-brand-green">{primarioCount}</span>
              <div className="w-full bg-brand-green/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-green h-full rounded-full" style={{ width: `${primarioPct}%` }}></div>
              </div>
            </div>

            <div className="bg-brand-lightblue/5 border border-brand-lightblue/20 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-brand-lightblue uppercase tracking-wider">Nivel Secundario</span>
                <span className="text-xs font-extrabold bg-brand-lightblue/20 text-brand-lightblue px-2 py-0.5 rounded-full">{secundarioPct}%</span>
              </div>
              <span className="text-3xl sm:text-4xl font-black text-brand-lightblue">{secundarioCount}</span>
              <div className="w-full bg-brand-lightblue/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-lightblue h-full rounded-full" style={{ width: `${secundarioPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Chart 1: Donut Chart Distribución por Nivel */}
            <div className="md:col-span-5 bg-white border border-brand-gray/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-brand-blue" />
                  <h4 className="font-bold text-brand-blue text-sm">Distribución por Nivel</h4>
                </div>
                <span className="text-[10px] font-bold text-brand-foreground/50 uppercase">Proporción</span>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <svg width="170" height="170" viewBox="0 0 140 140" className="transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="18"
                  />
                  {total > 0 && (
                    <>
                      {/* Inicial Segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="#F9A825"
                        strokeWidth="18"
                        strokeDasharray={`${inicialStroke} ${circumference}`}
                        strokeDashoffset={inicialOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Primario Segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="#2E7D32"
                        strokeWidth="18"
                        strokeDasharray={`${primarioStroke} ${circumference}`}
                        strokeDashoffset={primarioOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      {/* Secundario Segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="#172A45"
                        strokeWidth="18"
                        strokeDasharray={`${secundarioStroke} ${circumference}`}
                        strokeDashoffset={secundarioOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-brand-blue">{total}</span>
                  <span className="text-[10px] font-bold text-brand-foreground/60 uppercase tracking-wider">Aspirantes</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-brand-yellow-dark"></span>
                    <span className="font-semibold text-brand-foreground/80">Inicial</span>
                  </div>
                  <span className="font-bold text-brand-blue">{inicialCount} ({inicialPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-brand-green"></span>
                    <span className="font-semibold text-brand-foreground/80">Primario</span>
                  </div>
                  <span className="font-bold text-brand-blue">{primarioCount} ({primarioPct}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
                    <span className="font-semibold text-brand-foreground/80">Secundario</span>
                  </div>
                  <span className="font-bold text-brand-blue">{secundarioCount} ({secundarioPct}%)</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Evolución Mensual */}
            <div className="md:col-span-7 bg-white border border-brand-gray/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-green" />
                  <h4 className="font-bold text-brand-blue text-sm">Evolución de Solicitudes por Mes</h4>
                </div>
                <span className="text-[10px] font-bold text-brand-foreground/50 uppercase">Año en Curso</span>
              </div>

              {/* Bar Chart */}
              <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 pt-6 pb-2 border-b border-brand-gray/10">
                {monthlyStats.map((m, idx) => {
                  const barHeight = m.count > 0 ? Math.max(12, Math.round((m.count / maxMonthCount) * 100)) : 4;
                  const isCurrentMonth = new Date().getMonth() === idx;
                  return (
                    <div key={m.name} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="text-[10px] font-bold text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-brand-blue/10 px-1.5 py-0.5 rounded">
                        {m.count}
                      </div>
                      <div 
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110",
                          m.count > 0 ? (isCurrentMonth ? "bg-brand-green shadow-sm shadow-brand-green/30" : "bg-brand-blue/70") : "bg-brand-gray/20"
                        )}
                        style={{ height: `${barHeight}%` }}
                      ></div>
                      <span className={cn("text-[10px] font-bold", isCurrentMonth ? "text-brand-green" : "text-brand-foreground/60")}>
                        {m.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 text-[11px] text-brand-foreground/70">
                <span>Mes con mayor demanda: <strong className="text-brand-blue">{monthlyStats.reduce((max, m) => m.count > max.count ? m : max, monthlyStats[0]).name}</strong></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-green"></span> Mes Actual</span>
              </div>
            </div>
          </div>

          {/* Secondary Details: Top Grados & Calidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Grados / Salas */}
            <div className="bg-brand-gray/5 border border-brand-gray/10 rounded-3xl p-6">
              <h4 className="font-bold text-brand-blue text-sm mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-yellow-dark" />
                Grados y Salas más Solicitados
              </h4>
              <div className="space-y-3">
                {sortedGrades.map(([grade, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={grade} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-brand-blue">{grade}</span>
                        <span className="font-semibold text-brand-foreground/70">{count} aspirantes ({pct}%)</span>
                      </div>
                      <div className="w-full bg-brand-gray/15 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-blue h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {sortedGrades.length === 0 && <p className="text-xs text-brand-gray italic">Sin datos de grados.</p>}
              </div>
            </div>

            {/* Eficiencia y Calidad de Contacto */}
            <div className="bg-brand-gray/5 border border-brand-gray/10 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-brand-blue text-sm mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-green" />
                  Calidad de Información de Contacto
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-white p-3 rounded-2xl border">
                    <span className="text-lg font-bold text-brand-blue">{withEmail}</span>
                    <span className="block text-[10px] font-semibold text-brand-foreground/60 uppercase">Emails Válidos</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border">
                    <span className="text-lg font-bold text-brand-green">{withPhone}</span>
                    <span className="block text-[10px] font-semibold text-brand-foreground/60 uppercase">Teléfonos</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border">
                    <span className="text-lg font-bold text-brand-yellow-dark">{withComments}</span>
                    <span className="block text-[10px] font-semibold text-brand-foreground/60 uppercase">Comentarios</span>
                  </div>
                </div>
                <p className="text-xs text-brand-foreground/70 leading-relaxed">
                  Todas las solicitudes cuentan con datos completos de contacto para seguimiento telefónico o invitación a entrevistas de admisión.
                </p>
              </div>
              <div className="pt-4 border-t border-brand-gray/10 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-brand-blue text-white hover:bg-brand-green transition-colors cursor-pointer"
                >
                  Cerrar Dashboard
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function FirstLoginPasswordChangeModal({ session, onSuccess }: { session: any; onSuccess: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verificalas.");
      return;
    }

    setLoading(true);
    try {
      const res = await changePasswordAction(newPassword);
      if (res.success) {
        setSuccess("¡Contraseña actualizada con éxito! Redirigiendo al panel...");
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setError(res.error || "No se pudo actualizar la contraseña.");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-blue/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-gray/20 relative animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <KeyRound className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-2 border border-amber-200">
            Primer Ingreso Requerido
          </span>
          <h2 className="text-xl font-bold text-brand-blue">
            Creá tu Contraseña Personal
          </h2>
          <p className="text-xs text-brand-foreground/70 mt-1.5 leading-relaxed">
            Hola <strong className="text-brand-blue">{session.name || session.username || "Usuario"}</strong>, por políticas de seguridad institucional debés reemplazar la clave provisoria por una clave personal antes de acceder al panel.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-700 text-xs font-semibold bg-green-50 p-3 rounded-xl mb-4 border border-green-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-blue mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm font-medium pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-brand-foreground/40 hover:text-brand-blue cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-blue mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input 
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Reingresá tu nueva clave"
              className="w-full px-4 py-3 rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm font-medium"
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-brand-blue text-white py-3.5 rounded-full font-bold shadow-lg hover:bg-brand-green transition-all mt-4 flex justify-center items-center gap-2 cursor-pointer text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Guardar y Acceder al Panel
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetUserPasswordModal({ 
  user, 
  onClose, 
  onSuccess 
}: { 
  user: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [password, setPassword] = useState(() => generateSuggestedPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setPassword(generateSuggestedPassword());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await resetUserPasswordAction(user.id, password.trim());
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || "Error al restablecer contraseña.");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-blue/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-gray/20 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-foreground/40 hover:text-brand-blue p-2 rounded-full hover:bg-brand-gray/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-1.5 border border-amber-200">
            Administración de Seguridad
          </span>
          <h2 className="text-xl font-bold text-brand-blue">
            Resetear Clave de @{user.username || user.name}
          </h2>
          <p className="text-xs text-brand-foreground/70 mt-1">
            Asigná una nueva contraseña provisoria. El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-brand-blue">
                Nueva Contraseña Provisoria
              </label>
              <button
                type="button"
                onClick={handleRegenerate}
                className="text-[11px] font-bold text-brand-blue hover:text-brand-green flex items-center gap-1 cursor-pointer transition-colors"
                title="Generar otra clave sugerida"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Regenerar
              </button>
            </div>

            <div className="relative flex items-center">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none transition-all text-sm font-mono font-bold text-brand-blue pr-20"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-brand-foreground/50 hover:text-brand-blue hover:bg-brand-gray/10 rounded-lg transition-colors cursor-pointer"
                  title="Copiar contraseña"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-brand-foreground/50 hover:text-brand-blue hover:bg-brand-gray/10 rounded-lg transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {copied && <span className="text-[10px] text-green-600 font-bold block mt-1">¡Copiada al portapapeles!</span>}
          </div>

          <div className="pt-2 flex gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-full font-bold text-xs border border-brand-gray/20 text-brand-foreground/70 hover:bg-brand-gray/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="w-2/3 bg-brand-blue text-white py-3 rounded-full font-bold shadow-md hover:bg-brand-green transition-all flex justify-center items-center gap-2 cursor-pointer text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar y Notificar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InspectEnrollmentModal({
  enrollment,
  onClose,
  onDownloadPdf
}: {
  enrollment: any;
  onClose: () => void;
  onDownloadPdf: (enrollment: any) => void;
}) {
  if (!enrollment) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 relative my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {enrollment.school || "Escuela N.º 1030"}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              Trámite: {enrollment.trackingNumber || `FEE-2027-${enrollment.id.substring(0, 5)}`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {enrollment.studentName}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            DNI {enrollment.studentDni || "---"} • {enrollment.studentGrade} • Recibido el {new Date(enrollment.createdAt).toLocaleDateString()} a las {new Date(enrollment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Sibling info */}
          {enrollment.hasSiblings && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <span className="font-extrabold text-amber-900 block mb-1">Hermanos/as en la institución:</span>
              <p className="text-amber-800 font-medium">{enrollment.siblingDetails || "Registrado en el formulario"}</p>
            </div>
          )}

          {/* Responsable 1 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Responsable 1 ({enrollment.parent1Relationship || "Madre/Padre/Tutor"})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div><span className="font-semibold text-slate-500">Nombre Completo:</span> <span className="font-bold text-slate-900">{enrollment.parent1Name || enrollment.tutorName}</span></div>
              <div><span className="font-semibold text-slate-500">DNI:</span> <span className="font-bold text-slate-900">{enrollment.parent1Dni || "---"}</span></div>
              <div><span className="font-semibold text-slate-500">Teléfono:</span> <span className="font-bold text-slate-900">{enrollment.parent1Phone || enrollment.tutorPhone}</span></div>
              <div><span className="font-semibold text-slate-500">Email:</span> <span className="font-bold text-slate-900">{enrollment.parent1Email || enrollment.tutorEmail}</span></div>
              <div className="sm:col-span-2"><span className="font-semibold text-slate-500">Domicilio:</span> <span className="font-bold text-slate-900">{enrollment.parent1Address || "---"} ({enrollment.parent1City || "Esquel"}, CP {enrollment.parent1PostalCode || "9200"})</span></div>
            </div>
          </div>

          {/* Responsable 2 */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-2">
              <Users className="w-4 h-4 text-blue-600" />
              Responsable 2 {enrollment.isSingleParent ? "(Declaración de Único Responsable)" : `(${enrollment.parent2Relationship || "Madre/Padre/Tutor"})`}
            </h4>
            {enrollment.isSingleParent ? (
              <p className="text-slate-600 italic">
                El declarante consignó bajo declaración jurada ser el/la único/a responsable parental habilitado/a para formalizar la reinscripción.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div><span className="font-semibold text-slate-500">Nombre Completo:</span> <span className="font-bold text-slate-900">{enrollment.parent2Name || "---"}</span></div>
                <div><span className="font-semibold text-slate-500">DNI:</span> <span className="font-bold text-slate-900">{enrollment.parent2Dni || "---"}</span></div>
                <div><span className="font-semibold text-slate-500">Teléfono:</span> <span className="font-bold text-slate-900">{enrollment.parent2Phone || "---"}</span></div>
                <div><span className="font-semibold text-slate-500">Email:</span> <span className="font-bold text-slate-900">{enrollment.parent2Email || "---"}</span></div>
                <div className="sm:col-span-2"><span className="font-semibold text-slate-500">Domicilio:</span> <span className="font-bold text-slate-900">{enrollment.parent2Address || "---"}</span></div>
              </div>
            )}
          </div>

          {/* Facturación */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Datos de Facturación
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div><span className="font-semibold text-slate-500">Titular:</span> <span className="font-bold text-slate-900">{enrollment.billingName || enrollment.parent1Name || enrollment.tutorName}</span></div>
              <div><span className="font-semibold text-slate-500">CUIT / CUIL / DNI:</span> <span className="font-bold text-slate-900">{enrollment.billingCuit || enrollment.parent1Dni}</span></div>
              <div><span className="font-semibold text-slate-500">Condición Fiscal:</span> <span className="font-bold text-slate-900">{enrollment.billingTaxCondition || "Consumidor Final"}</span></div>
              <div><span className="font-semibold text-slate-500">Email Factura:</span> <span className="font-bold text-slate-900">{enrollment.billingEmail || enrollment.parent1Email || enrollment.tutorEmail}</span></div>
              <div className="sm:col-span-2"><span className="font-semibold text-slate-500">Domicilio Fiscal:</span> <span className="font-bold text-slate-900">{enrollment.billingAddress || enrollment.parent1Address || "---"}</span></div>
            </div>
          </div>

          {/* Firmas Digitales Holográficas */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Firmas Digitales Estampadas en el Contrato
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border rounded-xl p-3 bg-slate-50 text-center">
                <span className="text-[10px] font-bold text-slate-500 block mb-2">
                  Firma Responsable 1 ({enrollment.parent1Name || enrollment.tutorName})
                </span>
                {enrollment.signature1Data ? (
                  <div className="bg-white border rounded-lg p-2 h-24 flex items-center justify-center">
                    <img src={enrollment.signature1Data} alt="Firma 1" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-slate-400 italic">
                    Sin registro visual
                  </div>
                )}
                <span className="text-[9px] text-slate-400 block mt-1">DNI: {enrollment.parent1Dni || "---"}</span>
              </div>

              <div className="border rounded-xl p-3 bg-slate-50 text-center">
                <span className="text-[10px] font-bold text-slate-500 block mb-2">
                  Firma Responsable 2 {enrollment.isSingleParent ? "(No aplica)" : `(${enrollment.parent2Name || "Resp. 2"})`}
                </span>
                {enrollment.isSingleParent ? (
                  <div className="bg-white border rounded-lg p-2 h-24 flex items-center justify-center text-slate-400 italic text-[11px]">
                    Declaración de Responsable Único
                  </div>
                ) : enrollment.signature2Data ? (
                  <div className="bg-white border rounded-lg p-2 h-24 flex items-center justify-center">
                    <img src={enrollment.signature2Data} alt="Firma 2" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-slate-400 italic">
                    Sin registro visual
                  </div>
                )}
                <span className="text-[9px] text-slate-400 block mt-1">DNI: {enrollment.parent2Dni || "---"}</span>
              </div>
            </div>
          </div>

          {/* Comments if any */}
          {enrollment.comments && (
            <div className="bg-slate-100 rounded-2xl p-4">
              <span className="font-bold text-slate-700 block mb-1">Observaciones / Comentarios:</span>
              <p className="text-slate-600 whitespace-pre-line">{enrollment.comments}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>

          <button
            type="button"
            onClick={() => onDownloadPdf(enrollment)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Descargar Contrato Oficial (8 Páginas PDF)
          </button>
        </div>
      </div>
    </div>
  );
}



