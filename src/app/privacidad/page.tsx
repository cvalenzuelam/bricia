"use client";

import Link from "next/link";

const sections = [
  {
    title: "1. Información que recopilamos",
    body: "Podemos recopilar información que compartes de forma voluntaria, como nombre, correo electrónico o mensajes enviados por formularios de contacto. También se recolectan datos técnicos básicos de navegación para mejorar el rendimiento del sitio.",
  },
  {
    title: "2. Uso de la información",
    body: "Usamos la información para responder tus mensajes, mejorar la experiencia en BRICIA, analizar el uso general del sitio y comunicar novedades cuando nos hayas autorizado hacerlo.",
  },
  {
    title: "3. Cookies y tecnologías similares",
    body: "Este sitio puede utilizar cookies para recordar preferencias, entender métricas de uso y optimizar contenido. Puedes administrar o desactivar cookies desde la configuración de tu navegador.",
  },
  {
    title: "4. Compartición de datos",
    body: "No vendemos tu información personal. Solo compartimos datos cuando es necesario para operar servicios (por ejemplo, analítica o pagos) y siempre bajo medidas razonables de seguridad.",
  },
  {
    title: "5. Seguridad",
    body: "Aplicamos medidas técnicas y organizativas para proteger tu información. Sin embargo, ningún sistema en internet garantiza seguridad absoluta.",
  },
  {
    title: "6. Tus derechos",
    body: "Puedes solicitar acceso, corrección o eliminación de tus datos personales. Para ejercer estos derechos, escríbenos a briciaelizales@gmail.com.",
  },
  {
    title: "7. Cambios a esta política",
    body: "Podemos actualizar esta política para reflejar mejoras del sitio o cambios legales. La versión vigente será siempre la publicada en esta página.",
  },
];

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-brand-secondary pt-28 md:pt-32 pb-20 px-6">
      <article className="max-w-4xl mx-auto">
        <header className="space-y-6 mb-14">
          <p className="editorial-spacing text-brand-accent">Privacidad</p>
          <h1 className="text-4xl md:text-6xl text-brand-primary tracking-tight">
            Política de <span className="italic text-brand-accent">Privacidad</span>
          </h1>
          <div className="w-12 h-px bg-brand-accent opacity-40" />
          <p className="text-sm md:text-base text-brand-muted leading-relaxed max-w-2xl">
            En BRICIA valoramos tu confianza. Este documento explica qué datos
            se recopilan, cómo se usan y qué opciones tienes sobre tu información.
          </p>
        </header>

        <section className="space-y-10">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-2xl md:text-3xl text-brand-primary">
                {section.title}
              </h2>
              <p className="text-sm md:text-base text-brand-muted leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </section>

        <footer className="mt-16 pt-8 border-t border-brand-primary/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-xs text-brand-muted">
            Última actualización: abril 2026
          </p>
          <Link
            href="/"
            className="text-xs font-sans font-bold tracking-[0.2em] uppercase text-brand-primary/70 hover:text-brand-accent"
          >
            Volver al inicio
          </Link>
        </footer>
      </article>
    </main>
  );
}
