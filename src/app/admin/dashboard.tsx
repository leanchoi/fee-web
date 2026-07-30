"use client";

import { useEffect, useState } from "react";
import { 
  logoutAdmin, 
  createPost, 
  updatePost, 
  deletePost, 
  togglePostPublish, 
  createUserAction, 
  deleteUser, 
  uploadMediaAction,
  deleteContactMessage,
  updateEnrollmentStatus
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
  UserCheck,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { Post, Enrollment, User, ContactMessage } from "@prisma/client";
import {
  resolveBlockAlign,
  resolveBlockColor,
  resolveBlockFont,
  resolveBlockTag,
} from "@/lib/sanitize";
import type { SessionPayload } from "@/lib/auth";

/**
 * Campos que puede llevar un bloque. Todos son opcionales porque cada tipo usa
 * un subconjunto distinto.
 */
interface BlockData {
  text?: string;
  tag?: string;
  color?: string;
  fontFamily?: string;
  align?: string;
  layout?: string;
  images?: string[];
  autoplay?: boolean;
  videoType?: string;
  youtubeUrl?: string;
  videoUrl?: string;
}

interface Block {
  id: string;
  type: "text" | "image" | "video";
  /**
   * Forma libre según el tipo de bloque (texto, imagen o video). El
   * renderizador público valida cada campo contra listas de permitidos antes
   * de usarlo, así que acá alcanza con un mapa de valores desconocidos.
   */
  data: BlockData;
}

export function AdminDashboard({ 
  posts, 
  enrollments, 
  contactMessages = [],
  users, 
  session 
}: { 
  posts: Post[], 
  enrollments: Enrollment[], 
  contactMessages: ContactMessage[],
  users: User[],
  session: SessionPayload
}) {
  const router = useRouter();
  
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const userPerms = session.permissions?.split(",") || [];
  const hasBlogPerm = isSuperAdmin || userPerms.includes("blog");
  const hasEnrollmentsPerm = isSuperAdmin || userPerms.includes("enrollments");
  const hasContactsPerm = isSuperAdmin || userPerms.includes("contacts");

  const [activeTab, setActiveTab] = useState<"posts" | "enrollments" | "contacts" | "users">(() => {
    if (isSuperAdmin || userPerms.includes("blog")) return "posts";
    if (userPerms.includes("enrollments")) return "enrollments";
    if (userPerms.includes("contacts")) return "contacts";
    return "posts";
  });
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // User Management State
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await logoutAdmin();
    router.refresh();
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("¿Eliminar este post definitivamente?")) return;
    await deletePost(id);
    router.refresh();
  };

  const handleToggleState = async (id: string, current: boolean) => {
    await togglePostPublish(id, current);
    router.refresh();
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");

    // React deja `currentTarget` en null cuando el handler cede el control en
    // un `await`. Antes se llamaba `e.currentTarget.reset()` después de esperar
    // la acción, así que al crear un usuario correctamente saltaba un
    // TypeError y el formulario nunca se limpiaba.
    const form = e.currentTarget;
    const fd = new FormData(form);

    setCreatingUser(true);
    try {
      const res = await createUserAction(fd);
      if (res.success) {
        setUserSuccess("Usuario creado correctamente.");
        form.reset();
        router.refresh();
      } else {
        setUserError(res.error || "No pudimos crear el usuario.");
      }
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setCreatingUser(false);
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocurrió un error.");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const res = await updateEnrollmentStatus(id, status);
      if (!res.success) {
        alert(res.error || "No pudimos actualizar el estado.");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al actualizar el estado.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteContactMessage = async (id: string) => {
    if (!confirm("¿Eliminar esta consulta de contacto definitivamente?")) return;
    try {
      const res = await deleteContactMessage(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Error al eliminar");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ocurrió un error.");
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
                      <td className="p-4 text-foreground/70">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md font-semibold text-xs ${p.published ? 'bg-green-100 text-green-700' : 'bg-brand-gray/20 text-brand-gray-dark'}`}>
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
                  {posts.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-brand-gray-dark">No hay novedades cargadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hasEnrollmentsPerm && activeTab === "enrollments" && (
          <div>
            <h2 className="text-2xl font-bold text-brand-green mb-6">Inscripciones Recibidas</h2>

            {/* Metrics cards */}
            {(() => {
              const total = enrollments.length;
              const inicial = enrollments.filter(e => e.studentLevel.toLowerCase().includes("inicial")).length;
              const primario = enrollments.filter(e => e.studentLevel.toLowerCase().includes("primario")).length;
              const secundario = enrollments.filter(e => e.studentLevel.toLowerCase().includes("secundario")).length;

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-brand-blue/5 border border-brand-blue/10 p-5 rounded-2xl">
                      <span className="text-xs text-brand-blue font-bold uppercase tracking-wider block mb-1">Total Solicitudes</span>
                      <span className="text-3xl font-extrabold text-brand-blue">{total}</span>
                    </div>
                    <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-5 rounded-2xl">
                      <span className="text-xs text-brand-yellow-dark font-bold uppercase tracking-wider block mb-1">Nivel Inicial</span>
                      <span className="text-3xl font-extrabold text-brand-yellow-dark">{inicial}</span>
                    </div>
                    <div className="bg-brand-green/5 border border-brand-green/10 p-5 rounded-2xl">
                      <span className="text-xs text-brand-green font-bold uppercase tracking-wider block mb-1">Nivel Primario</span>
                      <span className="text-3xl font-extrabold text-brand-green">{primario}</span>
                    </div>
                    <div className="bg-brand-lightblue/5 border border-brand-lightblue/10 p-5 rounded-2xl">
                      <span className="text-xs text-brand-lightblue font-bold uppercase tracking-wider block mb-1">Nivel Secundario</span>
                      <span className="text-3xl font-extrabold text-brand-lightblue">{secundario}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-brand-blue mb-4">Vista en Fichas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {enrollments.map(e => {
                      const initial = e.studentName ? e.studentName.charAt(0).toUpperCase() : "A";
                      let levelColor = "bg-brand-yellow/10 text-brand-yellow-dark border-brand-yellow/20";
                      if (e.studentLevel.toLowerCase().includes("primario")) {
                        levelColor = "bg-brand-green/10 text-brand-green border-brand-green/20";
                      } else if (e.studentLevel.toLowerCase().includes("secundario")) {
                        levelColor = "bg-brand-blue/10 text-brand-blue border-brand-blue/20";
                      }
                      return (
                        <div key={e.id} className="bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div className="w-10 h-10 rounded-full bg-brand-gray/10 flex items-center justify-center font-extrabold text-brand-blue shrink-0">
                                {initial}
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-foreground/70 font-medium block">
                                  {new Date(e.createdAt).toLocaleDateString()}
                                </span>
                                <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1", levelColor)}>
                                  {e.studentLevel}
                                </span>
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-brand-blue text-base mb-1">{e.studentName}</h4>
                            <p className="text-xs text-foreground/70 mb-4 font-semibold">Grado/Año: {e.studentGrade}</p>
                            
                            <div className="space-y-2 border-t pt-3 text-xs mb-4">
                              <p className="text-foreground/75"><span className="font-bold">Tutor:</span> {e.tutorName}</p>
                              <p className="text-foreground/75 flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-brand-blue" /> {e.tutorEmail}</p>
                              <p className="text-foreground/75 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-brand-green" /> {e.tutorPhone}</p>
                            </div>

                            {e.comments && (
                              <div className="bg-brand-gray/5 border p-2.5 rounded-xl text-[11px] text-foreground/80 leading-normal max-h-24 overflow-y-auto mb-4">
                                <span className="font-bold block mb-0.5">Comentarios:</span>
                                {e.comments}
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-3 mb-3">
                            <label
                              htmlFor={`status-${e.id}`}
                              className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 block mb-1"
                            >
                              Seguimiento
                            </label>
                            <select
                              id={`status-${e.id}`}
                              defaultValue={e.status}
                              disabled={updatingStatus === e.id}
                              onChange={(event) => handleStatusChange(e.id, event.target.value)}
                              className="w-full border rounded-lg px-2 py-1.5 text-xs font-semibold bg-white disabled:opacity-60"
                            >
                              <option value="PENDING">Pendiente</option>
                              <option value="REVIEWED">Revisada</option>
                              <option value="CONTACTED">Familia contactada</option>
                            </select>
                          </div>

                          <div className="flex gap-2 border-t pt-3">
                            <a href={`mailto:${e.tutorEmail}`} className="flex-1 text-center bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue font-bold text-xs py-2 rounded-xl transition-colors">
                              Enviar mail
                            </a>
                            <a href={`tel:${e.tutorPhone}`} className="flex-1 text-center bg-brand-green/5 hover:bg-brand-green/10 text-brand-green font-bold text-xs py-2 rounded-xl transition-colors">
                              Llamar
                            </a>
                          </div>
                        </div>
                      );
                    })}
                    {enrollments.length === 0 && <p className="text-brand-gray-dark text-sm italic col-span-full text-center py-4">No hay fichas de inscripción.</p>}
                  </div>

                  <h3 className="text-lg font-bold text-brand-blue mb-4">Lista Detallada</h3>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-gray/5 text-brand-green text-sm">
                          <th className="p-4 font-bold border-b">Recibido</th>
                          <th className="p-4 font-bold border-b">Aspirante</th>
                          <th className="p-4 font-bold border-b">Nivel / Grado</th>
                          <th className="p-4 font-bold border-b">Tutor</th>
                          <th className="p-4 font-bold border-b">Contacto</th>
                          <th className="p-4 font-bold border-b">Estado</th>
                          <th className="p-4 font-bold border-b">Comentarios</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {enrollments.map(e => (
                          <tr key={e.id} className="border-b last:border-0 hover:bg-brand-green/5 transition-colors">
                            <td className="p-4 text-foreground/70">{new Date(e.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 font-semibold text-brand-blue">{e.studentName}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-brand-green/10 text-brand-green rounded-md font-semibold text-xs">
                                {e.studentLevel} ({e.studentGrade})
                              </span>
                            </td>
                            <td className="p-4 font-medium">{e.tutorName}</td>
                            <td className="p-4 text-xs text-foreground/70">{e.tutorEmail}<br/>{e.tutorPhone}</td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-1 rounded-md font-semibold text-xs whitespace-nowrap",
                                e.status === "CONTACTED"
                                  ? "bg-green-100 text-green-800"
                                  : e.status === "REVIEWED"
                                    ? "bg-brand-lightblue/15 text-brand-lightblue-dark"
                                    : "bg-brand-yellow/20 text-brand-yellow-dark"
                              )}>
                                {e.status === "CONTACTED" ? "Contactada" : e.status === "REVIEWED" ? "Revisada" : "Pendiente"}
                              </span>
                            </td>
                            <td className="p-4 max-w-[150px] truncate text-xs" title={e.comments || ""}>{e.comments || "-"}</td>
                          </tr>
                        ))}
                        {enrollments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-brand-gray-dark">No hay solicitudes nuevas.</td></tr>}
                      </tbody>
                    </table>
                  </div>
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
                Total: {contactMessages.length} consultas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactMessages.map((msg) => {
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
                            <span className="text-[10px] text-foreground/70">
                              {new Date(msg.createdAt).toLocaleDateString()} a las {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <span className="inline-block text-[10px] font-bold px-2 py-1 bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow-dark rounded-full">
                          {msg.subject}
                        </span>
                      </div>

                      <div className="bg-white/80 backdrop-blur-[2px] p-4 rounded-xl border text-sm text-foreground/80 italic leading-relaxed mb-4 whitespace-pre-line">
                        &ldquo;{msg.message}&rdquo;
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
                <div className="col-span-full py-16 text-center text-brand-gray-dark border border-dashed rounded-3xl bg-brand-gray/5">
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
                      <label htmlFor="perm_blog" className="font-semibold text-foreground/80">Escribir Entradas de Blog</label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm_enrollments" id="perm_enrollments" />
                      <label htmlFor="perm_enrollments" className="font-semibold text-foreground/80">Ver Inscripciones</label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="perm_contacts" id="perm_contacts" />
                      <label htmlFor="perm_contacts" className="font-semibold text-foreground/80">Ver Consultas</label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full bg-brand-green text-white py-2.5 rounded-lg font-bold hover:bg-brand-blue transition-colors text-sm shadow-md disabled:opacity-60"
                  >
                    {creatingUser ? "Guardando…" : "Guardar usuario"}
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
                            <span className="text-[10px] text-foreground/70 block mt-1">
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
                    {users.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-brand-gray-dark">No hay usuarios gestores en la base de datos.</td></tr>}
                  </tbody>
                </table>
              </div>

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
    </div>
  );
}

function PostEditorModal({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // El modal ocupa toda la pantalla pero no atendía el teclado: no se cerraba
  // con Escape y el fondo seguía desplazándose detrás.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const [title, setTitle] = useState(post?.title || "");
  const [category, setCategory] = useState(post?.category || "Institucional");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (post && post.content) {
      if (post.content.trim().startsWith("[")) {
        try {
          return JSON.parse(post.content);
        } catch {
          // Contenido no serializado como bloques: se trata como texto heredado.
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "No pudimos guardar la novedad.");
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

  const updateBlockData = (id: string, newData: Record<string, unknown>) => {
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "No pudimos subir el archivo.");
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "No pudimos subir los archivos.");
    } finally {
      setUploadingBlockId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-brand-blue/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
    >
      <div className="bg-white rounded-[2.5rem] w-full h-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar el editor"
          className="absolute top-4 right-4 p-2 text-brand-blue hover:bg-brand-gray/10 rounded-full transition-colors z-50 bg-white shadow-sm border"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
          {/* Lado Izquierdo: Editor Form */}
          <div className="lg:col-span-6 flex flex-col p-6 md:p-8 overflow-y-auto h-full border-r border-brand-gray/10">
            <h3 id="editor-title" className="text-xl font-extrabold text-brand-blue mb-6">
              {post ? "Modificar novedad" : "Nueva novedad"}
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
                    <div className="text-xs text-foreground/75 truncate bg-brand-gray/5 border p-2 rounded-xl flex items-center gap-2">
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
                                  <option value="h2">Título de sección</option>
                                  <option value="h3">Subtítulo</option>
                                  <option value="h4">Subtítulo menor</option>
                                  <option value="blockquote">Cita destacada</option>
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
                                  <option value="font-sans">Montserrat (por defecto)</option>
                                  <option value="font-serif">Serif (clásica)</option>
                                  <option value="font-mono">Monoespaciada</option>
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
                                {block.data.images.map((url, imgIdx) => (
                                  <div key={imgIdx} className="relative w-16 h-16 border rounded-lg overflow-hidden group">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de un archivo recién subido, sólo visible en el panel */}
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const filtered = (block.data.images ?? []).filter(
                                          (_, idx) => idx !== imgIdx
                                        );
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
                <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-brand-gray-dark hover:text-brand-blue">Cancelar</button>
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
              <h4 className="text-sm font-medium text-brand-gray-dark">Así se verá tu novedad una vez publicada en la web pública:</h4>
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
                <div className="flex items-center gap-3 text-xs text-foreground/70 font-medium">
                  <Calendar className="w-4 h-4 text-brand-green" />
                  <span>{new Date().toLocaleDateString("es-AR", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span>• Dirección Institucional</span>
                </div>
              </div>

              {excerpt && (
                <p className="text-foreground/80 font-medium leading-relaxed italic border-l-4 border-brand-yellow pl-4 py-1 bg-brand-yellow/5 rounded-r-xl text-sm">
                  {excerpt}
                </p>
              )}

              {/* Dynamic preview block renderer */}
              <div className="space-y-6 pt-4 border-t border-brand-gray/10 flex-1">
                {blocks.map((block) => {
                  if (block.type === "text") {
                    // Las mismas funciones que usa la página pública, para que
                    // la previsualización sea fiel.
                    const Tag = resolveBlockTag(block.data.tag);
                    const colorClass = resolveBlockColor(block.data.color);
                    const alignClass = resolveBlockAlign(block.data.align);
                    const sizeClass =
                      Tag === "h2"
                        ? "text-2xl font-bold text-brand-blue mt-4"
                        : Tag === "h3"
                          ? "text-xl font-bold text-brand-blue mt-3"
                          : Tag === "h4"
                            ? "text-lg font-bold text-brand-blue mt-2"
                            : Tag === "blockquote"
                              ? "text-base italic font-semibold border-l-4 border-brand-yellow pl-4 py-2 bg-brand-yellow/5 rounded-r-xl"
                              : "text-sm md:text-base leading-relaxed";
                    // El selector guarda "font-serif" / "font-mono", no
                    // "serif" / "mono": la comparación nunca coincidía y la
                    // vista previa mostraba todo en sans, aunque la nota
                    // publicada sí cambiaba de tipografía.
                    const fontClass = resolveBlockFont(block.data.fontFamily);
                    
                    return (
                      <Tag key={block.id} className={cn(colorClass, alignClass, fontClass, sizeClass, "whitespace-pre-line")}>
                        {block.data.text || <span className="text-gray-300 italic">Bloque de texto vacío...</span>}
                      </Tag>
                    );
                  }
                  if (block.type === "image") {
                    const images = block.data.images || [];
                    if (images.length === 0) {
                      return (
                        <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray-dark gap-2">
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
                            // eslint-disable-next-line @next/next/no-img-element -- previsualización interna
                            <img key={idx} src={img} alt="" className="rounded-xl object-cover w-full aspect-video border" />
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
                          <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray-dark gap-2">
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
                          <div key={block.id} className="w-full aspect-video rounded-2xl bg-brand-gray/5 border-2 border-dashed border-brand-gray/20 flex flex-col items-center justify-center text-xs text-brand-gray-dark gap-2">
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
