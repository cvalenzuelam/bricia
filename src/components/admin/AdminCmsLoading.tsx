"use client";

import { Loader2 } from "lucide-react";

type Props = {
  message?: string;
  submessage?: string;
};

/**
 * Pantalla de espera mientras el CMS / API responde.
 * Evita editar o guardar sobre datos que aún no reflejan el servidor.
 */
export default function AdminCmsLoading({
  message = "Cargando datos del CMS…",
  submessage = "Espera a que termine antes de modificar o guardar.",
}: Props) {
  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center px-6 gap-3 pt-20">
      <Loader2 className="animate-spin text-brand-accent" size={32} aria-hidden />
      <p className="text-sm font-sans font-medium text-brand-primary text-center max-w-md">
        {message}
      </p>
      {submessage ? (
        <p className="text-xs font-sans text-brand-muted text-center max-w-sm leading-relaxed">
          {submessage}
        </p>
      ) : null}
    </div>
  );
}
