"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Loader2, Save, Upload } from "lucide-react";
import { uploadCmsImageFile } from "@/lib/cms-upload-image";

type SocialIcon = "instagram" | "tiktok" | "youtube";

interface ContactConfig {
  hero: {
    backgroundColor: string;
    photoSrc: string;
    photoAlt: string;
    eyebrow: string;
    titleLine1: string;
    titleHighlight: string;
    bioPrimary: string;
    bioSecondary: string;
    pills: string[];
  };
  about: {
    eyebrow: string;
    titleLine1: string;
    titleHighlight: string;
    description: string;
    reasons: { num: string; title: string; body: string }[];
  };
  contact: {
    backgroundColor: string;
    eyebrow: string;
    titleLine1: string;
    titleHighlight: string;
    description: string;
    email: string;
    emailCaption: string;
    socials: { name: string; handle: string; url: string; icon: SocialIcon }[];
  };
}

const DEFAULT_CONFIG: ContactConfig = {
  hero: {
    backgroundColor: "#1D1D1B",
    photoSrc: "/images/bricia-contacto-original.jpg",
    photoAlt: "Bricia Elizalde",
    eyebrow: "Quién soy",
    titleLine1: "Hola,",
    titleHighlight: "soy Bricia",
    bioPrimary: "Soy arquitecta e interiorista de profesión, pero cocinera de corazón.",
    bioSecondary:
      "Desde hace años he encontrado en el diseño una forma de transformar espacios, y en la cocina una manera de crear momentos.",
    pills: ["Arquitecta", "Interiorista", "Cocina con intención", "Decoración", "Estética del hogar"],
  },
  about: {
    eyebrow: "Por qué BRICIA",
    titleLine1: "Donde el diseño",
    titleHighlight: "llega a la mesa",
    description:
      "BRICIA nace de esa conexión entre dos pasiones: el amor por los detalles, la estética y la calidez del hogar, llevados también a la mesa.",
    reasons: [
      { num: "01", title: "Cocina cotidiana con intención", body: "" },
      { num: "02", title: "El ojo de la interiorista", body: "" },
      { num: "03", title: "Cocina y hogar, inseparables", body: "" },
    ],
  },
  contact: {
    backgroundColor: "#1D1D1B",
    eyebrow: "Conectemos",
    titleLine1: "Hablemos de",
    titleHighlight: "sobremesa",
    description: "",
    email: "briciaelizaldes@gmail.com",
    emailCaption: "Respondo con mucho cariño ✦",
    socials: [
      { name: "Instagram", handle: "@briciaelizalde", url: "", icon: "instagram" },
      { name: "TikTok", handle: "@bricia.elizalde", url: "", icon: "tiktok" },
      { name: "YouTube", handle: "@briciaelizaldes", url: "", icon: "youtube" },
    ],
  },
};

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminContactoPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ContactConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") {
      router.push("/admin");
      setLoading(false);
      return;
    }

    fetch("/api/contact", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setConfig({
            hero: { ...DEFAULT_CONFIG.hero, ...(data.hero ?? {}) },
            about: { ...DEFAULT_CONFIG.about, ...(data.about ?? {}) },
            contact: { ...DEFAULT_CONFIG.contact, ...(data.contact ?? {}) },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const setHero = (patch: Partial<ContactConfig["hero"]>) => {
    setConfig((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  };

  const setContact = (patch: Partial<ContactConfig["contact"]>) => {
    setConfig((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const safeName = sanitizeFileName(file.name || `contact-${Date.now()}.jpg`);
      const path = await uploadCmsImageFile(file, `bricia/images/contact/${Date.now()}-${safeName}`);
      if (path) setHero({ photoSrc: path });
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
    try {
      const res = await fetch("/api/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al guardar");
      }
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-sans text-brand-muted hover:text-brand-accent">
          <ArrowLeft size={14} /> Volver al panel
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif text-brand-primary">Personalizar Contacto</h1>
          <Link href="/contacto" target="_blank" className="text-xs font-sans text-brand-accent hover:text-brand-primary flex items-center gap-2">
            <Eye size={14} /> Ver página
          </Link>
        </div>

        <section className="bg-white rounded-2xl border border-brand-primary/5 p-8 space-y-6">
          <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">Hero principal</h2>

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <div className="space-y-3">
              <div
                className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-dashed border-brand-primary/10 hover:border-brand-accent/40 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image src={config.hero.photoSrc} alt={config.hero.photoAlt} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-sans font-bold opacity-0 hover:opacity-100">Cambiar foto</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.currentTarget.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border border-brand-primary/10 rounded-lg py-2 text-xs font-sans font-bold tracking-[0.12em] uppercase hover:border-brand-accent hover:text-brand-accent"
              >
                <Upload size={14} /> Subir imagen
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Alt de imagen">
                <input value={config.hero.photoAlt} onChange={(e) => setHero({ photoAlt: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Eyebrow">
                <input value={config.hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Título línea 1">
                  <input value={config.hero.titleLine1} onChange={(e) => setHero({ titleLine1: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Título destacado">
                  <input value={config.hero.titleHighlight} onChange={(e) => setHero({ titleHighlight: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="Texto principal">
                <textarea value={config.hero.bioPrimary} onChange={(e) => setHero({ bioPrimary: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Texto secundario">
                <textarea value={config.hero.bioSecondary} onChange={(e) => setHero({ bioSecondary: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Pills (una por línea)">
                <textarea
                  value={config.hero.pills.join("\n")}
                  onChange={(e) => setHero({ pills: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })}
                  rows={5}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-brand-primary/5 p-8 space-y-4">
          <h2 className="text-lg font-serif text-brand-primary border-b border-brand-primary/5 pb-4">Bloque de contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email">
              <input value={config.contact.email} onChange={(e) => setContact({ email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Texto debajo del email">
              <input value={config.contact.emailCaption} onChange={(e) => setContact({ emailCaption: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </section>

        <div className="sticky bottom-6">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full bg-brand-primary text-brand-secondary py-4 rounded-xl text-sm font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving || uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Guardando..." : uploading ? "Subiendo imagen..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-brand-secondary text-brand-primary font-sans text-sm focus:outline-none focus:border-brand-accent transition-colors";
