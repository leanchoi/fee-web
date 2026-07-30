import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import prisma from "@/lib/prisma";
import { MediaBlocks } from "@/components/blog/MediaBlocks";
import { cn } from "@/lib/utils";
import { formatPostDate } from "@/lib/dateUtils";
import {
  getYouTubeId,
  resolveBlockAlign,
  resolveBlockColor,
  resolveBlockFont,
  resolveBlockTag,
  sanitizeHtml,
  toPlainExcerpt,
} from "@/lib/sanitize";

type Params = { slug: string };

/**
 * Sin revalidación por tiempo: las acciones del panel llaman a
 * `revalidatePath` al crear, editar, publicar o borrar una nota, así que el
 * contenido se actualiza en el momento en que se edita.
 *
 * Nota sobre los slugs inexistentes: Next cachea el resultado de `notFound()`
 * en las rutas con parámetros dinámicos y lo sirve con estado 200 (un "soft
 * 404"). Ponerle `dynamicParams = false` devuelve el 404 correcto, pero
 * entonces una nota publicada después del build queda inaccesible hasta el
 * siguiente despliegue, lo que rompe el panel. Se elige mantener el panel
 * funcionando y neutralizar el efecto en buscadores con `noindex` en los
 * metadatos de la nota no encontrada (ver `generateMetadata`).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Se filtra por `published` también acá: `generateMetadata` corre aparte del
  // componente, así que el título y el resumen de un borrador aparecían en la
  // etiqueta <title> y en Open Graph aunque el cuerpo no se mostrara.
  const post = await prisma.post.findFirst({ where: { slug, published: true } });

  if (!post) return { title: "Novedad no encontrada", robots: { index: false, follow: false } };

  const description = post.excerpt || toPlainExcerpt(post.content, 155);

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      url: `/blog/${post.slug}`,
      images: post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : undefined,
    },
    twitter: {
      card: post.imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.imageUrl ? [post.imageUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map((post) => ({ slug: post.slug }));
}

interface Block {
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
}

/** Sólo se acepta como estructura de bloques un arreglo JSON válido. */
function parseBlocks(content: string): Block[] | null {
  if (!content.trim().startsWith("[")) return null;
  try {
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as Block[]) : null;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  // Una nota despublicada deja de ser accesible por URL directa: antes seguía
  // sirviéndose aunque el panel la marcara como borrador.
  const post = await prisma.post.findFirst({ where: { slug, published: true } });

  if (!post) notFound();

  const blocks = parseBlocks(post.content);

  return (
    <div className="bg-background pb-24">
      <article>
        {/* Encabezado */}
        <header className="bg-brand-green pb-20 pt-32 text-white">
          <div className="container relative z-10 mx-auto max-w-4xl px-6 lg:px-12">
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-yellow-light transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a novedades
            </Link>

            <p className="mb-6 flex gap-3">
              <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-sm font-bold text-brand-yellow-light">
                {post.category}
              </span>
            </p>

            <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 font-medium text-white/85">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" aria-hidden="true" />
                <time dateTime={post.createdAt.toISOString()}>
                  {formatPostDate(post.createdAt, "long")}
                </time>
              </span>
              <span className="flex items-center gap-2">
                <User className="h-5 w-5" aria-hidden="true" />
                Dirección institucional
              </span>
            </div>
          </div>
        </header>

        {/* Cuerpo */}
        <div className="relative z-20 -mt-12 py-8 md:py-16">
          <div className="container mx-auto max-w-4xl px-6 lg:px-12">
            <div className="rounded-[2rem] border border-brand-gray/10 bg-white p-6 shadow-2xl sm:p-8 md:p-16">
              {post.imageUrl && (
                <div className="mb-12 aspect-video w-full overflow-hidden rounded-2xl bg-brand-gray/10 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
              )}

              {post.excerpt && (
                <p className="mb-8 rounded-r-xl border-l-4 border-brand-yellow bg-brand-yellow/5 py-2 pl-4 text-lg font-medium italic leading-relaxed text-brand-blue/85 md:text-xl">
                  {post.excerpt}
                </p>
              )}

              {blocks ? (
                <div className="space-y-6">
                  {blocks.map((block, index) => {
                    const key = block.id ?? `block-${index}`;
                    const data = block.data ?? {};

                    if (block.type === "text") {
                      // La etiqueta se resuelve contra una lista de permitidos:
                      // antes se usaba `block.data.tag` tal cual como componente,
                      // así que un bloque guardado con `tag: "script"` terminaba
                      // como <script> real en el HTML del servidor.
                      const Tag = resolveBlockTag(data.tag);
                      const text = typeof data.text === "string" ? data.text : "";

                      if (!text.trim()) return null;

                      const sizeClass =
                        Tag === "h2"
                          ? "text-2xl md:text-3xl font-bold text-brand-blue mt-8 mb-2"
                          : Tag === "h3"
                            ? "text-xl md:text-2xl font-bold text-brand-blue mt-6 mb-1"
                            : Tag === "h4"
                              ? "text-lg md:text-xl font-bold text-brand-blue mt-4"
                              : Tag === "blockquote"
                                ? "text-lg md:text-xl italic font-semibold border-l-4 border-brand-yellow pl-4 py-2 bg-brand-yellow/5 rounded-r-xl my-4"
                                : "text-base md:text-lg leading-relaxed";

                      return (
                        <Tag
                          key={key}
                          className={cn(
                            resolveBlockAlign(data.align),
                            resolveBlockFont(data.fontFamily),
                            resolveBlockColor(data.color),
                            sizeClass,
                            "whitespace-pre-line"
                          )}
                        >
                          {text}
                        </Tag>
                      );
                    }

                    if (block.type === "image") {
                      const images = Array.isArray(data.images)
                        ? (data.images as unknown[]).filter(
                            (src): src is string => typeof src === "string"
                          )
                        : [];

                      if (images.length === 0) return null;

                      return (
                        <MediaBlocks
                          key={key}
                          layout={data.layout === "carousel" || data.layout === "slider" ? data.layout : "single"}
                          images={images}
                          autoplay={data.autoplay === true}
                        />
                      );
                    }

                    if (block.type === "video") {
                      if (data.videoType === "youtube") {
                        // Sin un identificador válido no se renderiza nada, en
                        // lugar de construir una URL con la entrada cruda.
                        const videoId = getYouTubeId(
                          typeof data.youtubeUrl === "string" ? data.youtubeUrl : ""
                        );
                        if (!videoId) return null;

                        return (
                          <div
                            key={key}
                            className="my-8 aspect-video w-full overflow-hidden rounded-2xl shadow-md"
                          >
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                              title={`Video: ${post.title}`}
                              className="h-full w-full border-0"
                              loading="lazy"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }

                      const videoUrl = typeof data.videoUrl === "string" ? data.videoUrl : "";
                      // Sólo archivos servidos por la propia instalación.
                      if (!videoUrl.startsWith("/uploads/")) return null;

                      return (
                        <div
                          key={key}
                          className="my-8 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-md"
                        >
                          <video
                            src={videoUrl}
                            controls
                            className="h-full w-full object-contain"
                            preload="metadata"
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              ) : (
                // Compatibilidad con notas heredadas guardadas como HTML.
                // El contenido se depura contra una lista de permitidos antes de
                // inyectarse: sin eso, cualquier persona con permiso de blog
                // podía ejecutar JavaScript en el dominio del colegio.
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
                />
              )}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full border-2 border-brand-blue/15 px-6 py-3 text-sm font-bold text-brand-blue transition-colors hover:border-brand-blue"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Ver todas las novedades
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
