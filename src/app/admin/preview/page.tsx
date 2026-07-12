"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Save, Upload } from "lucide-react";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";
import { PHOTO_IMAGE_QUALITY } from "@/lib/image-quality";
import { shouldUnoptimizeRemoteImage } from "@/lib/next-image-remote";
import {
  DEFAULT_SITE_METADATA,
  type SiteMetadataConfig,
} from "@/data/site-metadata-types";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPreviewPage() {
  const router = useRouter();
  const [config, setConfig] = useState<SiteMetadataConfig>(DEFAULT_SITE_METADATA);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadConfig = useCallback(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") {
      router.push("/admin");
      return;
    }
    setLoading(true);
    setLoadError(false);
    fetch("/api/site-metadata", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("fetch");
        const data = await res.json();
        if (data && typeof data === "object") {
          setConfig({
            ...DEFAULT_SITE_METADATA,
            ...data,
          });
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const patch = (next: Partial<SiteMetadataConfig>) => {
    setConfig((prev) => ({ ...prev, ...next }));
    setSavedOk(false);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setSavedOk(false);
    try {
      const safeName = sanitizeFileName(file.name || `og-preview-${Date.now()}.jpg`);
      const path = await uploadCmsImageFile(file, `bricia/images/og/${Date.now()}-${safeName}`);
      if (path) patch({ ogImageSrc: path });
      else alert("No se pudo subir la imagen");
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedOk(false);
    try {
      const res = await fetch("/api/site-metadata", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al guardar");
        return;
      }
      setSavedOk(true);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminCmsLoading message="Cargando preview del link…" />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center gap-4 px-6 pt-20">
        <p className="text-sm font-sans text-brand-primary text-center max-w-md">
          No se pudo cargar la configuración del preview. Revisa la conexión o inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => loadConfig()}
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

  const hasImage = Boolean(config.ogImageSrc);

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted hover:text-brand-accent">
          <ArrowLeft size={14} /> Volver al panel
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-serif text-brand-primary">Preview del link</h1>
          <p className="text-sm font-sans text-brand-muted max-w-xl">
            Esta es la imagen y el texto que aparecen cuando alguien comparte{" "}
            <span className="text-brand-primary">casabricia.com</span> por WhatsApp, Instagram o Facebook.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-brand-primary/5 p-8 space-y-6">
          <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">
            Imagen del preview
          </h2>

          <p className="text-xs font-sans text-brand-muted leading-relaxed">
            Ideal: <strong className="font-semibold text-brand-primary">1200 × 630 px</strong>, JPG o PNG,
            menos de 1 MB. Evita fotos muy pesadas: WhatsApp no las muestra.
          </p>

          <div
            className="relative aspect-[1.91/1] w-full rounded-xl overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 cursor-pointer bg-brand-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            {hasImage ? (
              <Image
                src={config.ogImageSrc}
                alt={config.ogImageAlt || "Preview"}
                fill
                quality={PHOTO_IMAGE_QUALITY}
                unoptimized={shouldUnoptimizeRemoteImage(config.ogImageSrc)}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand-muted">
                <Upload size={28} strokeWidth={1.5} />
                <span className="text-xs font-sans font-bold tracking-[0.12em] uppercase">
                  Subir imagen
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUpload(e.currentTarget.files?.[0])}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 border border-brand-primary/10 rounded-lg px-4 py-2.5 text-xs font-sans font-bold tracking-[0.12em] uppercase hover:border-brand-accent hover:text-brand-accent disabled:opacity-60"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Subiendo…" : hasImage ? "Cambiar imagen" : "Subir imagen"}
            </button>
            {hasImage && config.ogImageSrc !== DEFAULT_SITE_METADATA.ogImageSrc && (
              <button
                type="button"
                onClick={() => patch({ ogImageSrc: DEFAULT_SITE_METADATA.ogImageSrc })}
                className="text-xs font-sans text-brand-muted hover:text-brand-accent px-2"
              >
                Restaurar imagen por defecto
              </button>
            )}
          </div>

          <Field label="Texto alternativo (alt)">
            <input
              value={config.ogImageAlt}
              onChange={(e) => patch({ ogImageAlt: e.target.value })}
              className={inputClass}
              placeholder="Bricia | Recetas con Historias"
            />
          </Field>
        </section>

        <section className="bg-white rounded-2xl border border-brand-primary/5 p-8 space-y-4">
          <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">
            Título y descripción
          </h2>
          <Field label="Título">
            <input
              value={config.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={inputClass}
              maxLength={70}
            />
          </Field>
          <Field label="Descripción">
            <textarea
              value={config.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              maxLength={200}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </section>

        {hasImage && (
          <section className="bg-white rounded-2xl border border-brand-primary/5 p-6 space-y-3">
            <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted">
              Vista aproximada (WhatsApp)
            </p>
            <div className="rounded-lg overflow-hidden border border-black/10 bg-[#111b21] max-w-sm">
              <div className="relative aspect-[1.91/1] bg-black/20">
                <Image
                  src={config.ogImageSrc}
                  alt=""
                  fill
                  quality={PHOTO_IMAGE_QUALITY}
                  unoptimized={shouldUnoptimizeRemoteImage(config.ogImageSrc)}
                  className="object-cover"
                />
              </div>
              <div className="px-3 py-2 space-y-0.5">
                <p className="text-[13px] font-sans font-semibold text-white leading-snug line-clamp-2">
                  {config.title}
                </p>
                <p className="text-[12px] font-sans text-white/60 line-clamp-2">
                  {config.description}
                </p>
                <p className="text-[11px] font-sans text-white/40 uppercase tracking-wide">
                  casabricia.com
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="sticky bottom-6 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full bg-brand-primary text-brand-secondary py-4 rounded-xl text-sm font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving || uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Guardar cambios"}
          </button>
          {savedOk && (
            <p className="text-center text-xs font-sans text-brand-muted">
              Guardado. Después del deploy, si WhatsApp sigue mostrando lo viejo, refresca el cache en{" "}
              <a
                href="https://www.opengraph.xyz/url/https%3A%2F%2Fcasabricia.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-accent inline-flex items-center gap-1 hover:underline"
              >
                opengraph.xyz <ExternalLink size={10} />
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors";
