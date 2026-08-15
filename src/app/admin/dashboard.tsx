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
  ChevronRight
} from "lucide-react";
import { Post, Enrollment, User, ContactMessage } from "@prisma/client";

interface Block {
  id: string;
  type: "text" | "image" | "video";
  data: any;
}

export function AdminDashboard({ 
  posts, 
  enrollments, 
  contactMessages = [],
  users, 
  gallery = [],
  session 
}: { 
  posts: Post[], 
  enrollments: Enrollment[], 
  contactMessages: ContactMessage[],
  users: User[], 
  gallery?: any[],
  session: any 
}) {
  const router = useRouter();
  
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const userPerms = session.permissions?.split(",") || [];
  const hasBlogPerm = isSuperAdmin || userPerms.includes("blog");
  const hasEnrollmentsPerm = isSuperAdmin || userPerms.includes("enrollments");
  const hasContactsPerm = isSuperAdmin || userPerms.includes("contacts");

  const [activeTab, setActiveTab] = useState<"posts" | "enrollments" | "contacts" | "users" | "gallery">(() => {
    if (isSuperAdmin || userPerms.includes("blog")) return "posts";
    if (userPerms.includes("enrollments")) return "enrollments";
    if (userPerms.includes("contacts")) return "contacts";
    return "posts";
  });
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Gallery State
  const [galleryList, setGalleryList] = useState<any[]>(gallery || []);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<any | null>(null);

  // Enrollments and Contacts State
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>(enrollments || []);
  const [contactList, setContactList] = useState<ContactMessage[]>(contactMessages || []);

  // Enrollments Filtering & Analytics State
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState("");
  const [enrollmentLevelFilter, setEnrollmentLevelFilter] = useState<"all" | "inicial" | "primario" | "secundario">("all");
  const [enrollmentDatePreset, setEnrollmentDatePreset] = useState<"all" | "7days" | "30days" | "thisYear" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [enrollmentViewMode, setEnrollmentViewMode] = useState<"cards" | "table">("cards");

  const filteredEnrollments = useMemo(() => {
    return enrollmentList.filter(e => {
      // 1. Search Query
      if (enrollmentSearchQuery.trim()) {
        const q = enrollmentSearchQuery.toLowerCase();
        const matchName = (e.studentName || "").toLowerCase().includes(q);
        const matchTutor = (e.tutorName || "").toLowerCase().includes(q);
        const matchEmail = (e.tutorEmail || "").toLowerCase().includes(q);
        const matchPhone = (e.tutorPhone || "").toLowerCase().includes(q);
        const matchGrade = (e.studentGrade || "").toLowerCase().includes(q);
        const matchComments = (e.comments || "").toLowerCase().includes(q);
        if (!matchName && !matchTutor && !matchEmail && !matchPhone && !matchGrade && !matchComments) {
          return false;
        }
      }

      // 2. Level Filter
      if (enrollmentLevelFilter !== "all") {
        const lvl = (e.studentLevel || "").toLowerCase();
        if (!lvl.includes(enrollmentLevelFilter)) return false;
      }

      // 3. Date Preset Filter
      const itemDate = new Date(e.createdAt);
      const now = new Date();
      if (enrollmentDatePreset === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (itemDate < sevenDaysAgo) return false;
      } else if (enrollmentDatePreset === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (itemDate < thirtyDaysAgo) return false;
      } else if (enrollmentDatePreset === "thisYear") {
        if (itemDate.getFullYear() !== now.getFullYear()) return false;
      } else if (enrollmentDatePreset === "custom") {
        if (customStartDate) {
          const start = new Date(customStartDate + "T00:00:00");
          if (itemDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + "T23:59:59");
          if (itemDate > end) return false;
        }
      }

      return true;
    });
  }, [enrollmentList, enrollmentSearchQuery, enrollmentLevelFilter, enrollmentDatePreset, customStartDate, customEndDate]);
  
  // User Management State
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  const handleLogout = async () => {
    await logoutAdmin();
    router.refresh();
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

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    const fd = new FormData(e.currentTarget);
    
    try {
      const res = await createUserAction(fd);
      if (res.success) {
        setUserSuccess("Usuario creado correctamente.");
        e.currentTarget.reset();
        router.refresh();
      } else {
        setUserError(res.error || "Error al crear usuario");
      }
    } catch (err: any) {
      setUserError(err.message || "Error al conectar con el servidor");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;
    try {
      const res = await deleteUser(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar");
      }
    } catch (err: any) {
      alert(err.message || "Error");
    }
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
              onClick={() => setActiveTab("enrollments")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${activeTab === "enrollments" ? "bg-brand-green text-white shadow-md" : "text-brand-green hover:bg-brand-gray/10"}`}
            >
              <Users className="w-4 h-4" /> Inscripciones
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

        {hasEnrollmentsPerm && activeTab === "enrollments" && (
          <div>
            {/* Header with Title and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-green">Inscripciones y Solicitudes</h2>
                <p className="text-xs text-brand-foreground/70 mt-1 font-medium">
                  Gestioná los aspirantes, filtrá por niveles o períodos y consultá las métricas de admisión.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowAnalyticsModal(true)}
                  className="flex items-center gap-2 bg-brand-green text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full hover:bg-brand-blue transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" /> Estadísticas & Métricas
                </button>
                <div className="bg-brand-gray/10 p-1 rounded-full flex items-center shrink-0 border">
                  <button
                    onClick={() => setEnrollmentViewMode("cards")}
                    className={cn(
                      "p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      enrollmentViewMode === "cards" ? "bg-white text-brand-blue shadow-sm" : "text-brand-foreground/60 hover:text-brand-blue"
                    )}
                    title="Vista en Fichas"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Fichas</span>
                  </button>
                  <button
                    onClick={() => setEnrollmentViewMode("table")}
                    className={cn(
                      "p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                      enrollmentViewMode === "table" ? "bg-white text-brand-blue shadow-sm" : "text-brand-foreground/60 hover:text-brand-blue"
                    )}
                    title="Vista en Tabla"
                  >
                    <List className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tabla</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Banner */}
            {(() => {
              const totalAll = enrollmentList.length;
              const inicialCount = enrollmentList.filter(e => (e.studentLevel || "").toLowerCase().includes("inicial")).length;
              const primarioCount = enrollmentList.filter(e => (e.studentLevel || "").toLowerCase().includes("primario")).length;
              const secundarioCount = enrollmentList.filter(e => (e.studentLevel || "").toLowerCase().includes("secundario")).length;

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <button
                      onClick={() => setEnrollmentLevelFilter("all")}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "all" ? "bg-brand-blue text-white shadow-md scale-[1.02] border-brand-blue" : "bg-brand-blue/5 border-brand-blue/10 hover:bg-brand-blue/10"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-1", enrollmentLevelFilter === "all" ? "text-white/80" : "text-brand-blue")}>
                        Total General
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "all" ? "text-white" : "text-brand-blue")}>
                        {totalAll}
                      </span>
                    </button>

                    <button
                      onClick={() => setEnrollmentLevelFilter("inicial")}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "inicial" ? "bg-brand-yellow-dark text-white shadow-md scale-[1.02] border-brand-yellow-dark" : "bg-brand-yellow/10 border-brand-yellow/20 hover:bg-brand-yellow/20"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-1", enrollmentLevelFilter === "inicial" ? "text-white/80" : "text-brand-yellow-dark")}>
                        Nivel Inicial
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "inicial" ? "text-white" : "text-brand-yellow-dark")}>
                        {inicialCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setEnrollmentLevelFilter("primario")}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "primario" ? "bg-brand-green text-white shadow-md scale-[1.02] border-brand-green" : "bg-brand-green/5 border-brand-green/10 hover:bg-brand-green/10"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-1", enrollmentLevelFilter === "primario" ? "text-white/80" : "text-brand-green")}>
                        Nivel Primario
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "primario" ? "text-white" : "text-brand-green")}>
                        {primarioCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setEnrollmentLevelFilter("secundario")}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer",
                        enrollmentLevelFilter === "secundario" ? "bg-brand-lightblue text-white shadow-md scale-[1.02] border-brand-lightblue" : "bg-brand-lightblue/5 border-brand-lightblue/10 hover:bg-brand-lightblue/10"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider block mb-1", enrollmentLevelFilter === "secundario" ? "text-white/80" : "text-brand-lightblue")}>
                        Nivel Secundario
                      </span>
                      <span className={cn("text-2xl sm:text-3xl font-black", enrollmentLevelFilter === "secundario" ? "text-white" : "text-brand-lightblue")}>
                        {secundarioCount}
                      </span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-brand-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={enrollmentSearchQuery}
                          onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                          placeholder="Buscar por aspirante, tutor, email, teléfono o comentarios..."
                          className="w-full pl-10 pr-9 py-2 border rounded-xl text-xs sm:text-sm font-medium bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                        />
                        {enrollmentSearchQuery && (
                          <button
                            onClick={() => setEnrollmentSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-foreground/40 hover:text-brand-blue"
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
                          { key: "7days", label: "7 Días" },
                          { key: "30days", label: "Último Mes" },
                          { key: "thisYear", label: "Este Año" },
                          { key: "custom", label: "Personalizado 📅" },
                        ].map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => setEnrollmentDatePreset(preset.key as any)}
                            className={cn(
                              "text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer",
                              enrollmentDatePreset === preset.key
                                ? "bg-brand-blue text-white shadow-sm"
                                : "bg-brand-gray/10 hover:bg-brand-gray/20 text-brand-foreground/70"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Date Range Selector (if selected) */}
                    {enrollmentDatePreset === "custom" && (
                      <div className="pt-3 border-t flex flex-wrap items-center gap-3 text-xs font-bold text-brand-blue bg-brand-blue/5 p-3 rounded-xl">
                        <span>Filtrar fechas:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-normal text-brand-foreground/70">Desde:</span>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="px-2.5 py-1 border rounded-lg bg-white text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-normal text-brand-foreground/70">Hasta:</span>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="px-2.5 py-1 border rounded-lg bg-white text-xs"
                          />
                        </div>
                        {(customStartDate || customEndDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomStartDate("");
                              setCustomEndDate("");
                            }}
                            className="text-[11px] text-red-500 hover:underline ml-auto"
                          >
                            Limpiar fechas
                          </button>
                        )}
                      </div>
                    )}

                    {/* Active Filters Summary */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                      <span className="text-brand-foreground/70 font-semibold">
                        Mostrando <strong className="text-brand-blue">{filteredEnrollments.length}</strong> de {enrollmentList.length} inscripciones
                      </span>
                      {(enrollmentSearchQuery || enrollmentLevelFilter !== "all" || enrollmentDatePreset !== "all" || customStartDate || customEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEnrollmentSearchQuery("");
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
                  {enrollmentViewMode === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {filteredEnrollments.map((e) => {
                        const initial = e.studentName ? e.studentName.charAt(0).toUpperCase() : "A";
                        let levelColor = "bg-brand-yellow/10 text-brand-yellow-dark border-brand-yellow/20";
                        if ((e.studentLevel || "").toLowerCase().includes("primario")) {
                          levelColor = "bg-brand-green/10 text-brand-green border-brand-green/20";
                        } else if ((e.studentLevel || "").toLowerCase().includes("secundario")) {
                          levelColor = "bg-brand-blue/10 text-brand-blue border-brand-blue/20";
                        }
                        return (
                          <div key={e.id} className="bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-brand-gray/10 flex items-center justify-center font-extrabold text-brand-blue shrink-0">
                                  {initial}
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-brand-foreground/50 font-medium block">
                                    {new Date(e.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1", levelColor)}>
                                    {e.studentLevel}
                                  </span>
                                </div>
                              </div>
                              
                              <h4 className="font-bold text-brand-blue text-base mb-1">{e.studentName}</h4>
                              <p className="text-xs text-brand-foreground/60 mb-4 font-semibold">Grado/Año: {e.studentGrade}</p>
                              
                              <div className="space-y-2 border-t pt-3 text-xs mb-4">
                                <p className="text-brand-foreground/75"><span className="font-bold">Tutor:</span> {e.tutorName}</p>
                                <p className="text-brand-foreground/75 flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-brand-blue" /> {e.tutorEmail}</p>
                                <p className="text-brand-foreground/75 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-brand-green" /> {e.tutorPhone}</p>
                              </div>

                              {e.comments && (
                                <div className="bg-brand-gray/5 border p-2.5 rounded-xl text-[11px] text-brand-foreground/80 leading-normal max-h-24 overflow-y-auto mb-4">
                                  <span className="font-bold block mb-0.5">Comentarios:</span>
                                  {e.comments}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 border-t pt-3">
                              <a href={`mailto:${e.tutorEmail}`} className="flex-1 text-center bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-bold text-xs py-2 rounded-xl transition-colors">
                                Enviar Mail
                              </a>
                              <a href={`tel:${e.tutorPhone}`} className="flex-1 text-center bg-brand-green/5 hover:bg-brand-green/10 text-brand-green font-bold text-xs py-2 rounded-xl transition-colors">
                                Llamar
                              </a>
                              <button 
                                onClick={() => handleDeleteEnrollment(e.id)} 
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 cursor-pointer" 
                                title="Eliminar inscripción"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {filteredEnrollments.length === 0 && (
                        <div className="col-span-full py-12 text-center text-brand-gray border border-dashed rounded-3xl">
                          No se encontraron inscripciones con los filtros seleccionados.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border mb-8">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-brand-gray/5 text-brand-green text-sm">
                            <th className="p-4 font-bold border-b">Recibido</th>
                            <th className="p-4 font-bold border-b">Aspirante</th>
                            <th className="p-4 font-bold border-b">Nivel / Grado</th>
                            <th className="p-4 font-bold border-b">Tutor</th>
                            <th className="p-4 font-bold border-b">Contacto</th>
                            <th className="p-4 font-bold border-b">Comentarios</th>
                            <th className="p-4 font-bold border-b text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {filteredEnrollments.map((e) => (
                            <tr key={e.id} className="border-b last:border-0 hover:bg-brand-green/5 transition-colors">
                              <td className="p-4 text-brand-foreground/70">{new Date(e.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 font-semibold text-brand-blue">{e.studentName}</td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-brand-green/10 text-brand-green rounded-md font-semibold text-xs">
                                  {e.studentLevel} ({e.studentGrade})
                                </span>
                              </td>
                              <td className="p-4 font-medium">{e.tutorName}</td>
                              <td className="p-4 text-xs text-brand-foreground/70">{e.tutorEmail}<br/>{e.tutorPhone}</td>
                              <td className="p-4 max-w-[150px] truncate text-xs" title={e.comments || ""}>{e.comments || "-"}</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleDeleteEnrollment(e.id)} 
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                                  title="Eliminar inscripción"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredEnrollments.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-brand-gray">
                                No se encontraron solicitudes con los filtros aplicados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
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
            <h2 className="text-2xl font-bold text-brand-blue mb-6">Gestión de Usuarios</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Form to Create User */}
              <div className="bg-brand-gray/5 p-6 rounded-2xl border border-brand-gray/10 h-max">
                <h3 className="font-bold text-brand-blue mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-green" /> Crear Usuario
                </h3>
                
                {userError && <p className="text-red-500 text-xs font-semibold bg-red-50 p-2 rounded-lg mb-4 text-center">{userError}</p>}
                {userSuccess && <p className="text-green-600 text-xs font-semibold bg-green-50 p-2 rounded-lg mb-4 text-center">{userSuccess}</p>}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Nombre</label>
                    <input name="name" required className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Email</label>
                    <input name="email" type="email" required className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="juan@fundacion.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Contraseña</label>
                    <input name="password" type="password" required className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Clave de acceso" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-blue mb-1">Rol</label>
                    <select 
                      name="role" 
                      required 
                      defaultValue="EDITOR"
                      className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                    >
                      <option value="EDITOR">Gestor Personalizado</option>
                      <option value="SUPER_ADMIN">Super Administrador (Todo)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-brand-gray/10">
                    <label className="block text-xs font-bold text-brand-blue mb-1">Permisos y Accesos (Solo para Gestores)</label>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm_blog" id="perm_blog" defaultChecked />
                      <label htmlFor="perm_blog" className="font-semibold text-brand-foreground/80">Escribir Entradas de Blog</label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm_enrollments" id="perm_enrollments" />
                      <label htmlFor="perm_enrollments" className="font-semibold text-brand-foreground/80">Ver Inscripciones</label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm_contacts" id="perm_contacts" />
                      <label htmlFor="perm_contacts" className="font-semibold text-brand-foreground/80">Ver Consultas</label>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-brand-green text-white py-2.5 rounded-lg font-bold hover:bg-brand-blue transition-colors text-sm shadow-md">
                    Guardar Usuario
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="md:col-span-2 overflow-x-auto rounded-xl border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-gray/5 text-brand-blue text-sm">
                      <th className="p-4 font-bold border-b">Nombre</th>
                      <th className="p-4 font-bold border-b">Email</th>
                      <th className="p-4 font-bold border-b">Rol</th>
                      <th className="p-4 font-bold border-b text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.map(u => (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-brand-gray/5 transition-colors">
                        <td className="p-4 font-medium">{u.name || "-"}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold block w-max ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role}
                          </span>
                          {u.role !== 'SUPER_ADMIN' && (
                            <span className="text-[10px] text-brand-foreground/60 block mt-1">
                              Permisos: {u.permissions || "ninguno"}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleDeleteUser(u.id)} 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-brand-gray">No hay usuarios gestores en la base de datos.</td></tr>}
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


