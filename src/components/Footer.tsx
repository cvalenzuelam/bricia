"use client";

import Link from "next/link";
import { Mail, ArrowUp } from "lucide-react";

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-brand-secondary border-t border-brand-primary/5 pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto flex flex-col items-center space-y-20">
        
        {/* Symmetrical Navigation Links */}
        <div className="flex flex-wrap justify-center gap-12 text-xs font-sans font-bold tracking-[0.3em] text-brand-primary/60 uppercase">
          <Link href="/recetas" className="hover:text-brand-accent transition-colors">RECETAS</Link>
          <Link href="/cuentos" className="hover:text-brand-accent transition-colors">CUENTOS</Link>
          <Link href="/productos" className="hover:text-brand-accent transition-colors">TIENDA</Link>
          <Link href="/contacto" className="hover:text-brand-accent transition-colors">CONTACTO</Link>
        </div>

        {/* Centered Large Branding */}
        <div className="text-center space-y-6">
          <h4 className="text-4xl md:text-6xl tracking-[0.2em] text-brand-primary uppercase" style={{ fontFamily: 'var(--font-aboreto)' }}>|BRICIA|</h4>
          <p className="text-lg font-serif italic text-brand-accent leading-relaxed max-w-lg mx-auto">
            Cocina con amor, historias que alimentan. <br /> Una invitación a conectar a través de los sabores.
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex flex-col items-center gap-10">
          <div className="flex items-center gap-8">
            <a href="https://www.instagram.com/briciaelizalde/" target="_blank" rel="noopener noreferrer"
              className="text-brand-primary/50 hover:text-brand-accent transition-all hover:scale-110" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://www.tiktok.com/@bricia.elizalde" target="_blank" rel="noopener noreferrer"
              className="text-brand-primary/50 hover:text-brand-accent transition-all hover:scale-110" aria-label="TikTok">
              <TikTokIcon />
            </a>
            <a href="https://www.youtube.com/@briciaelizaldes" target="_blank" rel="noopener noreferrer"
              className="text-brand-primary/50 hover:text-brand-accent transition-all hover:scale-110" aria-label="YouTube">
              <YouTubeIcon />
            </a>
            <a href="mailto:briciaelizaldes@gmail.com"
              className="text-brand-primary/50 hover:text-brand-accent transition-all hover:scale-110" aria-label="Correo electrónico">
              <Mail size={22} strokeWidth={1.5} />
            </a>
          </div>
          
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
