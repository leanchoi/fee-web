"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { INITIAL_POSTS, PostItem } from "@/lib/defaultPosts";

export function NewsPreview() {
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);

  useEffect(() => {
    fetch("/api/admin.php?action=get_posts")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.posts)) {
          setPosts(data.posts.slice(0, 3));
        }
      })
      .catch(() => {
        // Fallback a INITIAL_POSTS
      });
  }, []);

  const colorMap: Record<string, string> = {
    "Institucional": "bg-brand-green",
    "Inglés": "bg-brand-lightblue",
    "Comunidad": "bg-brand-yellow"
  };

  if (posts.length === 0) {
    return null;
  }

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
          {posts.map((post) => {
            const color = colorMap[post.category] || "bg-brand-green";
            const excerpt = post.excerpt || (typeof post.content === 'string' ? post.content.replace(/<[^>]*>?/gm, '').replace(/\[.*\]/, '').substring(0, 120) + "..." : "");

            return (
              <Link 
                key={post.id || post.slug} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-background rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-brand-gray/10"
              >
                <div className={`h-2 ${color}`} />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${color}`}>
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-brand-gray text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.createdAt).toLocaleDateString("es-AR", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3 group-hover:text-brand-green transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-brand-foreground/70 text-sm leading-relaxed mb-6 line-clamp-3">
                    {excerpt}
                  </p>
                  <div className="mt-auto flex justify-end">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/5 flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-colors text-brand-blue">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
