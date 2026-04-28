"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
  "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  street: string;
  exterior: string;
  interior: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  street: "",
  exterior: "",
  interior: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, itemCount } = useCart();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Si el carrito queda vacío, regresa a la tienda
  useEffect(() => {
    if (hydrated && items.length === 0 && !submitting) {
      router.replace("/productos");
    }
  }, [hydrated, items.length, submitting, router]);

  const shippingCost = calculateShipping(subtotal);
  const total = subtotal + shippingCost;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Nombre completo requerido";
    if (!form.email.trim()) next.email = "Correo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Correo no válido";
    if (!form.phone.trim()) next.phone = "Teléfono requerido";
    else if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Mínimo 10 dígitos";
    if (!form.street.trim()) next.street = "Calle requerida";
    if (!form.exterior.trim()) next.exterior = "Número requerido";
    if (!form.neighborhood.trim()) next.neighborhood = "Colonia requerida";
    if (!form.city.trim()) next.city = "Ciudad requerida";
    if (!form.state.trim()) next.state = "Estado requerido";
    if (!form.zip.trim()) next.zip = "C.P. requerido";
    else if (!/^\d{5}$/.test(form.zip)) next.zip = "5 dígitos";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitMessage("Guardando tu pedido…");

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          shipping: {
            street: form.street,
            exterior: form.exterior,
            interior: form.interior,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: "México",
            notes: form.notes,
          },
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            name: product.name,
            subtitle: product.subtitle,
            price: product.price,
            quantity,
            image: product.image,
          })),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error ?? "Error al crear el pedido");

      const orderId = orderData.order.id;
      setSubmitMessage("Conectando con Mercado Pago…");

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, orderSnapshot: orderData.order }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData?.error ?? "Error al iniciar el pago");

      // Guarda el orderId temporalmente por si MP no lo regresa en la URL
      sessionStorage.setItem("bricia_pending_order", orderId);

      window.location.href = checkoutData.checkoutUrl;
    } catch (err) {
      setSubmitting(false);
      setSubmitMessage("");
      alert(err instanceof Error ? err.message : "Error al procesar el pedido");
    }
  };

  if (!hydrated || items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-32 pb-20">
      {submitting && (
        <div className="fixed inset-0 z-50 bg-brand-primary/85 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <Loader2 size={40} className="animate-spin text-brand-secondary" />
          <p className="text-brand-secondary font-serif text-xl italic">{submitMessage}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Link
            href="/productos"
            className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center justify-center gap-1.5 mb-6"
          >
            <ArrowLeft size={14} /> Volver a la tienda
          </Link>
          <p className="editorial-spacing text-brand-accent mb-3">Finaliza tu compra</p>
          <h1 className="text-5xl md:text-6xl font-serif text-brand-primary lowercase tracking-tighter">
            tus <span className="italic text-brand-accent">datos</span>
          </h1>
          <div className="w-12 h-px bg-brand-accent mx-auto mt-6 opacity-40" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* ── FORM ── */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-12"
          >
            {/* Datos personales */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-brand-primary/10 pb-3">
                <h2 className="text-xl font-serif text-brand-primary">Información de contacto</h2>
                <span className="text-[10px] font-sans text-brand-muted tracking-[0.2em] uppercase">01</span>
              </div>

              <Field label="Nombre completo" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Bricia López"
                  className={inputClass(!!errors.name)}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Correo electrónico" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className={inputClass(!!errors.email)}
                  />
                </Field>
                <Field label="Teléfono (10 dígitos)" error={errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="55 1234 5678"
                    className={inputClass(!!errors.phone)}
                  />
                </Field>
              </div>
            </section>

            {/* Envío */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-brand-primary/10 pb-3">
                <h2 className="text-xl font-serif text-brand-primary">Dirección de envío</h2>
                <span className="text-[10px] font-sans text-brand-muted tracking-[0.2em] uppercase">02</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-5">
                <Field label="Calle" error={errors.street}>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setField("street", e.target.value)}
                    placeholder="Av. Reforma"
                    className={inputClass(!!errors.street)}
                  />
                </Field>
                <Field label="Núm. exterior" error={errors.exterior}>
                  <input
                    type="text"
                    value={form.exterior}
                    onChange={(e) => setField("exterior", e.target.value)}
                    placeholder="123"
                    className={inputClass(!!errors.exterior)}
                  />
                </Field>
                <Field label="Núm. interior" optional>
                  <input
                    type="text"
                    value={form.interior}
                    onChange={(e) => setField("interior", e.target.value)}
                    placeholder="A2"
                    className={inputClass(false)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Colonia" error={errors.neighborhood}>
                  <input
                    type="text"
                    value={form.neighborhood}
                    onChange={(e) => setField("neighborhood", e.target.value)}
                    placeholder="Roma Norte"
                    className={inputClass(!!errors.neighborhood)}
                  />
                </Field>
                <Field label="C.P." error={errors.zip}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={form.zip}
                    onChange={(e) => setField("zip", e.target.value.replace(/\D/g, ""))}
                    placeholder="06700"
                    className={inputClass(!!errors.zip)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Ciudad" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Ciudad de México"
                    className={inputClass(!!errors.city)}
                  />
                </Field>
                <Field label="Estado" error={errors.state}>
                  <select
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    className={inputClass(!!errors.state)}
                  >
                    <option value="">Selecciona un estado</option>
                    {MEXICAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Indicaciones para entrega" optional>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Referencias, color de la fachada, horario preferido…"
                  rows={3}
                  className={`${inputClass(false)} resize-none`}
                />
              </Field>
            </section>

            {/* Submit */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-primary text-brand-secondary py-4 rounded-xl text-xs font-sans font-bold tracking-[0.25em] uppercase hover:bg-brand-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Lock size={14} strokeWidth={1.8} />
                Continuar a Mercado Pago
              </button>
              <p className="text-[10px] font-sans text-brand-muted text-center tracking-[0.1em] uppercase">
                Pago seguro · Tarjeta · OXXO · Transferencia
              </p>
            </div>
          </motion.form>

          {/* ── ORDER SUMMARY ── */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:sticky lg:top-32 self-start"
          >
            <div className="bg-white border border-brand-primary/5 rounded-2xl p-7 space-y-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-serif text-brand-primary">Tu pedido</h2>
                <span className="text-[10px] font-sans text-brand-muted tracking-[0.2em] uppercase">
                  {itemCount} {itemCount === 1 ? "pieza" : "piezas"}
                </span>
              </div>

              <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-brand-secondary shrink-0 border border-brand-primary/5">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-primary text-brand-secondary text-[10px] font-bold flex items-center justify-center">
                        {quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <p className="font-serif text-sm text-brand-primary capitalize leading-tight">
                          {product.name}
                        </p>
                        <p className="text-[11px] font-sans text-brand-muted truncate">
                          {product.subtitle}
                        </p>
                      </div>
                      <span className="text-xs font-serif text-brand-primary">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-5 border-t border-brand-primary/5">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row
                  label="Envío"
                  value={shippingCost === 0
                    ? <span className="font-serif italic text-brand-accent">Cortesía</span>
                    : formatPrice(shippingCost)
                  }
                />
                {remainingForFreeShipping > 0 && (
                  <p className="text-[10px] font-sans text-brand-muted/80 italic font-serif pt-1 leading-relaxed">
                    Te faltan {formatPrice(remainingForFreeShipping)} para envío gratis.
                  </p>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-4 border-t border-brand-primary/10">
                <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-brand-primary font-bold">
                  Total
                </span>
                <span className="text-3xl font-serif text-brand-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Trust signals */}
            <div className="mt-6 px-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={14} className="text-brand-accent shrink-0 mt-0.5" strokeWidth={1.8} />
                <p className="text-[11px] font-sans text-brand-muted leading-relaxed">
                  Pago procesado por Mercado Pago. No guardamos tus datos de tarjeta.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={14} className="text-brand-accent shrink-0 mt-0.5" strokeWidth={1.8} />
                <p className="text-[11px] font-sans text-brand-muted leading-relaxed">
                  Recibirás confirmación por correo en cuanto se acredite el pago.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted block">
        {label} {optional && <span className="text-brand-muted/50 font-normal normal-case tracking-normal">· opcional</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] font-sans text-red-500">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return `w-full px-4 py-3 border rounded-lg bg-white text-brand-primary font-sans text-sm focus:outline-none transition-colors ${
    hasError
      ? "border-red-300 focus:border-red-400"
      : "border-brand-primary/10 focus:border-brand-accent"
  }`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-sans tracking-[0.15em] uppercase text-brand-muted">{label}</span>
      <span className="font-serif text-base text-brand-primary">{value}</span>
    </div>
  );
}
