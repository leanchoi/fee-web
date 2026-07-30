import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import prisma from "@/lib/prisma";
import { toPlainExcerpt } from "@/lib/sanitize";
import { formatPostDate } from "@/lib/dateUtils";
import { MAIN_CAMPUS } from "@/lib/site";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Novedades y eventos",
  description:
    "Comunicados, eventos y vida cotidiana de las escuelas de la Fundación Educativa Esquel.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 60;

export default async function BlogIndexPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-background pb-24">
      <section className="relative bg-brand-yellow pb-20 pt-32 text-brand-blue">
        <div className="container relative z-10 mx-auto px-6 text-center lg:px-12">
          <p className="text-expressive mb-6 block text-3xl sm:text-4xl">El día a día</p>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Novedades institucionales
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-medium opacity-90">
            Eventos, circulares y el pulso de nuestra comunidad educativa.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          {posts.length === 0 ? (
            /* Estado vacío: además de avisar, ofrece una salida concreta.
               Antes sólo decía "Vuelve más tarde". */
            <div className="mx-auto max-w-xl rounded-3xl border border-brand-gray/15 bg-white px-8 py-16 text-center">
              <h2 className="mb-3 text-2xl font-bold text-brand-blue">
                Todavía no publicamos novedades
              </h2>
              <p className="mb-8 text-foreground/70">
                Estamos preparando las primeras notas. Mientras tanto, seguinos en nuestras redes o
                escribinos si necesitás información.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/contacto"
                  className="rounded-full bg-brand-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green"
                >
                  Ir a contacto
                </Link>
                <a
                  href={`mailto:${MAIN_CAMPUS.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-blue/15 px-6 py-3 text-sm font-bold text-brand-blue transition-colors hover:border-brand-blue"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Escribirnos
                </a>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-brand-gray/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {post.imageUrl ? (
                      <div className="relative h-48 w-full overflow-hidden bg-brand-gray/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-brand-blue/10 via-brand-green/5 to-brand-yellow/10"
                        aria-hidden="true"
                      >
                        <span className="h-14 w-14 text-brand-blue/40">
                          <Logo />
                        </span>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-8">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">
                          {post.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-gray-dark">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          <time dateTime={post.createdAt.toISOString()}>
                            {formatPostDate(post.createdAt)}
                          </time>
                        </span>
                      </div>
                      <h2 className="mb-3 line-clamp-2 text-xl font-bold text-brand-blue transition-colors group-hover:text-brand-green">
                        {post.title}
                      </h2>
                      <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-foreground/70">
                        {post.excerpt || toPlainExcerpt(post.content, 120)}
                      </p>
                      <div className="mt-auto flex justify-end">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/5 text-brand-blue transition-colors group-hover:bg-brand-yellow group-hover:text-brand-blue"
                          aria-hidden="true"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
