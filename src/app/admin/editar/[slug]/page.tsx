"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";
import { ArrowLeft, Upload, Plus, X, Loader2, Save, Video } from "lucide-react";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";
import type { Recipe } from "@/data/recipes";

const CATEGORIES = ["PRIMAVERA", "VERANO", "OTOÑO", "INVIERNO", "POSTRES"];
const REQUEST_TIMEOUT_MS = 20000;
/** Tiempo hasta que API + página pública reflejan el guardado. */
const FRONT_SYNC_TIMEOUT_MS = 90000;
const FRONT_SYNC_INTERVAL_MS = 500;
const PUBLIC_HTML_FETCH_MS = 28000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
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

async function uploadRecipeImage(file: File, slug: string): Promise<string | null> {
  const safeName = sanitizeFileName(file.name || `recipe-${Date.now()}.jpg`);
  const pathname = `bricia/images/recipes/${slug}/${Date.now()}-${safeName}`;
  return uploadCmsImageFile(file, pathname);
}

function normalizedIngredientList(rows: string[]) {
  return rows.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Igual que el listado Mis Recetas: GET /api/recipes → filas slug, title, subtitle, category, image. */
function adminListRecipeMatches(remote: Recipe | undefined, want: Recipe): boolean {
  if (!remote || remote.slug !== want.slug) return false;
  if (remote.title.trim() !== want.title.trim()) return false;
  if (remote.subtitle.trim() !== want.subtitle.trim()) return false;
  if (remote.category !== want.category) return false;
  if (remote.image.trim() !== want.image.trim()) return false;
  return true;
}

/** Fragmento estable de la URL de imagen (nombre de objeto) dentro del HTML. */
function stableImageFinger(url: string): string {
  const u = url.trim();
  if (!u) return "";
  try {
    const p = new URL(u, "http://local.invalid").pathname;
    const leaf = decodeURIComponent(p.split("/").filter(Boolean).pop() || "");
    if (leaf.length >= 12) return leaf;
  } catch {
    /* ignore */
  }
  return u.length > 120 ? u.slice(-120) : u;
}

async function waitUntilAdminListReflects(slug: string, want: Recipe, timeoutMs = FRONT_SYNC_TIMEOUT_MS) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetchWithTimeout(`/api/recipes?sync=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (res.ok) {
        const list = (await res.json()) as Recipe[];
        if (Array.isArray(list)) {
          const row = list.find((r) => r.slug === slug);
          if (adminListRecipeMatches(row, want)) return true;
        }
      }
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, FRONT_SYNC_INTERVAL_MS));
  }

  return false;
}

function htmlLooksLikePublicRecipe(html: string, want: Recipe): boolean {
  const title = want.title.trim();
  if (!title || !html.includes(title)) return false;

  const img = stableImageFinger(want.image);
  if (img && !html.includes(img)) return false;

  const sub = want.subtitle.trim();
  if (sub && !html.includes(sub)) return false;

  const histPlain = want.history.replace(/\s+/g, " ").trim();
  if (histPlain.length >= 8) {
    const snap = histPlain.slice(0, Math.min(90, histPlain.length));
    if (!html.includes(snap)) return false;
  }

  const firstStep = normalizedIngredientList(want.steps)[0];
  if (firstStep && firstStep.length > 10 && !html.includes(firstStep)) return false;

  return true;
}

async function waitUntilPublicRecipePageReflects(
  slug: string,
  want: Recipe,
  timeoutMs = FRONT_SYNC_TIMEOUT_MS
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetchWithTimeout(
        `/recetas/${slug}?sync=${Date.now()}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        },
        PUBLIC_HTML_FETCH_MS
      );
      if (res.ok) {
        const html = await res.text();
        if (htmlLooksLikePublicRecipe(html, want)) return true;
      }
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, FRONT_SYNC_INTERVAL_MS));
  }

  return false;
}

