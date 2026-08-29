import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { INITIAL_POSTS } from "@/lib/defaultPosts";
import { BlogPostClient } from "./BlogPostClient";

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
  return defaultSlugs.length > 0 ? defaultSlugs : [{ slug: "_post" }];
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

  return <BlogPostClient slug={resolvedParams.slug} initialPost={post || null} />;
}
