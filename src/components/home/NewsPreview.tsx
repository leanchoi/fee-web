import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import prisma from "@/lib/prisma";
import { toPlainExcerpt } from "@/lib/sanitize";
import { formatPostDate } from "@/lib/dateUtils";

/** Color de la cinta según la categoría de la nota. */
const CATEGORY_STYLES: Record<string, { bar: string; chip: string }> = {
  Institucional: { bar: "bg-brand-green", chip: "bg-brand-green text-white" },
  Inglés: { bar: "bg-brand-lightblue", chip: "bg-brand-lightblue-dark text-white" },
  Comunidad: { bar: "bg-brand-yellow", chip: "bg-brand-yellow-dark text-white" },
  Eventos: { bar: "bg-brand-blue", chip: "bg-brand-blue text-white" },
};

const DEFAULT_STYLE = { bar: "bg-brand-green", chip: "bg-brand-green text-white" };

/**
 * Últimas novedades publicadas.
 *
 * Esta sección mostraba tres notas inventadas con fechas de 2026 y enlazaba a
 * `/blog/post/<id>`, una ruta que no existe: los tres enlaces de la home
 * llevaban a un 404. Ahora lee las novedades reales de la base y usa el slug
 * correcto. Si todavía no hay ninguna publicada, la sección no se renderiza.
 */
export async function NewsPreview() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  if (posts.length === 0) return null;

  return (
    <section className="bg-white py-24" aria-labelledby="novedades-title">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 block text-sm font-bold uppercase tracking-wide text-brand-lightblue-dark">
              Novedades {"FEE"}
            </p>
            <h2 id="novedades-title" className="text-4xl font-bold text-brand-blue md:text-5xl">
              Actualidad institucional
            </h2>
          </div>
          <Link
            href="/blog"
            className="group flex items-center gap-2 font-bold text-brand-blue transition-colors hover:text-brand-green"
          >
            Ver todas las novedades
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {posts.map((post) => {
            const style = CATEGORY_STYLES[post.category] ?? DEFAULT_STYLE;
            return (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-gray/10 bg-background transition-all duration-300 hover:shadow-lg"
                >
                  <div className={`h-2 ${style.bar}`} aria-hidden="true" />
                  <div className="flex flex-1 flex-col p-8">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${style.chip}`}
                      >
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-gray-dark">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <time dateTime={post.createdAt.toISOString()}>
                          {formatPostDate(post.createdAt)}
                        </time>
                      </span>
                    </div>
                    <h3 className="mb-3 line-clamp-2 text-xl font-bold text-brand-blue transition-colors group-hover:text-brand-green">
                      {post.title}
                    </h3>
                    <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-foreground/70">
                      {post.excerpt || toPlainExcerpt(post.content)}
                    </p>
                    <div className="mt-auto flex justify-end">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/5 text-brand-blue transition-colors group-hover:bg-brand-green group-hover:text-white"
                        aria-hidden="true"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
