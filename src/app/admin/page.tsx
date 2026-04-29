"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { shouldUnoptimizeRemoteImage } from "@/lib/next-image-remote";
import { Plus, Edit3, Trash2, Lock, ChefHat, LayoutList, ShoppingBag, Package, Mail, Home } from "lucide-react";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";

interface Recipe {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
}

const ADMIN_PASSWORD = "bricia2026";

export default function AdminPage() {
  // Same initial state on server and client avoids hydration mismatch; session is read after mount.
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  /** Primera carga desde /api/recipes tras autenticar; evita mostrar “0 recetas” o listas vacías previas al CMS */
  const [recipesHydrated, setRecipesHydrated] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem("bricia_admin") === "true");
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked || !authenticated) return;
    setRecipesHydrated(false);
    let cancelled = false;
    fetch("/api/recipes", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) setRecipes(data);
        else setRecipes([]);
      })
      .catch(() => {
        if (!cancelled) setRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setRecipesHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authChecked, authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem("bricia_admin", "true");
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Estas segura de que quieres eliminar esta receta?")) return;
    setDeleting(slug);
    await fetch(`/api/recipes/${slug}`, { method: "DELETE" });
    const res = await fetch("/api/recipes", { cache: "no-store" });
    const data = await res.json();
    setRecipes(Array.isArray(data) ? data : []);
    setDeleting(null);
  };

  if (!authChecked) {
    return <AdminCmsLoading message="Cargando panel…" submessage="" />;
  }

  if (authenticated && !recipesHydrated) {
    return <AdminCmsLoading message="Cargando recetas desde el CMS…" />;
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-brand-primary/5 rounded-full flex items-center justify-center mx-auto">
              <Lock size={24} className="text-brand-accent" />
            </div>
            <h1 className="text-3xl font-serif text-brand-primary">Panel de Bricia</h1>
            <p className="text-sm font-sans text-brand-muted">
              Ingresa tu contraseña para administrar las recetas
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 border border-brand-primary/10 rounded-lg bg-white text-brand-primary text-center text-lg font-sans tracking-widest focus:outline-none focus:border-brand-accent transition-colors"
            />
            {error && (
              <p className="text-red-500 text-xs font-sans">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-brand-primary text-brand-secondary py-3 rounded-lg text-xs font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors"
            >
              Entrar
            </button>
          </form>

          <Link href="/" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors block">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
                <ChefHat size={28} className="text-brand-accent" />
                Mis Recetas
              </h1>
              <p className="text-sm font-sans text-brand-muted">
                {recipes.length} recetas publicadas
              </p>
            </div>
            <Link href="/admin/nueva">
              <button className="flex items-center gap-2 bg-brand-primary text-brand-secondary px-6 py-3 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:bg-brand-accent transition-colors">
                <Plus size={16} />
                Nueva Receta
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/inicio">
              <button className="flex items-center gap-2 border border-brand-primary/10 text-brand-primary px-4 py-2.5 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:border-brand-accent hover:text-brand-accent transition-colors">
                <Home size={14} />
                Inicio
              </button>
            </Link>
            <Link href="/admin/mesa">
              <button className="flex items-center gap-2 border border-brand-primary/10 text-brand-primary px-4 py-2.5 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:border-brand-accent hover:text-brand-accent transition-colors">
                <LayoutList size={14} />
                La Mesa
              </button>
            </Link>
            <Link href="/admin/productos">
              <button className="flex items-center gap-2 border border-brand-primary/10 text-brand-primary px-4 py-2.5 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:border-brand-accent hover:text-brand-accent transition-colors">
                <ShoppingBag size={14} />
                Productos
              </button>
            </Link>
            <Link href="/admin/pedidos">
              <button className="flex items-center gap-2 border border-brand-primary/10 text-brand-primary px-4 py-2.5 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:border-brand-accent hover:text-brand-accent transition-colors">
                <Package size={14} />
                Pedidos
              </button>
            </Link>
            <Link href="/admin/contacto">
              <button className="flex items-center gap-2 border border-brand-primary/10 text-brand-primary px-4 py-2.5 rounded-lg text-xs font-sans font-bold tracking-[0.15em] uppercase hover:border-brand-accent hover:text-brand-accent transition-colors">
                <Mail size={14} />
                Contacto
              </button>
            </Link>
          </div>
        </div>

        {/* Recipe List */}
        <div className="space-y-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.slug}
              className="bg-white rounded-xl p-4 flex items-center gap-5 border border-brand-primary/5 hover:border-brand-accent/20 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-brand-secondary">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  sizes="80px"
                  unoptimized={shouldUnoptimizeRemoteImage(recipe.image)}
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-sans font-bold tracking-[0.25em] text-brand-accent uppercase">
                  {recipe.category}
                </span>
                <h3 className="text-lg font-serif text-brand-primary truncate">
                  {recipe.title}
                </h3>
                <p className="text-xs font-sans text-brand-muted truncate">
                  {recipe.subtitle}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/editar/${recipe.slug}`}>
                  <button className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 transition-all">
                    <Edit3 size={16} />
                  </button>
                </Link>
                <button
                  onClick={() => handleDelete(recipe.slug)}
                  disabled={deleting === recipe.slug}
                  className="p-2.5 rounded-lg border border-brand-primary/10 text-brand-muted hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-brand-primary/5 flex justify-between items-center">
          <Link href="/" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors">
            ← Volver al sitio
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem("bricia_admin");
              setAuthenticated(false);
            }}
            className="text-xs font-sans text-brand-muted hover:text-red-500 transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );
}

