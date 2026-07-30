"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { submitContact } from "@/actions/contact";

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await submitContact({ name, email, subject, message });
      if (res.success) {
        setStatus({ type: "success", text: "¡Mensaje enviado con éxito! Nos contactaremos a la brevedad." });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus({ type: "error", text: res.error || "Ocurrió un error al enviar el mensaje." });
      }
    } catch (err: any) {
      setStatus({ type: "error", text: "Error en el servidor al enviar el mensaje." });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-background pb-24">
      <section className="pt-32 pb-20 bg-brand-lightblue text-brand-blue relative">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="font-bold uppercase tracking-widest text-sm mb-4 block">
            Estamos para ayudarte
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Canales de Contacto
          </h1>
          <p className="text-xl max-w-2xl mx-auto font-medium opacity-90">
            Nuestros canales de comunicación oficiales para consultas, trámites administrativos y secretarías directivas.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* Info Columns */}
          <div className="lg:col-span-7 flex flex-col gap-12">
            
            {/* Administración */}
            <div>
              <h2 className="text-3xl font-bold text-brand-blue mb-6 pb-2 border-b">Administración Central</h2>
              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-blue">Dirección Sede</h3>
                    <p className="text-sm text-brand-foreground/75">Chacabuco 1029, Esquel, Chubut.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-yellow/20 text-brand-yellow flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-blue">Teléfono de Contacto</h3>
                    <p className="text-sm text-brand-foreground/75">(02945) 456053</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-blue">Correo Institucional</h3>
                    <a href="mailto:escuelafeesquel@gmail.com" className="text-sm text-brand-green hover:underline">escuelafeesquel@gmail.com</a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-brand-gray/15 text-brand-gray flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-blue">Horarios de Atención</h3>
                    <p className="text-sm text-brand-foreground/75">Lunes a Jueves de 8:00 a 13:00hs y Viernes de 8:00 a 16:00hs.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Niveles Directivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Nivel Inicial / Primaria */}
              <div className="bg-brand-gray/5 p-6 rounded-2xl border">
                <h3 className="font-bold text-brand-green text-lg mb-4">Escuela N° 1030 (Inicial y Primario)</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2 items-start">
                    <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-1" />
                    <span>Chacabuco 1029, Esquel</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Mail className="w-4 h-4 text-brand-blue shrink-0" />
                    <a href="mailto:equipodirectivo1030@gmail.com" className="text-brand-green hover:underline truncate">equipodirectivo1030@gmail.com</a>
                  </li>
                </ul>
              </div>

              {/* Nivel Secundario */}
              <div className="bg-brand-gray/5 p-6 rounded-2xl border">
                <h3 className="font-bold text-brand-blue text-lg mb-4">Escuela N° 1739 (Secundario)</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2 items-start">
                    <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-1" />
                    <span>Gobernador Galina 2888, Esquel</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Phone className="w-4 h-4 text-brand-blue shrink-0" />
                    <span>2945-404000</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <Mail className="w-4 h-4 text-brand-blue shrink-0" />
                    <a href="mailto:escuela1739.fee@gmail.com" className="text-brand-green hover:underline truncate">escuela1739.fee@gmail.com</a>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-brand-gray/5 h-max">
            <h3 className="text-2xl font-bold text-brand-blue mb-6 border-b pb-4">
              Mensaje en Línea
            </h3>
            
            {status && (
              <div className={`p-4 rounded-2xl mb-6 text-sm font-semibold border ${
                status.type === "success" 
                  ? "bg-brand-green/10 border-brand-green/20 text-brand-green" 
                  : "bg-red-50 border-red-100 text-red-600"
              }`}>
                {status.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-blue mb-1">Nombre Completo</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-blue mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-blue mb-1">Asunto</label>
                  <input 
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-blue mb-1">Mensaje</label>
                  <textarea 
                    rows={4} 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-brand-gray/20 bg-brand-gray/5 focus:bg-white focus:ring-2 focus:ring-brand-yellow outline-none transition-all resize-none" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-green text-white px-6 py-4 rounded-full font-bold text-base hover:bg-brand-blue disabled:opacity-55 disabled:cursor-not-allowed transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando mensaje...
                  </>
                ) : (
                  "Enviar Mensaje"
                )}
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
