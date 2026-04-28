"use client";

import Link from "next/link";

const terms = [
  {
    title: "1. Aceptación de uso",
    body: "Al acceder y utilizar BRICIA aceptas estos términos. Si no estás de acuerdo con alguna parte, te recomendamos no usar el sitio.",
  },
  {
    title: "2. Propiedad intelectual",
    body: "El contenido de BRICIA (textos, recetas, fotografías, diseño y marca) está protegido por derechos de autor y propiedad intelectual. No está permitido reproducirlo con fines comerciales sin autorización previa.",
  },
  {
    title: "3. Uso permitido",
    body: "Puedes usar el sitio para consulta personal y no comercial. Te comprometes a no utilizarlo para actividades ilegales, abusivas o que afecten su funcionamiento.",
  },
  {
    title: "4. Enlaces externos",
    body: "Podemos incluir enlaces a plataformas o servicios de terceros. BRICIA no controla su contenido ni sus políticas, por lo que no asume responsabilidad sobre ellos.",
  },
  {
    title: "5. Disponibilidad del servicio",
    body: "Nos esforzamos por mantener el sitio disponible y actualizado, pero no garantizamos acceso ininterrumpido ni ausencia total de errores.",
  },
  {
    title: "6. Limitación de responsabilidad",
    body: "La información publicada tiene fines informativos y de inspiración culinaria. BRICIA no será responsable por daños directos o indirectos derivados del uso del sitio.",
  },
  {
    title: "7. Cambios y devoluciones",
    body: "Si un producto presenta defectos de fabricación, puedes solicitar cambio o devolución dentro de los 7 días naturales posteriores a la entrega. Para iniciar el proceso, es necesario compartir evidencia del defecto y datos de compra al correo briciaelizales@gmail.com.",
  },
  {
    title: "8. Modificaciones",
    body: "Podemos modificar estos términos en cualquier momento. Las actualizaciones aplican desde su publicación en esta página.",
  },
  {
    title: "9. Contacto",
    body: "Para dudas relacionadas con estos términos, puedes escribirnos a briciaelizales@gmail.com.",
  },
];

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-brand-secondary pt-28 md:pt-32 pb-20 px-6">
      <article className="max-w-4xl mx-auto">
        <header className="space-y-6 mb-14">
          <p className="editorial-spacing text-brand-accent">Legal</p>
          <h1 className="text-4xl md:text-6xl text-brand-primary tracking-tight">
            Términos y <span className="italic text-brand-accent">Condiciones</span>
          </h1>
          <div className="w-12 h-px bg-brand-accent opacity-40" />
          <p className="text-sm md:text-base text-brand-muted leading-relaxed max-w-2xl">
            Estos términos regulan el uso de BRICIA y la interacción con sus
            contenidos, servicios y materiales.
          </p>
        </header>

        <section className="space-y-10">
          {terms.map((term) => (
            <div key={term.title} className="space-y-3">
              <h2 className="text-2xl md:text-3xl text-brand-primary">
                {term.title}
              </h2>
              <p className="text-sm md:text-base text-brand-muted leading-relaxed">
                {term.body}
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
