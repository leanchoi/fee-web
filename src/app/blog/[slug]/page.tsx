import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { MediaBlocks } from "@/components/blog/MediaBlocks";
import { cn } from "@/lib/utils";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await prisma.post.findUnique({
    where: { slug: resolvedParams.slug },
  });
  if (!post) return { title: "Post no encontrado" };
  return {
    title: `${post.title} | Novedades FEE`,
    description: post.excerpt || "Novedad institucional de Fundación Educativa Esquel",
  };
}

// Revalidar cada 60s
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({ select: { slug: true } });
    if (posts && posts.length > 0) {
      return posts.map((post) => ({ slug: post.slug }));
    }
  } catch (e) {}
  return [{ slug: "bienvenidos-ciclo-lectivo" }];
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  let videoId = "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  } else {
    videoId = url; 
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  let post = null;
  try {
    post = await prisma.post.findUnique({
      where: { slug: resolvedParams.slug },
    });
  } catch (e) {}

  if (!post) {
    post = {
      id: "default-post",
      title: "Bienvenidos a la Fundación Educativa Esquel",
      slug: "bienvenidos-ciclo-lectivo",
      content: "Bienvenidos a nuestra comunidad educativa. Te invitamos a recorrer nuestro proyecto pedagógico integral.",
      excerpt: "Novedades institucionales y comunitarias de la FEE.",
      imageUrl: "/hero-bg.png",
      category: "Institucional",
      published: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Smart Parser: Check if post content is JSON
  let blocks: any[] | null = null;
  if (post.content.trim().startsWith("[")) {
    try {
      blocks = JSON.parse(post.content);
    } catch (e) {
      blocks = null;
    }
  }

  return (
    <div className="bg-background pb-24">
      {/* Article Header */}
      <section className="pt-32 pb-20 bg-brand-green text-white">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl relative z-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-brand-yellow font-bold uppercase tracking-widest text-sm mb-8 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a Novedades
          </Link>
          
          <div className="flex gap-3 mb-6">
            <span className="px-3 py-1 bg-brand-yellow/20 text-brand-yellow text-sm font-bold rounded-full">
              {post.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-white/80 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {new Date(post.createdAt).toLocaleDateString("es-AR", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dirección Institucional
            </div>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-8 md:py-16 -mt-12 relative z-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <article className="bg-white rounded-[2rem] p-6 sm:p-8 md:p-16 shadow-2xl border border-brand-gray/5">
            {post.imageUrl && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-12 bg-brand-gray/10 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg md:text-xl font-medium text-brand-blue/80 italic border-l-4 border-brand-yellow pl-4 py-1 bg-brand-yellow/5 rounded-r-xl mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            {/* Dynamic Rendering Block Engine */}
            {blocks ? (
              <div className="space-y-6">
                {blocks.map((block: any) => {
                  if (block.type === "text") {
                    const CustomTag = block.data.tag || "p";
                    
                    // Mapeo de estilos y alineaciones
                    const alignmentClass = 
                      block.data.align === "center" ? "text-center" : 
                      block.data.align === "right" ? "text-right" : "text-left";
                      
                    const fontClass = 
                      block.data.fontFamily === "font-serif" ? "font-serif" : 
                      block.data.fontFamily === "font-mono" ? "font-mono" : "font-sans";

                    const colorClass = block.data.color || "text-gray-700";

                    let sizeClass = "text-base md:text-lg leading-relaxed font-medium";
                    if (CustomTag === "h1") sizeClass = "text-3xl md:text-4xl font-bold leading-tight mt-8 mb-4";
                    if (CustomTag === "h2") sizeClass = "text-2xl md:text-3xl font-bold mt-6 mb-3";
                    if (CustomTag === "h3") sizeClass = "text-xl md:text-2xl font-bold mt-4 mb-2";
                    if (CustomTag === "span") sizeClass = "text-lg md:text-xl italic font-semibold border-l-4 border-brand-yellow pl-4 py-2 bg-brand-yellow/5 my-4 block";

                    return (
                      <CustomTag 
                        key={block.id} 
                        className={cn(alignmentClass, fontClass, colorClass, sizeClass)}
                      >
                        {block.data.text}
                      </CustomTag>
                    );
                  }

                  if (block.type === "image") {
                    return (
                      <MediaBlocks 
                        key={block.id}
                        layout={block.data.layout} 
                        images={block.data.images} 
                        autoplay={block.data.autoplay} 
                      />
                    );
                  }

                  if (block.type === "video") {
                    if (block.data.videoType === "youtube") {
                      return (
                        <div key={block.id} className="w-full aspect-video rounded-2xl overflow-hidden my-8 shadow-md">
                          <iframe 
                            src={getYouTubeEmbedUrl(block.data.youtubeUrl)}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    if (block.data.videoType === "upload" && block.data.videoUrl) {
                      return (
                        <div key={block.id} className="w-full aspect-video rounded-2xl overflow-hidden my-8 bg-black shadow-md">
                          <video 
                            src={block.data.videoUrl} 
                            controls 
                            className="w-full h-full object-contain"
                            preload="metadata"
                          />
                        </div>
                      );
                    }
                  }

                  return null;
                })}
              </div>
            ) : (
              // Legacy Compatibility Render
              <div 
                className="prose prose-lg md:prose-xl prose-blue max-w-none text-brand-foreground/80 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
