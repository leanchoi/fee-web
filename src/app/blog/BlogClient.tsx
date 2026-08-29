"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { INITIAL_POSTS, PostItem } from "@/lib/defaultPosts";

export function BlogClient({ initialPosts }: { initialPosts: PostItem[] }) {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);

  useEffect(() => {
    fetch("/api/admin.php?action=get_posts")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-background pb-24">
      <section className="pt-32 pb-20 bg-brand-yellow text-brand-blue relative">
        <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
          <span className="text-expressive text-2xl sm:text-4xl block mb-6">El día a día</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Novedades Institucionales
          </h1>
          <p className="text-xl max-w-2xl mx-auto font-medium opacity-90">
            Eventos, circulares importantes y el pulso vibrante de nuestra comunidad.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed p-8 max-w-lg mx-auto">
              <p className="text-brand-foreground/60 font-semibold">No hay novedades publicadas actualmente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const excerpt = post.excerpt || (typeof post.content === 'string' ? post.content.replace(/<[^>]*>?/gm, '').replace(/\[.*\]/, '').substring(0, 120) + "..." : "");
                return (
                  <Link 
                    key={post.id || post.slug} 
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-white rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-300 border border-brand-gray/10 hover:-translate-y-1"
                  >
                    {post.imageUrl ? (
                      <div className="w-full h-48 bg-brand-gray/10 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-brand-blue/5 flex items-center justify-center">
                        <span className="text-brand-blue/20 font-bold text-4xl">FEE</span>
                      </div>
                    )}
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <span className="px-3 py-1 bg-brand-green/10 text-brand-green text-xs font-bold rounded-full">
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
                        <div className="w-10 h-10 rounded-full bg-brand-blue/5 flex items-center justify-center group-hover:bg-brand-yellow group-hover:text-brand-blue transition-colors text-brand-blue">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
