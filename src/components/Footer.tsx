"use client";

import Link from "next/link";
import { ArrowUp, BookOpen, UtensilsCrossed, ShoppingBag, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteSocialIconRow } from "@/components/SiteSocialLinks";

const FOOTER_NAV: { href: string; label: string; hint: string; Icon: LucideIcon }[] = [
  { href: "/recetas", label: "RECETAS", hint: "Ideas para la mesa", Icon: BookOpen },
  { href: "/la-mesa", label: "LA MESA", hint: "Historias y encuentros", Icon: UtensilsCrossed },
  { href: "/productos", label: "TIENDA", hint: "Piezas y alacena", Icon: ShoppingBag },
  { href: "/contacto", label: "CONTACTO", hint: "Escribirnos", Icon: Mail },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-brand-secondary border-t border-brand-primary/5 pt-20 pb-16 px-6 md:pt-32">
      <div className="max-w-7xl mx-auto flex flex-col items-center space-y-14 md:space-y-20">

        <nav
          aria-label="Secciones principales"
          className="w-full max-w-2xl rounded-2xl border border-brand-primary/[0.08] bg-white/50 px-4 py-6 shadow-[0_1px_0_rgba(29,29,27,0.04)] backdrop-blur-[2px] md:px-6 md:py-7"
        >
          <p className="mb-5 text-center font-serif text-[11px] italic text-brand-muted/90 md:text-xs">
            Explora el sitio
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {FOOTER_NAV.map(({ href, label, hint, Icon }) => (
              <li key={href} className="min-w-0">
                <Link
                  href={href}
                  className="group flex flex-col items-center gap-2.5 rounded-xl px-2 py-4 text-center transition-all duration-300 hover:bg-brand-accent/[0.07] hover:shadow-[inset_0_0_0_1px_rgba(176,141,87,0.12)] md:px-3 md:py-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-primary/[0.09] bg-brand-secondary/80 text-brand-primary/45 transition-all duration-300 group-hover:border-brand-accent/40 group-hover:bg-white group-hover:text-brand-accent md:h-12 md:w-12">
                    <Icon size={20} strokeWidth={1.25} className="md:w-[22px] md:h-[22px]" aria-hidden />
                  </span>
                  <span className="text-[10px] font-sans font-bold tracking-[0.28em] text-brand-primary/70 transition-colors duration-300 group-hover:text-brand-primary md:text-[11px] md:tracking-[0.3em]">
                    {label}
                  </span>
                  <span className="hidden max-w-[9.5rem] font-serif text-[10px] leading-snug text-brand-muted/70 transition-colors group-hover:text-brand-muted md:block">
                    {hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Centered Large Branding */}
        <div className="text-center space-y-6">
          <h4 className="text-4xl md:text-6xl tracking-[0.2em] text-brand-primary uppercase" style={{ fontFamily: 'var(--font-aboreto)' }}>|BRICIA|</h4>
          <p className="text-lg font-serif italic text-brand-accent leading-relaxed max-w-lg mx-auto">
            Cocina con amor, historias que alimentan. <br /> Una invitación a conectar a través de los sabores.
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex flex-col items-center gap-10">
          <SiteSocialIconRow />
          
          <button onClick={scrollToTop}
            className="group flex flex-col items-center gap-2 editorial-spacing opacity-30 hover:opacity-100 transition-opacity">
            <ArrowUp size={16} strokeWidth={1.5} />
            HACIA ARRIBA
          </button>
        </div>

        {/* Legal & Final Signature */}
        <div className="w-full pt-16 border-t border-brand-primary/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-sans font-bold tracking-widest text-brand-muted uppercase">
            © 2026 BRICIA. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex gap-12 text-[10px] font-sans font-bold tracking-widest text-brand-muted uppercase">
            <Link href="/privacidad" className="hover:text-brand-primary">PRIVACIDAD</Link>
            <Link href="/terminos" className="hover:text-brand-primary">TÉRMINOS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
