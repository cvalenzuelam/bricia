import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const socials = [
  {
    name: "Instagram",
    handle: "@briciaelizalde",
    url: "https://www.instagram.com/briciaelizalde/",
    icon: <InstagramIcon />,
    description: "Recetas en tiempo real, detrás de cámaras y momentos del día a día en la cocina.",
  },
  {
    name: "TikTok",
    handle: "@bricia.elizalde",
    url: "https://www.tiktok.com/@bricia.elizalde",
    icon: <TikTokIcon />,
    description: "Videos cortos con tips rápidos, recetas express y mucha buena vibra culinaria.",
  },
  {
    name: "YouTube",
    handle: "@briciaelizaldes",
    url: "https://www.youtube.com/@briciaelizaldes",
    icon: <YouTubeIcon />,
    description: "Recetas completas paso a paso, con la historia y los detalles que las hacen especiales.",
  },
];

export default function ContactPage() {
  return (
    <article className="min-h-screen bg-brand-secondary">
      {/* Full-width warm hero */}
      <div className="relative pt-40 pb-24 px-6" style={{ backgroundColor: '#3D2B1F' }}>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase" style={{ color: '#B08D57' }}>
            Conectemos
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-white/95 tracking-tight leading-tight">
            Hablemos de <br />
            <span className="italic" style={{ color: '#B08D57' }}>sobremesa</span>
          </h1>
          <div className="w-16 h-px mx-auto" style={{ backgroundColor: '#B08D57', opacity: 0.4 }}></div>
          <p className="text-lg font-serif italic text-white/60 max-w-lg mx-auto leading-relaxed">
            &ldquo;Si tienes una duda sobre una receta, quieres colaborar conmigo o simplemente quieres compartir una historia del corazón, estaré encantada de leerte.&rdquo;
          </p>
        </div>
      </div>

      {/* Email CTA — prominent */}
      <div className="max-w-4xl mx-auto px-6 -mt-10">
        <a
          href="mailto:briciaelizaldes@gmail.com"
          className="group block relative overflow-hidden rounded-2xl p-10 md:p-14 text-center transition-all hover:shadow-xl"
          style={{ backgroundColor: '#FAF9F4', border: '1px solid rgba(176, 141, 87, 0.15)' }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(176,141,87,0.05), rgba(176,141,87,0.02))' }}></div>
          <div className="relative space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(176, 141, 87, 0.08)' }}>
              <Mail size={28} strokeWidth={1.2} style={{ color: '#B08D57' }} />
            </div>
            <p className="text-[10px] font-sans font-bold tracking-[0.3em] uppercase" style={{ color: '#B08D57' }}>
              Escríbeme directamente
            </p>
            <p className="text-2xl md:text-3xl font-serif text-brand-primary group-hover:text-brand-accent transition-colors">
              briciaelizaldes@gmail.com
            </p>
            <p className="text-sm font-sans text-brand-muted max-w-md mx-auto">
              Para colaboraciones, preguntas sobre recetas o simplemente para platicar de cocina.
            </p>
          </div>
        </a>
      </div>

      {/* Social channels */}
      <div className="max-w-4xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-[10px] font-sans font-bold tracking-[0.4em] text-brand-muted uppercase">
            Sígueme en redes
          </p>
          <div className="w-12 h-px bg-brand-accent/30 mx-auto"></div>
        </div>

        <div className="space-y-4">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-8 p-6 md:p-8 rounded-2xl bg-white border border-brand-primary/5 hover:border-brand-accent/30 transition-all hover:shadow-md"
            >
              {/* Icon circle */}
              <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-brand-muted group-hover:text-brand-accent transition-colors" style={{ backgroundColor: 'rgba(176, 141, 87, 0.06)' }}>
                {social.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-brand-muted uppercase">
                    {social.name}
                  </span>
                  <span className="text-lg font-serif text-brand-primary group-hover:text-brand-accent transition-colors">
                    {social.handle}
                  </span>
                </div>
                <p className="text-sm font-sans text-brand-muted/70 leading-relaxed">
                  {social.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="shrink-0 text-brand-primary/10 group-hover:text-brand-accent group-hover:translate-x-1 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Back link */}
      <div className="text-center pb-20">
        <Link href="/" className="editorial-spacing hover:text-brand-accent transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} /> VOLVER AL INICIO
        </Link>
      </div>
    </article>
  );
}
