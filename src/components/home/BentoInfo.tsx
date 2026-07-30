"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users, BookOpen, School } from "lucide-react";

export function BentoInfo() {
  return (
    <section className="py-24 bg-background relative z-20 -mt-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Caja X (Sobre nosotros): Nuestras escuelas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="md:col-span-7 bg-brand-gray/5 border border-brand-gray/10 p-6 sm:p-8 md:p-10 rounded-[2rem] flex flex-col justify-between"
          >
            <div>
              <span className="text-brand-green font-bold tracking-wider text-sm uppercase mb-4 block">
                Sobre nosotros
              </span>
              <h3 className="text-2xl md:text-3xl text-brand-blue font-bold mb-4">
                Nuestras escuelas
              </h3>
              <p className="text-brand-foreground/80 text-sm md:text-base leading-relaxed">
                Desde su fundación en 2005, la Fundación Educativa Esquel (FEE) se ha consolidado como una institución comprometida con la formation integral, basada en valores, el desarrollo humano y la excelencia académica. Nuestra comunidad educativa gestiona con orgullo las Escuelas: Escuela N° 1030 (Nivel Inicial y Primario) y Escuela N° 1739 (Nivel Secundario). Llevamos adelante un proyecto pedagógico vivo, inclusivo y transformador, inspirado en el legado de la Escuela Arco Iris.
              </p>
            </div>
            <div className="flex gap-2 text-brand-green font-bold items-center mt-6 text-sm">
              <School className="w-5 h-5" /> Proyecto Pedagógico Activo
            </div>
          </motion.div>

          {/* Caja Azul (Comunidad) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-5 bg-brand-blue text-white p-6 sm:p-8 md:p-10 rounded-[2rem] shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="text-brand-yellow font-bold tracking-wider text-sm uppercase mb-4 block">
                Comunidad Real
              </span>
              <h3 className="text-2xl md:text-3xl text-white font-bold mb-4 leading-tight">
                Gestionada por familias para las familias.
              </h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                A diferencia del modelo tradicional, nuestra fundación está administrada por un Consejo de padres y madres que trabajan ad-honorem. Esto nos da un carácter humano, transparente y de compromiso verdaderamente único en la región andina.
              </p>
            </div>
            
            <Link href="/comunidad" className="inline-flex items-center gap-2 text-brand-yellow font-bold group w-max text-sm">
              Conocé a nuestro Consejo 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Caja Blanca (Ideario) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-6 bg-white p-6 sm:p-8 md:p-10 rounded-[2rem] shadow-sm border border-brand-gray/10 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-brand-blue mb-3">Ideario de Excelencia</h3>
              <p className="text-brand-foreground/75 leading-relaxed text-sm">
                Fomentamos un clima de cordialidad y respeto mutuo, potenciando la creatividad y una actitud vibrante de búsqueda intelectual.
              </p>
            </div>
          </motion.div>

          {/* Caja Amarilla (Compromiso) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="md:col-span-6 bg-brand-yellow p-6 sm:p-8 md:p-10 rounded-[2rem] shadow-sm flex flex-col justify-between text-brand-blue hover:-translate-y-1 transition-transform"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-brand-blue mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-3">Compromiso Activo</h3>
              <p className="text-brand-blue/80 leading-relaxed text-sm">
                Nuestros estudiantes participan en proyectos solidarios y de impacto ambiental, formando ciudadanos globales comprometidos desde lo local.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