interface EditPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditRecipePage({ params }: EditPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const pendingMainUploadRef = useRef<Promise<string | null> | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "RECETA ESTRELLA",
    history: "",
    prepTime: "",
    servings: "",
    image: "",
    videoUrl: "",
  });
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);

  // Auth check & load recipe
  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") {
      router.push("/admin");
      return;
    }

    fetchWithTimeout(`/api/recipes/${slug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((recipe) => {
        setForm({
          title: recipe.title,
          subtitle: recipe.subtitle,
          category: recipe.category,
          history: recipe.history,
          prepTime: recipe.prepTime,
          servings: recipe.servings,
          image: recipe.image,
          videoUrl: recipe.videoUrl || "",
        });
        setIngredients(recipe.ingredients?.length ? recipe.ingredients : [""]);
        setSteps(recipe.steps?.length ? recipe.steps : [""]);
        setGallery(recipe.gallery || []);
        setImagePreview(recipe.image);
        setLoading(false);
      })
      .catch(() => {
        alert("No se pudo cargar la receta. Intenta recargar la página.");
        setLoading(false);
      });
  }, [slug, router]);

  useEffect(() => {
    if (!saving && !uploading && !publishing) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saving, uploading, publishing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const uploadPromise = (async () => {
        return await uploadRecipeImage(file, slug);
      })();
      pendingMainUploadRef.current = uploadPromise;
      const path = await uploadPromise;
      if (path) setUploadedImagePath(path);
      else alert("Error al subir imagen");
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      // Permite seleccionar el mismo archivo otra vez (si no, el browser no dispara onChange)
      input.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const files = input.files;
    if (!files) return;
    
    if (gallery.length + files.length > 4) {
      alert("Puedes subir un máximo de 4 imágenes en la galería para el mosaico.");
      return;
    }

    const uploadedPaths: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const path = await uploadRecipeImage(file, slug);
          if (path) uploadedPaths.push(path);
          else alert("Error al subir imagen");
      }
    } catch {
      alert("Error al subir imagen");
    } finally {
      input.value = "";
    }
    setGallery((prev) => [...prev, ...uploadedPaths]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let mainImagePath = uploadedImagePath || form.image;

    // Asegura que el upload (si existe) termine antes de guardar
    try {
      const pending = pendingMainUploadRef.current;
      if (pending) {
        setUploading(true);
        const path = await pending;
        if (path) {
          mainImagePath = path;
          setUploadedImagePath(path);
        }
      }
    } finally {
      setUploading(false);
      pendingMainUploadRef.current = null;
    }

    const recipePayload = {
      ...form,
      image: mainImagePath,
      videoUrl: form.videoUrl.trim(),
      videoThumbnail: "",
      gallery,
      ingredients: ingredients.filter((i) => i.trim() !== ""),
      steps: steps.filter((s) => s.trim() !== ""),
    };

    const wantRecipe: Recipe = {
      slug,
      ...recipePayload,
      videoThumbnail: recipePayload.videoThumbnail || "",
    };

    try {
      const res = await fetchWithTimeout(`/api/recipes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipePayload),
      });

      if (res.ok) {
        setPublishing(true);
        setPublishMessage("Actualizando el panel (/admin)…");
        const inAdminList = await waitUntilAdminListReflects(slug, wantRecipe);

        if (!inAdminList) {
          alert(
            "El guardado pudo hacerse pero el listado del panel (/admin) aún no muestra estos datos. Espera un poco y recarga esta página si hace falta."
          );
          return;
        }

        setPublishMessage("Actualizando la página pública (/recetas)…");
        const reflectedInPublic = await waitUntilPublicRecipePageReflects(slug, wantRecipe);
        if (!reflectedInPublic) {
          alert(
            "El panel ya está al día pero la receta en la web pública aún tardó. Espera un poco y vuelve a abrir /recetas."
          );
          return;
        }

        router.refresh();
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.error || "Error al actualizar la receta");
      }
    } catch {
      alert("La petición tardó demasiado. Revisa conexión y vuelve a intentar.");
    } finally {
      setPublishing(false);
      setPublishMessage("");
      setSaving(false);
    }
  };

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, val: string) => {
    const copy = [...ingredients]; copy[i] = val; setIngredients(copy);
  };
  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, val: string) => {
    const copy = [...steps]; copy[i] = val; setSteps(copy);
  };

  if (loading) {
    return <AdminCmsLoading message="Cargando receta desde el CMS…" />;
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      {(saving || uploading || publishing) && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl border border-brand-primary/10 shadow-xl p-6 w-full max-w-md text-center space-y-3">
            <Loader2 size={28} className="animate-spin text-brand-accent mx-auto" />
            <p className="text-sm font-sans font-bold tracking-[0.12em] uppercase text-brand-primary">
              Procesando cambios
            </p>
            <p className="text-xs font-sans text-brand-muted">
              {publishMessage || (uploading ? "Subiendo imagen..." : "Guardando receta...")}
            </p>
            <p className="text-[11px] font-sans text-brand-muted/80">
              Espera: primero /admin y luego /recetas. El loader hasta que coincidan.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {(saving || uploading || publishing) ? (
          <span className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted mb-8 cursor-not-allowed opacity-50 select-none pointer-events-none">
            <ArrowLeft size={14} /> Volver al panel
          </span>
        ) : (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Volver al panel
          </Link>
        )}

        <h1 className="text-3xl font-serif text-brand-primary mb-10">
          Editar: <span className="italic text-brand-accent">{form.title}</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">
              Foto del Platillo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-64 rounded-xl border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-white group"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <Upload size={32} className="mx-auto text-brand-muted/40" />
                  <p className="text-sm font-sans text-brand-muted/60">Cambiar foto</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Título *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-serif text-lg focus:outline-none focus:border-brand-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Subtítulo</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-serif text-lg focus:outline-none focus:border-brand-accent transition-colors" />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.15em] uppercase transition-all ${form.category === cat ? "bg-brand-primary text-brand-secondary" : "bg-white border border-brand-primary/10 text-brand-muted hover:border-brand-accent/30"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Tiempo</label>
              <input value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans focus:outline-none focus:border-brand-accent transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Porciones</label>
              <input value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans focus:outline-none focus:border-brand-accent transition-colors" />
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">La Historia</label>
            <textarea value={form.history} onChange={(e) => setForm({ ...form, history: e.target.value })} rows={4}
              className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-serif leading-relaxed focus:outline-none focus:border-brand-accent transition-colors resize-none" />
          </div>

          {/* Video */}
          <div className="space-y-4 rounded-2xl border border-brand-primary/10 bg-white/80 p-6">
            <div className="flex items-center gap-2 border-b border-brand-primary/5 pb-3">
              <Video size={18} className="text-brand-accent" />
              <h3 className="text-sm font-serif text-brand-primary">Video de la receta</h3>
            </div>
            <p className="text-[11px] font-sans text-brand-muted leading-relaxed">
              En la receta se mostrará un enlace sencillo (“Clic aquí para ver el video.”). Puedes pegar Instagram, YouTube, Vimeo o un archivo .mp4/.webm.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">
                URL del video
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.instagram.com/reel/…"
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Galería */}
          <div className="space-y-2">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Galería (Opcional, Máx 4)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-brand-primary/10 group">
                  <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                  <button type="button" onClick={() => setGallery(gallery.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {gallery.length < 4 && (
                <div onClick={() => galleryInputRef.current?.click()} className="relative aspect-square rounded-xl border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer flex flex-col items-center justify-center bg-white">
                  <Plus size={24} className="text-brand-muted/40" />
                  <span className="text-[10px] text-brand-muted/60 mt-2 font-sans font-bold">Agregar</span>
                </div>
              )}
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Ingredientes</label>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input value={ing} onChange={(e) => updateIngredient(i, e.target.value)} placeholder={`Ingrediente ${i + 1}`}
                  className="flex-1 px-4 py-2.5 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors" />
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(i)} className="p-2 text-brand-muted hover:text-red-500 transition-colors"><X size={16} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="flex items-center gap-1.5 text-xs font-sans text-brand-accent hover:text-brand-primary transition-colors">
              <Plus size={14} /> Agregar ingrediente
            </button>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">Preparación</label>
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="shrink-0 text-[10px] font-bold text-brand-accent mt-3 w-6">{String(i + 1).padStart(2, "0")}</span>
                <textarea value={step} onChange={(e) => updateStep(i, e.target.value)} rows={2}
                  className="flex-1 px-4 py-2.5 border border-brand-primary/10 rounded-lg bg-white text-brand-primary font-sans text-sm leading-relaxed focus:outline-none focus:border-brand-accent transition-colors resize-none" />
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="p-2 text-brand-muted hover:text-red-500 transition-colors mt-1"><X size={16} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs font-sans text-brand-accent hover:text-brand-primary transition-colors">
              <Plus size={14} /> Agregar paso
            </button>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-brand-primary/5">
            <button type="submit" disabled={saving || uploading}
              className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-4 rounded-xl text-sm font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-primary transition-colors disabled:opacity-60">
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
