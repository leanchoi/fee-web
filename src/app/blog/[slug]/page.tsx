import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { INITIAL_POSTS } from "@/lib/defaultPosts";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const initial = INITIAL_POSTS.find(p => p.slug === resolvedParams.slug);
  if (initial) {
    return {
      title: `${initial.title} | Novedades FEE`,
      description: initial.excerpt,
    };
  }
  try {
    const post = await prisma.post.findUnique({
      where: { slug: resolvedParams.slug },
    });
    if (post) {
      return {
        title: `${post.title} | Novedades FEE`,
        description: post.excerpt || "Novedad institucional de Fundación Educativa Esquel",
      };
    }
  } catch (e) {}

  return { title: "Novedades FEE" };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const defaultSlugs = INITIAL_POSTS.map(p => ({ slug: p.slug }));
  try {
    const posts = await prisma.post.findMany({ select: { slug: true } });
    if (posts && posts.length > 0) {
      const dbSlugs = posts.map((post) => ({ slug: post.slug }));
      return [...defaultSlugs, ...dbSlugs];
    }
  } catch (e) {}
  return defaultSlugs;
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  
  // 1. Check in INITIAL_POSTS
  let post = INITIAL_POSTS.find(p => p.slug === resolvedParams.slug) as any;

  // 2. If not, check in DB
  if (!post) {
    try {
      post = await prisma.post.findUnique({
        where: { slug: resolvedParams.slug },
      });
    } catch (e) {}
  }

  if (!post) {
    post = INITIAL_POSTS[0];
  }

  return (
    <article className="min-h-screen bg-background pb-24">
      {/* Header / Hero */}
      <section className="pt-32 pb-16 bg-brand-blue text-white relative">
        <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-brand-yellow font-bold mb-8 hover:underline text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a todas las novedades
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3.5 py-1.5 bg-brand-green text-white text-xs font-bold rounded-full uppercase tracking-wider">
              {post.category}
            </span>
            <div className="flex items-center gap-1.5 text-white/70 text-sm font-semibold">
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

      {/* Content */}
      <section className="container mx-auto px-6 lg:px-12 max-w-3xl py-12">
        <div className="prose prose-lg max-w-none text-brand-foreground/85 leading-relaxed space-y-6">
          <p className="text-lg leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>
      </section>
    </article>
  );
}
