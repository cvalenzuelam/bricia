"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";
import { ArrowLeft, Save, Upload, Loader2, AlignLeft, Quote, ImageIcon, X } from "lucide-react";
import type { ContentBlock, MesaArticle } from "@/data/lamesa";

const ARTICLE_TYPES = ["MESA", "ILUMINACIÓN", "HOSTING", "ESTÉTICA"] as const;
const REQUEST_TIMEOUT_MS = 20000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadMesaImage(file: File, folder: string): Promise<string | null> {
  const safeName = sanitizeFileName(file.name || `mesa-${Date.now()}.jpg`);
  const pathname = `bricia/images/mesa/${folder}/${Date.now()}-${safeName}`;
  return uploadCmsImageFile(file, pathname);
}

type BlockWithId = ContentBlock & { _id: string };

function mkId() {
  return Math.random().toString(36).slice(2);
}

function blocksFromArticle(body: ContentBlock[]): BlockWithId[] {
  return body.map((b) => ({ ...b, _id: mkId() } as BlockWithId));
}

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditarMesaPage({ params }: EditPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadedCoverPath, setUploadedCoverPath] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "MESA" as typeof ARTICLE_TYPES[number],
    date: "",
    readingTime: "",
    excerpt: "",
    coverImage: "",
    coverColor: "from-[#F3EDE4] to-[#E5DACE]",
  });

  const [blocks, setBlocks] = useState<BlockWithId[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }

    fetchWithTimeout(`/api/mesa/${slug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((article: MesaArticle) => {
        setForm({
          title: article.title,
          type: article.type,
          date: article.date,
          readingTime: article.readingTime,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          coverColor: article.coverColor || "from-[#F3EDE4] to-[#E5DACE]",
        });
        setCoverPreview(article.coverImage);
        setBlocks(blocksFromArticle(article.body || []));
        setLoading(false);
      })
      .catch(() => {
        alert("No se pudo cargar el artículo.");
        setLoading(false);
      });
  }, [slug, router]);

  const getFolder = () =>
    slug || form.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
    const path = await uploadMesaImage(file, getFolder());
    if (path) setUploadedCoverPath(path);
    else alert("Error al subir la portada");
    setUploading(false);
    e.currentTarget.value = "";
  };

  const addBlock = (type: ContentBlock["type"]) => {
    let block: BlockWithId;
    if (type === "paragraph") block = { _id: mkId(), type: "paragraph", text: "" } as BlockWithId;
    else if (type === "quote") block = { _id: mkId(), type: "quote", text: "", author: "" } as BlockWithId;
    else if (type === "image") block = { _id: mkId(), type: "image", url: "", alt: "", caption: "" } as BlockWithId;
    else return;
    setBlocks((b) => [...b, block] as BlockWithId[]);
  };

  const removeBlock = (id: string) => setBlocks((b) => b.filter((bl) => bl._id !== id));
  const updateBlock = (id: string, patch: Partial<BlockWithId>) =>
    setBlocks((b) => b.map((bl) => (bl._id === id ? { ...bl, ...patch } as BlockWithId : bl)));

  const uploadBlockImage = async (id: string, file: File) => {
    setUploading(true);
    const path = await uploadMesaImage(file, getFolder());
    if (path) updateBlock(id, { url: path } as Partial<BlockWithId>);
    else alert("Error al subir imagen");
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const cleanBlocks: ContentBlock[] = blocks
      .filter((bl) => {
        if (bl.type === "paragraph") return bl.text.trim() !== "";
        if (bl.type === "quote") return bl.text.trim() !== "";
        if (bl.type === "image") return bl.url.trim() !== "";
        return false;
      })
      .map(({ _id: _unused, ...rest }) => rest as ContentBlock);

    const payload = {
      ...form,
      coverImage: uploadedCoverPath || form.coverImage,
      body: cleanBlocks,
    };

    const res = await fetchWithTimeout(`/api/mesa/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/admin/mesa");
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Error al guardar el artículo");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/admin/mesa" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> La Mesa
          </Link>
          <h1 className="text-3xl font-serif text-brand-primary">Editar Artículo</h1>
          <p className="text-sm font-sans text-brand-muted mt-1 italic capitalize">{form.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Portada ── */}
          <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 space-y-4">
            <h2 className="text-sm font-serif text-brand-primary border-b border-brand-primary/5 pb-3">Imagen de portada</h2>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative h-56 rounded-xl border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer overflow-hidden bg-brand-secondary group"
            >
              {coverPreview ? (
                <Image src={coverPreview} alt="Portada" fill className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-brand-muted">
                  <Upload size={24} className="opacity-40" />
                  <p className="text-xs font-sans">Clic para cambiar portada</p>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100 transition-all">
                <Upload className="text-white" size={22} />
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </div>

          {/* ── Datos básicos ── */}
          <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 space-y-5">
            <h2 className="text-sm font-serif text-brand-primary border-b border-brand-primary/5 pb-3">Información general</h2>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-serif text-lg focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Extracto</label>
              <textarea
                required
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-serif leading-relaxed focus:outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as typeof ARTICLE_TYPES[number] })}
                  className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
                >
                  {ARTICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Fecha</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Tiempo de lectura</label>
              <input
                value={form.readingTime}
                onChange={(e) => setForm({ ...form, readingTime: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* ── Bloques de contenido ── */}
          <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 space-y-5">
            <h2 className="text-sm font-serif text-brand-primary border-b border-brand-primary/5 pb-3">Contenido del artículo</h2>

            <div className="space-y-4">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={block._id}
                  block={block}
                  index={i}
                  onUpdate={(patch) => updateBlock(block._id, patch)}
                  onRemove={() => removeBlock(block._id)}
                  onImageUpload={(file) => uploadBlockImage(block._id, file)}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-brand-primary/5">
              <button type="button" onClick={() => addBlock("paragraph")}
                className="flex items-center gap-2 text-xs font-sans font-bold tracking-[0.15em] uppercase text-brand-muted border border-brand-primary/10 px-4 py-2.5 rounded-lg hover:border-brand-accent/40 hover:text-brand-accent transition-colors">
                <AlignLeft size={14} /> Párrafo
              </button>
              <button type="button" onClick={() => addBlock("quote")}
                className="flex items-center gap-2 text-xs font-sans font-bold tracking-[0.15em] uppercase text-brand-muted border border-brand-primary/10 px-4 py-2.5 rounded-lg hover:border-brand-accent/40 hover:text-brand-accent transition-colors">
                <Quote size={14} /> Cita
              </button>
              <button type="button" onClick={() => addBlock("image")}
                className="flex items-center gap-2 text-xs font-sans font-bold tracking-[0.15em] uppercase text-brand-muted border border-brand-primary/10 px-4 py-2.5 rounded-lg hover:border-brand-accent/40 hover:text-brand-accent transition-colors">
                <ImageIcon size={14} /> Imagen
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-4 rounded-xl text-sm font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-primary transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              ) : uploading ? (
                <><Loader2 size={18} className="animate-spin" /> Subiendo imagen...</>
              ) : (
                <><Save size={18} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Block Editor ─────────────────────────────────────── */

interface BlockEditorProps {
  block: BlockWithId;
  index: number;
  onUpdate: (patch: Partial<BlockWithId>) => void;
  onRemove: () => void;
  onImageUpload: (file: File) => void;
}

function BlockEditor({ block, index, onUpdate, onRemove, onImageUpload }: BlockEditorProps) {
  const imgInputRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full px-3 py-2.5 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors";
  const textareaCls = `${inputCls} resize-none leading-relaxed`;
  const label = "text-[9px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block";

  return (
    <div className="relative rounded-xl border border-brand-primary/8 bg-brand-secondary p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-brand-accent/70">
          {index + 1} · {block.type === "paragraph" ? "Párrafo" : block.type === "quote" ? "Cita" : "Imagen"}
        </span>
        <button type="button" onClick={onRemove} className="text-brand-muted hover:text-red-500 transition-colors">
          <X size={15} />
        </button>
      </div>

      {block.type === "paragraph" && (
        <textarea
          rows={4}
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value } as Partial<BlockWithId>)}
          placeholder="Escribe el párrafo aquí..."
          className={textareaCls}
        />
      )}

      {block.type === "quote" && (
        <>
          <textarea
            rows={3}
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value } as Partial<BlockWithId>)}
            placeholder="Texto de la cita..."
            className={`${textareaCls} font-serif italic`}
          />
          <div className="space-y-1">
            <label className={label}>Autor (opcional)</label>
            <input
              value={block.author ?? ""}
              onChange={(e) => onUpdate({ author: e.target.value } as Partial<BlockWithId>)}
              placeholder="Bricia Elizalde"
              className={inputCls}
            />
          </div>
        </>
      )}

      {block.type === "image" && (
        <>
          {block.url ? (
            <div className="relative h-40 rounded-lg overflow-hidden group cursor-pointer" onClick={() => imgInputRef.current?.click()}>
              <Image src={block.url} alt={block.alt || ""} fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100">
                <Upload className="text-white" size={20} />
              </div>
            </div>
          ) : (
            <div
              onClick={() => imgInputRef.current?.click()}
              className="h-32 rounded-lg border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-brand-muted"
            >
              <Upload size={20} className="opacity-40" />
              <span className="text-xs font-sans">Subir imagen</span>
            </div>
          )}
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) onImageUpload(file);
              e.currentTarget.value = "";
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={label}>Texto alt</label>
              <input
                value={block.alt}
                onChange={(e) => onUpdate({ alt: e.target.value } as Partial<BlockWithId>)}
                placeholder="Descripción de la imagen"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={label}>Pie de foto (opcional)</label>
              <input
                value={block.caption ?? ""}
                onChange={(e) => onUpdate({ caption: e.target.value } as Partial<BlockWithId>)}
                placeholder="Pie de foto..."
                className={inputCls}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
