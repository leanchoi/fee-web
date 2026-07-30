"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";

export function BilingualSection() {
  return (
    <section className="relative py-24 bg-brand-blue overflow-hidden text-white">
      {/* Decorative SVG / Abstract background */}
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="absolute -top-1/4 -right-1/4 w-full h-full rotate-12">
          <path fill="#ffffff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,95.5,-3.3C94.2,11.5,85.6,25.6,76.1,38.8C66.6,52,56.2,64.2,43.2,72.4C30.2,80.6,15.1,84.7,1.8,81.6C-11.5,78.5,-23,68.1,-35.1,59.3C-47.2,50.5,-59.9,43.3,-70.6,32.7C-81.3,22.1,-90,8,-89.4,-5.7C-88.8,-19.4,-78.9,-32.7,-67.7,-43.3C-56.5,-53.9,-44,-61.8,-31.2,-70.1C-18.4,-78.4,-5.4,-87,9,-92C23.4,-97,30.6,-83.6,44.7,-76.4Z" />
        </svg>
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        <motion.div 
          className="flex-1"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-expressive text-2xl lg:text-3xl text-brand-yellow mb-4 block">
            Un mundo de oportunidades
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            A través del inglés
          </h2>
          <p className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg">
            En nuestro proyecto el inglés no es solo una materia más; es un puente hacia el mundo. Preparamos a nuestros estudiantes para los exámenes nacionales UTN e internacionales de Cambridge desde el Nivel Primario hasta el Secundario.
          </p>
          
          <Link
            href="/ingles"
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-blue px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:-translate-y-1 transition-all shadow-lg shadow-white/5"
          >
            Conocé el programa
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        <motion.div 
          className="flex-[0.8] grid grid-cols-1 gap-4 w-full"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-yellow text-brand-blue flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Cambridge English</h4>
              <p className="text-white/70 text-sm">Certificaciones internacionales desde Young Learners hasta C1 Advanced.</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4 ml-0 md:ml-8">
            <div className="w-12 h-12 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Exámenes UTN</h4>
              <p className="text-white/70 text-sm">Acreditaciones oficiales nacionales por la Universidad Tecnológica Nacional.</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-lightblue text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Inmersión Cultural</h4>
              <p className="text-white/70 text-sm">Concert anual bilingüe y viajes de estudios al Reino Unido.</p>
            </div>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
