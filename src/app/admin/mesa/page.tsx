"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit3, Trash2, Loader2, LayoutList } from "lucide-react";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";

interface ArticleItem {
  slug: string;
  title: string;
  type: string;
  date: string;
  excerpt: string;
  coverImage: string;
}

const TYPE_COLORS: Record<string, string> = {
  MESA: "#A89F91",
  ILUMINACIÓN: "#C2A878",
  HOSTING: "#B5A18C",
  ESTÉTICA: "#C0B2A3",
};

export default function AdminMesaPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** Evita mostrar conteos/lista hasta la primera respuesta del CMS */
  const [initialListReady, setInitialListReady] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }
    fetchArticles();
  }, [router]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mesa", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setArticles(data);
    } finally {
      setLoading(false);
      setInitialListReady(true);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return;
    setDeleting(slug);
    await fetch(`/api/mesa/${slug}`, { method: "DELETE" });
    await fetchArticles();
    setDeleting(null);
  };

  if (!initialListReady) {
    return <AdminCmsLoading message="Cargando La Mesa desde el CMS…" />;
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <Link href="/admin" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5 mb-3">
              <ArrowLeft size={14} /> Volver al panel
            </Link>
            <h1 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
              <LayoutList size={28} className="text-brand-accent" />
              La Mesa
            </h1>
            <p className="text-sm font-sans text-brand-muted">
              {articles.length} artículo{articles.length !== 1 ? "s" : ""} publicado{articles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/admin/mesa/nueva">
            <button className="flex items-center gap-2 bg-brand-primary text-brand-secondary px-6 py-3 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent transition-colors">
              <Plus size={16} />
              Nuevo Artículo
            </button>
          </Link>
        </div>

        {/* Article List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-brand-muted" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-brand-muted font-serif text-xl italic">Todavía no hay artículos.</p>
            <Link href="/admin/mesa/nueva">
              <button className="text-xs font-sans font-bold tracking-[0.2em] uppercase text-brand-accent hover:text-brand-primary transition-colors">
                Crear el primero →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.slug}
                className="bg-white rounded-xl p-4 flex items-center gap-5 border border-brand-primary/5 hover:border-brand-accent/20 transition-colors group"
              >
                {/* Cover thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-brand-secondary">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase"
                    style={{ color: TYPE_COLORS[article.type] ?? "#A89F91" }}
                  >
                    {article.type} · {article.date}
                  </span>
                  <h3 className="text-lg font-serif text-brand-primary truncate capitalize">
                    {article.title}
                  </h3>
                  <p className="text-xs font-sans text-brand-muted line-clamp-1">
                    {article.excerpt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/la-mesa/${article.slug}`} target="_blank">
                    <button className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-[#C2A878] hover:border-[#C2A878]/30 transition-all text-[10px] font-sans font-bold tracking-[0.15em] uppercase px-3">
                      Ver
                    </button>
                  </Link>
                  <Link href={`/admin/mesa/editar/${article.slug}`}>
                    <button className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 transition-all">
                      <Edit3 size={16} />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(article.slug)}
                    disabled={deleting === article.slug}
                    className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    {deleting === article.slug ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-brand-primary/5 flex justify-between items-center">
          <Link href="/" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
            ← Volver al sitio
          </Link>
          <Link href="/la-mesa" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
            Ver La Mesa pública →
          </Link>
        </div>
      </div>
    </div>
  );
}
