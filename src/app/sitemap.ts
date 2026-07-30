import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

/**
 * Mapa del sitio. No existía, así que los buscadores tenían que descubrir cada
 * página siguiendo enlaces y las novedades nuevas tardaban en indexarse.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: "/", changeFrequency: "monthly", priority: 1 },
      { url: "/quienes-somos", changeFrequency: "yearly", priority: 0.8 },
      { url: "/propuesta-educativa/inicial", changeFrequency: "yearly", priority: 0.9 },
      { url: "/propuesta-educativa/primario", changeFrequency: "yearly", priority: 0.9 },
      { url: "/propuesta-educativa/secundario", changeFrequency: "yearly", priority: 0.9 },
      { url: "/ingles", changeFrequency: "yearly", priority: 0.8 },
      { url: "/comunidad", changeFrequency: "yearly", priority: 0.7 },
      { url: "/inscripciones", changeFrequency: "monthly", priority: 0.9 },
      { url: "/contacto", changeFrequency: "yearly", priority: 0.8 },
      { url: "/blog", changeFrequency: "weekly", priority: 0.7 },
    ] as const
  ).map((entry) => ({
    ...entry,
    url: `${SITE_URL}${entry.url}`,
    lastModified: new Date(),
  }));

  let postRoutes: MetadataRoute.Sitemap = [];

  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });

    postRoutes = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    // Si la base no está disponible en el momento del build, el sitemap se
    // genera igual con las rutas estáticas en lugar de romper el despliegue.
    console.error("[sitemap] No se pudieron leer las novedades:", error);
  }

  return [...staticRoutes, ...postRoutes];
}
