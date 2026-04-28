"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";
import { ArrowLeft, Save, Upload, Loader2, Eye } from "lucide-react";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";

const FONT_OPTIONS = [
  { value: "serif", label: "Playfair Display (Serif)" },
  { value: "sans", label: "Inter (Sans)" },
  { value: "aboreto", label: "Aboreto (Logo)" },
];
const REQUEST_TIMEOUT_MS = 20000;
const FRONT_SYNC_TIMEOUT_MS = 60000;
const FRONT_SYNC_INTERVAL_MS = 2500;

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

interface CollageImage {
  src: string;
  alt: string;
}

interface ProductItem {
  name: string;
  price: string;
  image: string;
  link: string;
}

interface FeaturedSectionConfig {
  imageSrc: string;
  imageAlt: string;
  panelBackgroundColor: string;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  titleFont: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
}

const DEFAULT_FEATURED_SECTION: FeaturedSectionConfig = {
  imageSrc: "/images/tiradito.png",
  imageAlt: "Nuevas recetas cada semana",
  panelBackgroundColor: "#8B7355",
  heading: "Nuevas Recetas\nCada Semana",
  description:
    "Descubre recetas que tocan el corazón y despiertan tus sentidos. Cada semana traemos algo nuevo para que disfrutes en tu cocina. ¡Explora y déjate inspirar!",
  ctaText: "Ver Recetas",
  ctaHref: "/recetas",
  titleFont: "serif",
  buttonBackgroundColor: "#FFFFFF",
  buttonTextColor: "#8B7355",
};

interface HeroConfig {
  title: string;
  titleColor: string;
  titleFont: string;
  logo: string;
  logoColor: string;
  logoFont: string;
  tagline: string;
  taglineItalic: boolean;
  description: string;
  ctaText: string;
  collageImages: CollageImage[];
  instagramImages: { src: string }[];
  products: ProductItem[];
  backgroundColor: string;
  featuredSection: FeaturedSectionConfig;
  /** Slugs de recetas en orden: grid inicial del landing (sin filtro). */
  landingRecipeSlugs: string[];
}

const DEFAULT_LANDING_RECIPE_SLUGS = [
  "tiradito-atun-salsa-serrano",
  "ensalada-primavera-fresas",
  "gazpacho-verano-fresco",
  "volcan-chocolate-decadente",
] as const;

const LANDING_RECIPE_SLOTS = 4;

