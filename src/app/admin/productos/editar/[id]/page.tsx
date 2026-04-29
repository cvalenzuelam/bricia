"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import type { Product } from "@/data/products";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";

const DEFAULT_CATEGORIES = ["COCINA", "MESA", "DESPENSA"] as const;
const REQUEST_TIMEOUT_MS = 20000;
const FRONT_SYNC_TIMEOUT_MS = 60000;
const FRONT_SYNC_INTERVAL_MS = 2500;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function waitForProductUpdateInApi(productId: string, expectedName: string): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < FRONT_SYNC_TIMEOUT_MS) {
    try {
      const res = await fetchWithTimeout(`/api/productos/${productId}?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const product = await res.json();
        if (product?.name === expectedName) return true;
      }
    } catch { /* keep polling */ }
    await new Promise((r) => setTimeout(r, FRONT_SYNC_INTERVAL_MS));
  }
  return false;
}

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadProductImage(file: File): Promise<string | null> {
  const safeName = sanitizeFileName(file.name || `producto-${Date.now()}.jpg`);
  const pathname = `bricia/images/productos/${Date.now()}-${safeName}`;
  return uploadCmsImageFile(file, pathname);
}

export default function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    price: "",
    description: "",
    dimensions: "",
    material: "",
    category: "COCINA",
    stock: "0",
    image: "/images/mesa_setting.png",
  });

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }
    setNotFound(false);
    setLoadingProduct(true);
    void loadProduct();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`/api/productos/${id}`, { cache: "no-store" });
      if (!res.ok) { setNotFound(true); return; }
      const product: Product = await res.json();
      setForm({
        name: product.name,
        subtitle: product.subtitle,
        price: String(product.price),
        description: product.description,
        dimensions: product.dimensions ?? "",
        material: product.material ?? "",
        category: product.category,
        stock: String(product.stock),
        image: product.image,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return form.image;
    setUploading(true);
    try {
      const url = await uploadProductImage(imageFile);
      return url ?? form.image;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert("El nombre es obligatorio."); return; }
    if (!form.category.trim()) { alert("La etiqueta o categoría es obligatoria."); return; }

    setPublishing(true);
    setPublishMessage("Subiendo imagen…");

    const imagePath = await uploadImage();

    setPublishMessage("Guardando cambios…");

    const payload = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      price: Number(form.price) || 0,
      description: form.description.trim(),
      dimensions: form.dimensions.trim(),
      material: form.material.trim(),
      category: form.category.trim().toUpperCase(),
      stock: Number(form.stock) || 0,
      image: imagePath,
    };

    try {
      const res = await fetchWithTimeout(`/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al guardar");
      }

      setPublishMessage("Verificando en la tienda…");
      await waitForProductUpdateInApi(id, form.name.trim());

      router.push("/admin/productos");
    } catch (err) {
      setPublishing(false);
      setPublishMessage("");
      alert(err instanceof Error ? err.message : "Error al guardar el producto");
    }
  };

  if (loadingProduct) {
    return <AdminCmsLoading message="Cargando producto desde el CMS…" />;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-brand-secondary pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-serif text-2xl italic text-brand-primary/40">Producto no encontrado.</p>
          <Link href="/admin/productos" className="text-xs font-sans text-brand-accent hover:text-brand-primary transition-colors">
            ← Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  const displayImage = imagePreview || form.image;

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      {/* Publishing overlay */}
      {publishing && (
        <div className="fixed inset-0 z-50 bg-brand-primary/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <Loader2 size={40} className="animate-spin text-brand-secondary" />
          <p className="text-brand-secondary font-serif text-xl italic">{publishMessage}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/admin/productos" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> Volver a productos
          </Link>
          <h1 className="text-3xl font-serif text-brand-primary">Editar Producto</h1>
          <p className="text-sm font-sans text-brand-muted mt-1 font-serif italic lowercase">{form.name || "…"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image upload */}
          <div className="space-y-3">
            <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
              Imagen del producto
            </label>
            <div
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white border-2 border-dashed border-brand-primary/10 cursor-pointer hover:border-brand-accent/40 transition-colors group"
              onClick={() => imageInputRef.current?.click()}
            >
              {displayImage && (
                <Image src={displayImage} alt="Preview" fill className="object-cover" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 group-hover:bg-black/20 transition-colors">
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-white" />
                ) : (
                  <>
                    <Upload size={20} className="text-white/0 group-hover:text-white transition-all" />
                    <span className="text-[10px] font-sans text-white/0 group-hover:text-white transition-all tracking-[0.1em] uppercase">
                      Cambiar imagen
                    </span>
                  </>
                )}
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-serif text-lg focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
              Subtítulo
            </label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-serif text-sm italic focus:outline-none focus:border-brand-accent transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
                Dimensiones
              </label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder='Ej. 42 × 28 × 2 cm o "diám. 22 cm · alto 9 cm"'
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
              <p className="text-[10px] font-sans text-brand-muted leading-relaxed">
                Opcional · cómo aparece en la ficha del producto
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
                Material
              </label>
              <input
                type="text"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
                placeholder="Ej. Madera de olivo · gres cerámico"
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
              <p className="text-[10px] font-sans text-brand-muted leading-relaxed">
                Opcional · textura, acabado o contenido principal
              </p>
            </div>
          </div>

          {/* Category + Price + Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-start">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
                Etiqueta / categoría
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value.trim().toUpperCase(),
                  }))
                }
                placeholder="Ej. COCINA, REGALOS, VAJILLA…"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm uppercase focus:outline-none focus:border-brand-accent transition-colors"
              />
              <p className="text-[10px] font-sans text-brand-muted">
                Escribe la etiqueta que quieras. Atajos:
              </p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                    className={`text-[9px] font-sans font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
                      form.category === cat
                        ? "bg-brand-primary text-brand-secondary border-brand-primary"
                        : "border-brand-primary/15 text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
                Precio (MXN)
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={publishing || uploading}
              className="flex items-center gap-2 bg-brand-primary text-brand-secondary px-8 py-3.5 rounded-lg text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <><Loader2 size={15} className="animate-spin" /> Guardando…</>
              ) : (
                <><Save size={15} /> Guardar Cambios</>
              )}
            </button>
            <Link href="/admin/productos" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
