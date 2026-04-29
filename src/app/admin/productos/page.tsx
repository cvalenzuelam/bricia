"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Edit3, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";

const CATEGORY_COLORS: Record<string, string> = {
  COCINA: "#A89F91",
  MESA: "#C2A878",
  DESPENSA: "#B5A18C",
};

export default function AdminProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialListReady, setInitialListReady] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/productos", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } finally {
      setLoading(false);
      setInitialListReady(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    await fetchProducts();
    setDeleting(null);
  };

  if (!initialListReady) {
    return <AdminCmsLoading message="Cargando productos desde el CMS…" />;
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
              <ShoppingBag size={28} className="text-brand-accent" />
              La Alacena
            </h1>
            <p className="text-sm font-sans text-brand-muted">
              {products.length} producto{products.length !== 1 ? "s" : ""} publicado{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/admin/productos/nueva">
            <button className="flex items-center gap-2 bg-brand-primary text-brand-secondary px-6 py-3 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent transition-colors">
              <Plus size={16} />
              Nuevo Producto
            </button>
          </Link>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-brand-muted" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-brand-muted font-serif text-xl italic">Todavía no hay productos.</p>
            <Link href="/admin/productos/nueva">
              <button className="text-xs font-sans font-bold tracking-[0.2em] uppercase text-brand-accent hover:text-brand-primary transition-colors">
                Agregar el primero →
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl p-4 flex items-center gap-5 border border-brand-primary/5 hover:border-brand-accent/20 transition-colors group"
              >
                {/* Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-brand-secondary">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="80px"
                    quality={PHOTO_IMAGE_QUALITY}
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase"
                      style={{ color: CATEGORY_COLORS[product.category] ?? "#A89F91" }}
                    >
                      {product.category}
                    </span>
                    {product.stock <= 3 && (
                      <span className="text-[9px] font-sans text-brand-accent border border-brand-accent/30 rounded-full px-2 py-0.5 tracking-[0.1em] uppercase">
                        Stock bajo
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif text-brand-primary truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs font-sans text-brand-muted truncate">
                    {product.subtitle} · {formatPrice(product.price)} · {product.stock} en stock
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/productos`} target="_blank">
                    <button className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-[#C2A878] hover:border-[#C2A878]/30 transition-all text-[10px] font-sans font-bold tracking-[0.15em] uppercase px-3">
                      Ver
                    </button>
                  </Link>
                  <Link href={`/admin/productos/editar/${product.id}`}>
                    <button className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 transition-all">
                      <Edit3 size={16} />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50"
                  >
                    {deleting === product.id ? (
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
          <Link href="/productos" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
            Ver tienda pública →
          </Link>
        </div>
      </div>
    </div>
  );
}