export default function AdminInicioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saved, setSaved] = useState(false);
  const landingInputRef = useRef<HTMLInputElement | null>(null);
  const featuredInputRef = useRef<HTMLInputElement | null>(null);
  const igInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const productInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [cmsRecipes, setCmsRecipes] = useState<{ slug: string; title: string }[]>([]);
  const [config, setConfig] = useState<HeroConfig>({
    title: "",
    titleColor: "#5C3D2E",
    titleFont: "serif",
    logo: "|BRICIA|",
    logoColor: "#1D1D1B",
    logoFont: "aboreto",
    tagline: "",
    taglineItalic: true,
    description: "",
    ctaText: "",
    collageImages: [],
    instagramImages: [],
    products: [],
    backgroundColor: "#FAF9F4",
    featuredSection: { ...DEFAULT_FEATURED_SECTION },
    landingRecipeSlugs: [...DEFAULT_LANDING_RECIPE_SLUGS],
  });

  const loadHero = useCallback(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") {
      router.push("/admin");
      return;
    }
    setLoading(true);
    setLoadError(false);
    fetch("/api/hero", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch");
        const data = await res.json();
        setConfig({
          ...data,
          featuredSection: {
            ...DEFAULT_FEATURED_SECTION,
            ...(data.featuredSection && typeof data.featuredSection === "object"
              ? data.featuredSection
              : {}),
          },
          landingRecipeSlugs: Array.isArray(data.landingRecipeSlugs)
            ? (data.landingRecipeSlugs as unknown[])
                .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
                .map((s) => s.trim())
            : [...DEFAULT_LANDING_RECIPE_SLUGS],
        });
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadHero();
  }, [loadHero]);

  useEffect(() => {
    fetch("/api/recipes", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        const list = data
          .map((item: unknown) => {
            if (!item || typeof item !== "object") return null;
            const o = item as Record<string, unknown>;
            const slug = typeof o.slug === "string" ? o.slug : "";
            const title = typeof o.title === "string" ? o.title : slug;
            if (!slug) return null;
            return { slug, title };
          })
          .filter((x): x is { slug: string; title: string } => x !== null);
        list.sort((a, b) => a.title.localeCompare(b.title, "es"));
        setCmsRecipes(list);
      })
      .catch(() => {});
  }, []);

  const landingRecipeRow = useMemo(() => {
    const base = [...(config.landingRecipeSlugs ?? [])];
    const row = [...base];
    while (row.length < LANDING_RECIPE_SLOTS) row.push("");
    return row.slice(0, LANDING_RECIPE_SLOTS);
  }, [config.landingRecipeSlugs]);

  const setLandingSlot = (index: number, slug: string) => {
    const row = [...landingRecipeRow];
    row[index] = slug;
    setConfig({
      ...config,
      landingRecipeSlugs: row.filter((s) => typeof s === "string" && s.trim().length > 0),
    });
  };

  useEffect(() => {
    if (!saving && !uploading && !publishing) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saving, uploading, publishing]);

  const waitForHeroUpdateInApi = async (expected: HeroConfig) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < FRONT_SYNC_TIMEOUT_MS) {
      try {
        const res = await fetchWithTimeout(`/api/hero?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const current = await res.json();
          const sameMainImage =
            (current?.collageImages?.[0]?.src || "") ===
            (expected.collageImages?.[0]?.src || "");
          if (sameMainImage && current?.title === expected.title) return true;
        }
      } catch {
        // keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, FRONT_SYNC_INTERVAL_MS));
    }
    return false;
  };

  const waitForHeroUpdateInFrontend = async (expected: HeroConfig) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < FRONT_SYNC_TIMEOUT_MS) {
      try {
        const res = await fetchWithTimeout(`/?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const html = await res.text();
          const hasTitle = html.includes(expected.title);
          const hasImage = html.includes(expected.collageImages?.[0]?.src || "");
          if (hasTitle && hasImage) return true;
        }
      } catch {
        // keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, FRONT_SYNC_INTERVAL_MS));
    }
    return false;
  };

  const uploadCmsImage = async (
    file: File,
    section: "collage" | "instagram" | "products" | "featured"
  ) => {
    const safeName = sanitizeFileName(file.name || `image-${Date.now()}.jpg`);
    const pathname = `bricia/images/home/${section}/${Date.now()}-${safeName}`;
    return uploadCmsImageFile(file, pathname);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...config,
        featuredSection: {
          ...DEFAULT_FEATURED_SECTION,
          ...(config.featuredSection || {}),
        },
      };
      const res = await fetchWithTimeout("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al guardar cambios");
        return;
      }

      setPublishing(true);
      setPublishMessage("Validando guardado en el CMS...");
      const syncedInApi = await waitForHeroUpdateInApi(config);
      if (!syncedInApi) {
        alert("Se guardó, pero no se pudo confirmar sincronización en CMS. Intenta refrescar.");
        return;
      }

      setPublishMessage("Esperando que los cambios se reflejen en el front...");
      const reflectedInFrontend = await waitForHeroUpdateInFrontend(config);
      if (!reflectedInFrontend) {
        alert("Se guardó en CMS, pero el front tardó demasiado en reflejar cambios.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("La petición tardó demasiado. Revisa conexión y vuelve a intentar.");
    } finally {
      setPublishing(false);
      setPublishMessage("");
      setSaving(false);
    }
  };

  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const path = await uploadCmsImage(file, "featured");
      if (path) {
        setConfig({
          ...config,
          featuredSection: {
            ...config.featuredSection,
            imageSrc: path,
          },
        });
      } else {
        alert("Error al subir imagen");
      }
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const updateFeatured = <K extends keyof FeaturedSectionConfig>(
    field: K,
    value: FeaturedSectionConfig[K]
  ) => {
    setConfig({
      ...config,
      featuredSection: { ...config.featuredSection, [field]: value },
    });
  };

  const handleLandingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const path = await uploadCmsImage(file, "collage");
      if (path) {
        const updated = [...(config.collageImages || [])];
        if (updated.length === 0) {
          updated.push({ src: path, alt: "Foto principal de landing" });
        } else {
          updated[0] = { ...updated[0], src: path };
        }
        setConfig({ ...config, collageImages: updated });
      } else {
        alert("Error al subir imagen");
      }
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const updateLandingAlt = (alt: string) => {
    const updated = [...(config.collageImages || [])];
    if (updated.length === 0) {
      updated.push({ src: "", alt });
    } else {
      updated[0] = { ...updated[0], alt };
    }
    setConfig({ ...config, collageImages: updated });
  };

  const handleIgUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const path = await uploadCmsImage(file, "instagram");

      if (path) {
        const updated = [...(config.instagramImages || [])];
        updated[index] = { src: path };
        setConfig({ ...config, instagramImages: updated });
      } else {
        alert("Error al subir imagen");
      }
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const handleProductUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const path = await uploadCmsImage(file, "products");

      if (path) {
        const updated = [...(config.products || [])];
        updated[index] = { ...updated[index], image: path };
        setConfig({ ...config, products: updated });
      } else {
        alert("Error al subir imagen");
      }
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
    const updated = [...(config.products || [])];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, products: updated });
  };

  const landingImage = config.collageImages?.[0] || { src: "", alt: "Foto principal de landing" };

  if (loading) {
    return <AdminCmsLoading message="Cargando inicio desde el CMS…" />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center gap-4 px-6 pt-20">
        <p className="text-sm font-sans text-brand-primary text-center max-w-md">
          No se pudo cargar la configuración del inicio. Revisa la conexión o inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => loadHero()}
          className="bg-brand-primary text-brand-secondary px-6 py-3 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent transition-colors"
        >
          Reintentar
        </button>
        <Link href="/admin" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
          ← Volver al panel
        </Link>
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
              {publishMessage || (uploading ? "Subiendo imagen..." : "Guardando configuración...")}
            </p>
            <p className="text-[11px] font-sans text-brand-muted/80">
              No cierres ni salgas de esta pantalla hasta terminar.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Top nav */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors mb-8">
          <ArrowLeft size={14} /> Volver al panel
        </Link>

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-serif text-brand-primary">Personalizar Inicio</h1>
          <Link href="/" target="_blank" className="flex items-center gap-2 text-xs font-sans text-brand-accent hover:text-brand-primary transition-colors">
            <Eye size={14} /> Ver sitio
          </Link>
        </div>

        <div className="space-y-12">

          {/* ─── TEXTOS ──────────────────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">📝 Textos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Título Principal</label>
                <input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-serif focus:outline-none focus:border-brand-accent transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Logo</label>
                <input value={config.logo} onChange={(e) => setConfig({ ...config, logo: e.target.value })}
                  className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary text-center text-xl tracking-[0.2em] focus:outline-none focus:border-brand-accent transition-colors"
                  style={{ fontFamily: 'var(--font-aboreto)' }} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Frase Principal (Tagline)</label>
              <div className="flex gap-3 items-center">
                <input value={config.tagline} onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="flex-1 px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-serif focus:outline-none focus:border-brand-accent transition-colors" />
                <label className="flex items-center gap-2 text-xs font-sans text-brand-muted cursor-pointer shrink-0">
                  <input type="checkbox" checked={config.taglineItalic} onChange={(e) => setConfig({ ...config, taglineItalic: e.target.checked })}
                    className="accent-brand-accent" /> Cursiva
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Descripción</label>
              <textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} rows={3}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm leading-relaxed focus:outline-none focus:border-brand-accent transition-colors resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Texto del CTA</label>
              <input value={config.ctaText} onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors" />
            </div>
          </div>

          {/* ─── COLORES & FUENTES ────────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">🎨 Colores y Fuentes</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {/* Title Color */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Color del Título</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.titleColor} onChange={(e) => setConfig({ ...config, titleColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-brand-primary/10" />
                  <input value={config.titleColor} onChange={(e) => setConfig({ ...config, titleColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-mono text-xs focus:outline-none focus:border-brand-accent" />
                </div>
              </div>

              {/* Logo Color */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Color del Logo</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.logoColor} onChange={(e) => setConfig({ ...config, logoColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-brand-primary/10" />
                  <input value={config.logoColor} onChange={(e) => setConfig({ ...config, logoColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-mono text-xs focus:outline-none focus:border-brand-accent" />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Fondo</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.backgroundColor} onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-brand-primary/10" />
                  <input value={config.backgroundColor} onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-mono text-xs focus:outline-none focus:border-brand-accent" />
                </div>
              </div>

              {/* Title Font */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Fuente del Título</label>
                <select value={config.titleFont} onChange={(e) => setConfig({ ...config, titleFont: e.target.value })}
                  className="w-full px-3 py-2.5 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent">
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Logo Font */}
              <div className="space-y-2">
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">Fuente del Logo</label>
                <select value={config.logoFont} onChange={(e) => setConfig({ ...config, logoFont: e.target.value })}
                  className="w-full px-3 py-2.5 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent">
                  {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ─── FOTO DE LANDING ──────────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/5 pb-4">
              <h2 className="text-lg font-serif text-brand-primary">📸 Foto de Landing</h2>
            </div>
            <p className="text-xs font-sans text-brand-muted">
              Esta foto reemplaza el collage del landing. Puedes cambiarla cuando quieras.
            </p>

            <div className="max-w-sm space-y-2">
              <div
                className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer bg-brand-secondary group"
                onClick={() => landingInputRef.current?.click()}
              >
                {landingImage.src ? (
                  <Image src={landingImage.src} alt={landingImage.alt} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Upload size={24} className="text-brand-muted/30 group-hover:text-brand-accent transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-sans font-bold">Cambiar</span>
                </div>
              </div>

              <input
                value={landingImage.alt}
                onChange={(e) => updateLandingAlt(e.target.value)}
                placeholder="Descripción"
                className="w-full px-2 py-1.5 border border-brand-primary/10 rounded text-[11px] font-sans text-brand-muted focus:outline-none focus:border-brand-accent"
              />

              <input
                ref={landingInputRef}
                type="file"
                accept="image/*"
                onChange={handleLandingUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* ─── SECCIÓN DESTACADA (Nuevas recetas) ───────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <div className="border-b border-brand-primary/5 pb-4">
              <h2 className="text-lg font-serif text-brand-primary">
                ✨ Sección &quot;Nuevas recetas&quot; (debajo del hero)
              </h2>
              <p className="text-xs font-sans text-brand-muted mt-1">
                La franja dividida en imagen + texto que aparece en el inicio, antes del grid de recetas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted">
                  Imagen (lado izquierdo en escritorio)
                </p>
                <div
                  className="relative aspect-[4/5] max-w-sm rounded-xl overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer bg-brand-secondary group"
                  onClick={() => featuredInputRef.current?.click()}
                >
                  {(config.featuredSection?.imageSrc || DEFAULT_FEATURED_SECTION.imageSrc) ? (
                    <Image
                      src={config.featuredSection?.imageSrc || DEFAULT_FEATURED_SECTION.imageSrc}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[200px]">
                      <Upload size={24} className="text-brand-muted/30 group-hover:text-brand-accent transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-sans font-bold">Cambiar</span>
                  </div>
                </div>
                <input
                  ref={featuredInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedUpload}
                  className="hidden"
                />
                <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase block">
                  Texto alternativo (accesibilidad)
                </label>
                <input
                  value={config.featuredSection?.imageAlt ?? ""}
                  onChange={(e) => updateFeatured("imageAlt", e.target.value)}
                  className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm font-sans focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                    Fondo del panel de texto
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.featuredSection?.panelBackgroundColor ?? "#8B7355"}
                      onChange={(e) => updateFeatured("panelBackgroundColor", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-brand-primary/10"
                    />
                    <input
                      value={config.featuredSection?.panelBackgroundColor ?? "#8B7355"}
                      onChange={(e) => updateFeatured("panelBackgroundColor", e.target.value)}
                      className="flex-1 px-3 py-2 border border-brand-primary/10 rounded-lg bg-brand-secondary font-mono text-xs focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                    Título (una línea por renglón; Enter = nueva línea)
                  </label>
                  <textarea
                    rows={3}
                    value={config.featuredSection?.heading ?? ""}
                    onChange={(e) => updateFeatured("heading", e.target.value)}
                    className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary font-serif focus:outline-none focus:border-brand-accent resize-y min-h-[5rem]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                    Párrafo
                  </label>
                  <textarea
                    rows={4}
                    value={config.featuredSection?.description ?? ""}
                    onChange={(e) => updateFeatured("description", e.target.value)}
                    className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-sm font-sans leading-relaxed focus:outline-none focus:border-brand-accent resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                      Texto del botón
                    </label>
                    <input
                      value={config.featuredSection?.ctaText ?? ""}
                      onChange={(e) => updateFeatured("ctaText", e.target.value)}
                      className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                      Enlace del botón
                    </label>
                    <input
                      value={config.featuredSection?.ctaHref ?? ""}
                      onChange={(e) => updateFeatured("ctaHref", e.target.value)}
                      placeholder="/recetas"
                      className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm font-sans focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                    Fuente del título
                  </label>
                  <select
                    value={config.featuredSection?.titleFont ?? "serif"}
                    onChange={(e) => updateFeatured("titleFont", e.target.value)}
                    className="w-full px-3 py-2.5 border border-brand-primary/10 rounded-lg bg-brand-secondary text-sm focus:outline-none focus:border-brand-accent"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                      Fondo del botón
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.featuredSection?.buttonBackgroundColor ?? "#FFFFFF"}
                        onChange={(e) => updateFeatured("buttonBackgroundColor", e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-brand-primary/10"
                      />
                      <input
                        value={config.featuredSection?.buttonBackgroundColor ?? "#FFFFFF"}
                        onChange={(e) => updateFeatured("buttonBackgroundColor", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-brand-primary/10 rounded font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                      Texto del botón
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.featuredSection?.buttonTextColor ?? "#8B7355"}
                        onChange={(e) => updateFeatured("buttonTextColor", e.target.value)}
                        className="w-9 h-9 rounded cursor-pointer border border-brand-primary/10"
                      />
                      <input
                        value={config.featuredSection?.buttonTextColor ?? "#8B7355"}
                        onChange={(e) => updateFeatured("buttonTextColor", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-brand-primary/10 rounded font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RECETAS DESTACADAS (grid inicial del landing) ─── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <div className="border-b border-brand-primary/5 pb-4">
              <h2 className="text-lg font-serif text-brand-primary">
                🍽️ Recetas del inicio (antes de filtrar)
              </h2>
              <p className="text-xs font-sans text-brand-muted mt-1 max-w-2xl">
                Estas recetas son las que ves en la sección &quot;Recetas de Temporada&quot; del home cuando aún no eliges Primavera, Verano, etc.
                El orden aquí es el orden en la fila. Deja &quot;Ninguna&quot; en un hueco si quieres menos de cuatro.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {landingRecipeRow.map((slug, i) => (
                <div key={`landing-recipe-${i}`} className="space-y-1.5">
                  <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted">
                    Posición {i + 1}
                  </label>
                  <select
                    value={slug}
                    onChange={(e) => setLandingSlot(i, e.target.value)}
                    className="w-full px-3 py-2.5 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary text-sm font-sans focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">— Ninguna —</option>
                    {cmsRecipes.map((r) => (
                      <option key={r.slug} value={r.slug}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {cmsRecipes.length === 0 && (
              <p className="text-xs font-sans text-brand-muted italic">
                Cargando listado de recetas… Si no aparece nada, asegúrate de tener recetas publicadas.
              </p>
            )}
          </div>

          {/* ─── FOTOS DE INSTAGRAM ───────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <div className="border-b border-brand-primary/5 pb-4">
              <h2 className="text-lg font-serif text-brand-primary">📱 Fotos de Instagram</h2>
              <p className="text-xs font-sans text-brand-muted mt-1">Sube hasta 10 fotos para simular tu feed en la barra inferior. Recomendamos imágenes cuadradas o verticales (4:5).</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(config.instagramImages || []).map((img, i) => (
                <div key={`ig-${i}`} className="space-y-2">
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 transition-colors cursor-pointer bg-brand-secondary group"
                    onClick={() => igInputRefs.current[i]?.click()}
                  >
                    {img.src ? (
                      <Image src={img.src} alt="Instagram Post" fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Upload size={24} className="text-brand-muted/30 group-hover:text-brand-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-[10px] font-sans font-bold">Cambiar</span>
                    </div>
                  </div>
                  <input
                    ref={(el) => { igInputRefs.current[i] = el; }}
                    type="file" accept="image/*"
                    onChange={(e) => handleIgUpload(i, e)}
                    className="hidden"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ─── PRODUCTOS ───────────────────────── */}
          <div className="bg-white rounded-2xl p-8 border border-brand-primary/5 space-y-6">
            <div className="flex items-center justify-between border-b border-brand-primary/5 pb-4">
              <div>
                <h2 className="text-lg font-serif text-brand-primary">🛒 Tienda (Productos Destacados)</h2>
                <p className="text-xs font-sans text-brand-muted mt-1">Configura hasta 3 productos para mostrar en la página de inicio.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(config.products || []).map((product, i) => (
                <div key={`prod-${i}`} className="space-y-3 p-4 border border-brand-primary/10 rounded-xl bg-brand-secondary/30">
                  <div
                    className="relative aspect-[4/5] rounded-lg overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 bg-white cursor-pointer group transition-colors"
                    onClick={() => productInputRefs.current[i]?.click()}
                  >
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Upload size={24} className="text-brand-muted/30 group-hover:text-brand-accent transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-bold">Cambiar Foto</span>
                    </div>
                  </div>
                  <input
                    ref={(el) => { productInputRefs.current[i] = el; }}
                    type="file" accept="image/*"
                    onChange={(e) => handleProductUpload(i, e)}
                    className="hidden"
                  />
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider pl-1">Nombre del producto</label>
                      <input value={product.name || ""} onChange={(e) => updateProduct(i, 'name', e.target.value)} placeholder="Ej. Tabla de Mezquite"
                        className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all font-serif" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider pl-1">Precio</label>
                      <input value={product.price || ""} onChange={(e) => updateProduct(i, 'price', e.target.value)} placeholder="Ej. $850 MXN"
                        className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all font-sans text-brand-muted" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider pl-1">URL (Link)</label>
                      <input value={product.link || ""} onChange={(e) => updateProduct(i, 'link', e.target.value)} placeholder="https://..."
                        className="w-full px-3 py-2 border border-brand-primary/10 rounded-lg text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all font-sans text-brand-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── SAVE BUTTON ──────────────────────── */}
          <div className="sticky bottom-6 z-10">
            <button onClick={handleSave} disabled={saving || uploading || publishing}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-sans font-bold tracking-[0.15em] uppercase transition-all shadow-lg ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-brand-primary text-brand-secondary hover:bg-brand-accent"
              } disabled:opacity-60`}
            >
              {saving ? (
                <><Loader2 size={18} className="animate-spin" /> Guardando...</>
              ) : saved ? (
                "✓ Guardado con Éxito"
              ) : (
                <><Save size={18} /> Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
