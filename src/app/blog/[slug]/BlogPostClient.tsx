"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { PostItem } from "@/lib/defaultPosts";

export function BlogPostClient({ slug, initialPost }: { slug: string; initialPost?: PostItem | null }) {
  const [post, setPost] = useState<PostItem | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let targetSlug = slug;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] === "blog") {
        targetSlug = decodeURIComponent(parts[1]);
      }
    }

    if (initialPost && initialPost.slug === targetSlug) {
      setPost(initialPost);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/admin.php?action=get_posts&slug=" + encodeURIComponent(targetSlug))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.post) {
          setPost(data.post);
          if (typeof document !== "undefined" && data.post.title) {
            document.title = `${data.post.title} | Novedades FEE`;
          }
        } else {
          setPost(null);
        }
      })
      .catch(() => {
        setPost(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, initialPost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-brand-blue animate-spin mb-4" />
        <p className="text-brand-blue font-semibold">Cargando novedad...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background py-32">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-brand-blue mb-4">Novedad no encontrada</h2>
          <p className="text-brand-foreground/70 mb-8">Esta publicación puede haber sido retirada o modificada.</p>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-full font-bold hover:bg-brand-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Novedades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-background pb-24">
      <section className="pt-32 pb-16 bg-brand-blue text-white relative">
        <div className="container mx-auto px-6 lg:qx-12 max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-brand-yellow font-bold mb-8 hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a todas las novedades
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3.5 py-1.5 bg-brand-green text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {post.category || "Institucional"}
            </span>
            <div className="flex items-center gap-1.5 text-white/50 text-sm font-semibold">
              <Calendar className="w-4 h-4" />
              {new Date(post.createdAt).toLocaleDateString("es-AR", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Main Image */}
      {post.imageUrl && (
        <section className="container mx-auto px-6 lg:px-12 max-w-4xl -mt-8 relative z-10">
          <div className="w-full h-72 sm:h-96 md:h-[420px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        </section>
      )}

      <section className="container mx-auto px-6 lg:px-12 max-w-3xl py-12">
        <div className="text-brand-foreground/85 leading-relaxed space-y-6">
          {(() => {
            if (typeof post.content === 'string' && post.content.trim().startsWith('[')) {
              try {
                const parsedBlocks = JSON.parse(post.content);
                if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                  return parsedBlocks.map((block: any, bIdx: number) => {
                    if (block.type === 'text') {
                      const Tag = (block.data?.tag || 'p') as any;
                      const colorClass = block.data?.color || 'text-brand-blue';
                      const alignClass = block.data?.align === 'center' ? 'text-center' : block.data?.align === 'right' ? 'text-right' : 'text-left';
                      const fontClass = block.data?.fontFamily === 'serif' ? 'font-serif' : block.data?.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

                      return (
                        <Tag key={block.id || bIdx} className={`${colorClass} ${alignClass} ${fontClass} text-lg leading-relaxed font-medium`}>
                          {block.data?.text}
                        </Tag>
                      );
                    }
                    if (block.type === 'image') {
                      const images = block.data?.images || [];
                      if (images.length === 0) return null;
                      return (
                        <div key={block.id || bIdx} className="my-8 space-y-3">
                          <div className={`grid ${images.length > 1 ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                            {images.map((img: string, i: number) => (
                              <div key={i} className="rounded-2xl overflow-hidden shadow-md border bg-slate-100">
                                <img src={img} alt={`Imagen ${i + 1}`} className="w-full h-auto object-cover max-h-[500px]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (block.type === 'video') {
                      const { videoType, youtubeUrl, videoUrl } = block.data || {};
                      if (videoType === 'youtube' && youtubeUrl) {
                        let embedUrl = youtubeUrl;
                        if (youtubeUrl.includes('watch?v=')) {
                          embedUrl = youtubeUrl.replace('watch?v=', 'embed/');
                        } else if (youtubeUrl.includes('youtu.be/')) {
                          embedUrl = youtubeUrl.replace('youtu.be/', 'www.youtube.com/embed/');
                        }
                        return (
                          <div key={block.id || bIdx} className="my-8 aspect-video w-full rounded-2xl overflow-hidden shadow-lg border">
                            <iframe src={embedUrl} title="Video" className="w-full h-full" allowFullScreen />
                          </div>
                        );
                      }
                      if (videoUrl) {
                        return (
                          <div key={block.id || bIdx} className="my-8 aspect-video w-full rounded-2xl overflow-hidden shadow-lg border bg-black">
                            <video src={videoUrl} controls className="w-full h-full object-contain" />
                          </div>
                        );
                      }
                    }
                    return null;
                  });
                }
              } catch (e) {}
            }

            return (
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            );
          })()}
        </div>
      </section>
    </article>
  );
}
