import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

// Mock data for initial frontend assembly
const recentPosts = [
  {
    id: 1,
    title: "Inicio del Ciclo Lectivo 2026",
    date: "26 Feb 2026",
    category: "Institucional",
    excerpt: "Comenzamos un nuevo año con la esperanza y el compromiso renovado de toda la comunidad...",
    color: "bg-brand-green"
  },
  {
    id: 2,
    title: "Cambridge English Acreditation",
    date: "14 Mar 2026",
    category: "Inglés",
    excerpt: "Felicitamos a los alumnos de 6to año que han obtenido su First Certificate con honores.",
    color: "bg-brand-lightblue"
  },
  {
    id: 3,
    title: "Kermesse Solidaria de Otoño",
    date: "02 Abr 2026",
    category: "Comunidad",
    excerpt: "Invitamos a todas las familias al gran evento solidario del año en el SUM de la sede primaria.",
    color: "bg-brand-yellow"
  }
];

export function NewsPreview() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <span className="text-brand-lightblue font-bold uppercase tracking-wide text-sm mb-2 block">
              Novedades FEE
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-blue">
              Actualidad institucional
            </h2>
          </div>
          <Link
            href="/blog"
            className="group flex items-center gap-2 text-brand-blue font-bold hover:text-brand-green transition-colors"
          >
            Ver todas las novedades
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recentPosts.map((post) => (
            <Link 
              key={post.id} 
              href="/blog"
              className="group flex flex-col bg-background rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-brand-gray/10"
            >
              <div className={`h-2 ${post.color}`} />
              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${post.color}`}>
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-brand-gray text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-3 group-hover:text-brand-green transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-brand-foreground/70 text-sm leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex justify-end">
                  <div className="w-10 h-10 rounded-full bg-brand-blue/5 flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-colors text-brand-blue">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
