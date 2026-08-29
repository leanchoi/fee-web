import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { INITIAL_POSTS } from "@/lib/defaultPosts";
import { BlogClient } from "./BlogClient";

export const metadata: Metadata = {
  title: "Novedades y Eventos | Fundación Educativa Esquel",
  description: "Últimas noticias, comunicados y vida institucional educativa.",
};

export const revalidate = 60;

export default async function BlogIndexPage() {
  let dbPosts: any[] = [];
  try {
    dbPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {}

  const posts = dbPosts && dbPosts.length > 0 ? dbPosts : INITIAL_POSTS;

  return <BlogClient initialPosts={posts} />;
}
