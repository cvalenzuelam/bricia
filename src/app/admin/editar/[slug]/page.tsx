"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Upload, Plus, X, Loader2, Save } from "lucide-react";

const CATEGORIES = ["PRIMAVERA", "VERANO", "OTOÑO", "INVIERNO", "POSTRES"];
const REQUEST_TIMEOUT_MS = 20000;
const FRONT_SYNC_TIMEOUT_MS = 60000;
const FRONT_SYNC_INTERVAL_MS = 2500;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_SIDE = 2200;

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

async function compressImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(imageBitmap.width, imageBitmap.height));
  const targetWidth = Math.max(1, Math.round(imageBitmap.width * scale));
  const targetHeight = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  const qualitySteps = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48];
  for (const quality of qualitySteps) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) continue;
    if (blob.size <= MAX_UPLOAD_BYTES) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
    }
  }

  const lastBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.42)
  );
  if (!lastBlob) return file;
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return new File([lastBlob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function waitForRecipeUpdateInApi(
  slug: string,
  expected: { title: string; image: string },
  timeoutMs = FRONT_SYNC_TIMEOUT_MS
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetchWithTimeout(`/api/recipes/${slug}?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const recipe = await res.json();
        if (recipe?.title === expected.title && recipe?.image === expected.image) {
          return true;
        }
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, FRONT_SYNC_INTERVAL_MS));
  }

  return false;
}

async function waitForRecipeTitleInFrontend(
  slug: string,
  expectedTitle: string,
  timeoutMs = FRONT_SYNC_TIMEOUT_MS
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetchWithTimeout(`/recetas/${slug}?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const html = await res.text();
        if (html.includes(expectedTitle)) {
          return true;
        }
      }
    } catch {
      // keep polling
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
    const originalFile = input.files?.[0];
    if (!originalFile) return;
    try {
      setUploading(true);
      const file = await compressImageForUpload(originalFile);
      if (file.size > MAX_UPLOAD_BYTES) {
        alert("La imagen sigue siendo muy pesada. Intenta con una versión más ligera.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const uploadPromise = (async () => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetchWithTimeout("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          alert(data?.error || "Error al subir imagen");
          return null;
        }
        return (data?.path as string | undefined) || null;
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
          const file = await compressImageForUpload(files[i]);
          if (file.size > MAX_UPLOAD_BYTES) {
            alert(`La imagen ${i + 1} es demasiado pesada incluso comprimida. Omítela o redúcela.`);
            continue;
          }
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetchWithTimeout("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.path) uploadedPaths.push(data.path);
          else alert(data.error || "Error al subir imagen");
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

    const recipe = {
      ...form,
      image: mainImagePath,
      gallery,
      ingredients: ingredients.filter((i) => i.trim() !== ""),
      steps: steps.filter((s) => s.trim() !== ""),
    };

    try {
      const res = await fetchWithTimeout(`/api/recipes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (res.ok) {
        setPublishing(true);
        setPublishMessage("Validando guardado en el CMS...");
        const syncedInApi = await waitForRecipeUpdateInApi(slug, {
          title: recipe.title,
          image: recipe.image,
        });

        if (!syncedInApi) {
          alert("Se guardó, pero no se pudo confirmar sincronización en CMS. Intenta refrescar.");
          return;
        }

        setPublishMessage("Esperando que los cambios se reflejen en el front...");
        const reflectedInFrontend = await waitForRecipeTitleInFrontend(slug, recipe.title);
        if (!reflectedInFrontend) {
          alert("Se guardó en CMS, pero el front tardó demasiado en reflejar cambios.");
          return;
        }

        router.push("/admin");
      } else {
        alert("Error al actualizar la receta");
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
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-accent" />
      </div>
    );
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
              No cierres ni salgas de esta pantalla hasta terminar.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Volver al panel
        </Link>

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
