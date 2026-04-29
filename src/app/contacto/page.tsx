import Image from "next/image";
import { HERO_IMAGE_QUALITY } from "@/lib/image-quality";
import { contactPhotoSplitFadeStyle } from "@/lib/image-frame-fade";
import Link from "next/link";
import { Mail } from "lucide-react";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = ({ size = 20 }: { size?: number }) => (
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
  },
  {
    name: "TikTok",
    handle: "@bricia.elizalde",
    url: "https://www.tiktok.com/@bricia.elizalde",
    icon: <TikTokIcon />,
  },
  {
    name: "YouTube",
    handle: "@briciaelizaldes",
    url: "https://www.youtube.com/@briciaelizaldes",
    icon: <YouTubeIcon />,
  },
];

/* ─── Pill badge ─────────────────────────────────────────────── */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block text-[9px] font-sans font-bold tracking-[0.25em] uppercase px-3 py-1.5 rounded-full"
    style={{ backgroundColor: "rgba(176, 141, 87, 0.12)", color: "#B08D57" }}
  >
    {children}
  </span>
);

function AboutHeroVisual() {
  return (
    <div className="w-full space-y-6">
      <p
        className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase"
        style={{ color: "rgba(176,141,87,0.5)" }}
      >
        Entre el espacio y la mesa
      </p>
      <div
        className="w-11 h-px"
        style={{ backgroundColor: "#B08D57", opacity: 0.35 }}
      />
      <div className="space-y-5">
        <blockquote className="space-y-4 m-0 border-0 p-0">
          <p className="font-serif text-lg md:text-xl italic text-white/48 leading-snug">
            Cocinar, para mí, es diseñar con los sentidos.
          </p>
          <p className="font-serif text-sm italic text-white/32 leading-relaxed pl-1 border-l border-white/[0.12] pl-4">
            Los detalles ordenan el espacio; la mesa ordena el día.
          </p>
        </blockquote>
        <div className="space-y-3 pt-1 border-t border-white/[0.06]">
          <p className="text-sm font-sans text-white/45 leading-relaxed">
            Me gusta pensar que una receta y un rincón del hogar se componen con el mismo instinto: cuidar proporciones sin perder calidez, y ordenar sin perder el alma.
          </p>
          <p className="text-sm font-sans text-white/38 leading-relaxed">
            Aquí comparto lo que llevo años explorando: cocinar con intención, rodearte de belleza cotidiana y recordar que un plato bien pensado y un espacio bien vivido cuentan la misma historia.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ContactPage() {
  return (
    <article className="min-h-screen bg-brand-secondary overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO — foto + presentación en split editorial
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen md:min-h-[calc(45vw*1.5)] flex flex-col md:flex-row"
        style={{ backgroundColor: "#1D1D1B" }}
      >
        {/* ── Columna IZQUIERDA: foto ── */}
        <div className="relative w-full md:w-[45%] aspect-[2/3] md:aspect-auto min-h-[60svh] md:min-h-[calc(45vw*1.5)] overflow-hidden">
          <Image
            src="/images/bricia-contacto-original.jpg"
            alt="Bricia Elizalde"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            quality={HERO_IMAGE_QUALITY}
            className="object-cover object-center"
            priority
          />
          {/* Overlay degradado para fundir con el texto en mobile */}
          <div className="absolute inset-0 z-[1]" style={contactPhotoSplitFadeStyle()} />

        </div>

        {/* ── Columna DERECHA: texto ── */}
        <div
          className="relative w-full md:w-[55%] px-8 md:pl-12 md:pr-12 lg:pl-16 lg:pr-16 xl:pr-24 pb-16 md:pb-24 pt-10 md:pt-64 lg:pt-72 md:min-h-[calc(45vw*1.5)]"
        >
          <div className="max-w-lg space-y-8 w-full">
            {/* Eyebrow */}
            <p
              className="text-[10px] font-sans font-bold tracking-[0.45em] uppercase"
              style={{ color: "#B08D57" }}
            >
              Quién soy
            </p>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white/95 leading-[1.05] tracking-tight">
              Hola,{" "}
              <br />
              <span className="italic" style={{ color: "#B08D57" }}>
                soy Bricia
              </span>
            </h1>

            {/* Separador */}
            <div
              className="w-12 h-px"
              style={{ backgroundColor: "#B08D57", opacity: 0.35 }}
            />

            {/* Bio principal */}
            <p className="text-base md:text-lg font-serif text-white/70 leading-relaxed">
              Soy arquitecta e interiorista de profesión,{" "}
              <span className="italic" style={{ color: "rgba(176,141,87,0.85)" }}>pero cocinera de corazón.</span>
            </p>

            <p className="text-sm font-sans text-white/50 leading-relaxed">
              Desde hace años he encontrado en el diseño una forma de transformar
              espacios, y en la cocina una manera de crear momentos.
            </p>

            {/* Pills / tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Pill>Arquitecta</Pill>
              <Pill>Interiorista</Pill>
              <Pill>Cocina con intención</Pill>
              <Pill>Decoración</Pill>
              <Pill>Estética del hogar</Pill>
            </div>

            <AboutHeroVisual />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECCIÓN — Por qué existe este sitio
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-36 px-6 bg-brand-secondary">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-start">

          {/* Izquierda: pregunta editorial grande */}
          <div className="space-y-6">
            <p
              className="text-[10px] font-sans font-bold tracking-[0.4em] uppercase"
              style={{ color: "#B08D57" }}
            >
              Por qué BRICIA
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-brand-primary leading-tight tracking-tight">
              Donde el diseño
              <br />
              <span className="italic" style={{ color: "#B08D57" }}>
                llega a la mesa
              </span>
            </h2>
            <div className="w-10 h-px bg-brand-accent/30" />
            <p className="text-sm font-sans text-brand-muted leading-relaxed">
              BRICIA nace de esa conexión entre dos pasiones: el amor por los
              detalles, la estética y la calidez del hogar, llevados también a
              la mesa. Así como diseñamos espacios para habitarlos, también
              podemos crear experiencias a través de lo que cocinamos.
            </p>
          </div>

          {/* Derecha: tres razones */}
          <div className="space-y-10">
            {[
              {
                num: "01",
                title: "Cocina cotidiana con intención",
                body: "Este espacio es una invitación a disfrutar la cocina del día a día con creatividad, estética y mucho sabor. Sin complicar, sin perder el alma.",
              },
              {
                num: "02",
                title: "El ojo de la interiorista",
                body: "La misma sensibilidad con la que diseño un espacio la pongo en cada receta: los colores, la textura, la presentación. Todo comunica.",
              },
              {
                num: "03",
                title: "Cocina y hogar, inseparables",
                body: "Porque el espacio que rodea la mesa importa tanto como lo que hay en ella. Aquí encontrarás recetas, pero también ideas para que tu hogar se sienta más tuyo.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-6">
                <span
                  className="text-[11px] font-sans font-bold tracking-[0.2em] shrink-0 pt-1"
                  style={{ color: "#B08D57" }}
                >
                  {item.num}
                </span>
                <div>
                  <p className="font-serif text-brand-primary text-lg mb-1">
                    {item.title}
                  </p>
                  <p className="text-sm font-sans text-brand-muted leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════
          CONTACTO — Rediseñado con fondo oscuro y tarjetas premium
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative py-28 md:py-40 px-6 overflow-hidden"
        style={{ backgroundColor: "#1D1D1B" }}
      >
        {/* Decorative blurred orbs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "rgba(176,141,87,0.07)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "rgba(176,141,87,0.05)" }}
        />

        <div className="relative z-0 max-w-4xl mx-auto space-y-20">

          {/* Header */}
          <div className="text-center space-y-5">
            <p
              className="text-[10px] font-sans font-bold tracking-[0.5em] uppercase"
              style={{ color: "#B08D57" }}
            >
              Conectemos
            </p>
            <h2 className="text-5xl md:text-6xl font-serif text-white/95 tracking-tight leading-tight">
              Hablemos de{" "}
              <span className="italic" style={{ color: "#B08D57" }}>
                sobremesa
              </span>
            </h2>
            <div className="w-12 h-px mx-auto" style={{ backgroundColor: "#B08D57", opacity: 0.3 }} />
            <p className="text-sm font-sans text-white/40 max-w-sm mx-auto leading-relaxed">
              Para colaboraciones, preguntas sobre recetas, decoración del hogar
              o simplemente para platicar con calma.
            </p>
          </div>

          {/* Email CTA — premium card */}
          <a
            href="https://mail.google.com/mail/?view=cm&to=briciaelizaldes@gmail.com&su=Hola%20Bricia"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative z-10 block rounded-3xl p-10 md:p-14 transition-all duration-500 hover:scale-[1.01] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(176,141,87,0.12) 0%, rgba(176,141,87,0.04) 100%)",
              border: "1px solid rgba(176,141,87,0.2)",
            }}
          >
            {/* Hover glow ring */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: "inset 0 0 60px rgba(176,141,87,0.08)" }}
            />
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Icon */}
              <div
                className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500"
                style={{
                  background: "linear-gradient(135deg, rgba(176,141,87,0.25), rgba(176,141,87,0.10))",
                  border: "1px solid rgba(176,141,87,0.3)",
                }}
              >
                <Mail size={32} strokeWidth={1.2} style={{ color: "#B08D57" }} />
              </div>
              {/* Text */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <p
                  className="text-[9px] font-sans font-bold tracking-[0.4em] uppercase"
                  style={{ color: "#B08D57" }}
                >
                  Escríbeme directo
                </p>
                <p className="text-2xl md:text-3xl font-serif text-white/80 group-hover:text-white transition-colors duration-300">
                  briciaelizaldes@gmail.com
                </p>
                <p className="text-xs font-sans text-white/30">
                  Respondo con mucho cariño ✦
                </p>
              </div>
              {/* Arrow */}
              <div className="shrink-0 hidden md:flex w-10 h-10 rounded-full items-center justify-center border border-white/10 text-white/20 group-hover:border-brand-accent/50 group-hover:text-brand-accent group-hover:translate-x-1 transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          {/* Divider */}
          <div className="flex items-center gap-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(176,141,87,0.12)" }} />
            <p
              className="text-[9px] font-sans font-bold tracking-[0.35em] uppercase shrink-0"
              style={{ color: "rgba(176,141,87,0.5)" }}
            >
              o sígueme en
            </p>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(176,141,87,0.12)" }} />
          </div>

          {/* Social cards */}
          <div className="grid sm:grid-cols-3 gap-5">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col items-center gap-5 p-8 rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(176,141,87,0.12)",
                }}
              >
                {/* Hover background glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(176,141,87,0.10), rgba(176,141,87,0.03))",
                  }}
                />
                {/* Icon */}
                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-brand-accent transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: "rgba(176,141,87,0.08)",
                    border: "1px solid rgba(176,141,87,0.15)",
                  }}
                >
                  {social.icon}
                </div>
                {/* Text */}
                <div className="relative text-center">
                  <p
                    className="text-[9px] font-sans font-bold tracking-[0.3em] uppercase mb-1.5"
                    style={{ color: "rgba(176,141,87,0.6)" }}
                  >
                    {social.name}
                  </p>
                  <p className="font-serif text-white/60 group-hover:text-white/90 transition-colors text-base">
                    {social.handle}
                  </p>
                </div>
                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-2/3 transition-all duration-500"
                  style={{ backgroundColor: "#B08D57", opacity: 0.5 }}
                />
              </a>
            ))}
          </div>

        </div>
      </section>

      {/* Back link */}
      <div
        className="text-center py-10 border-t"
        style={{ backgroundColor: "#1D1D1B", borderColor: "rgba(176,141,87,0.1)" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[9px] font-sans font-bold tracking-[0.35em] uppercase transition-all duration-300 hover:opacity-100"
          style={{ color: "rgba(176,141,87,0.45)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </div>
    </article>
  );
}
