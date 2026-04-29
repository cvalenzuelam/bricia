"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Order } from "@/data/orders";
import { formatPrice } from "@/data/products";

function PagoExitoContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderIdParam =
    searchParams.get("orderId") || searchParams.get("external_reference");
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const mpPaymentId = searchParams.get("payment_id") || undefined;
  const mpPaymentStatus = searchParams.get("status") || undefined;

  useEffect(() => {
    const orderId =
      orderIdParam ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("bricia_pending_order")
        : null);

    if (!orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Confirma el pedido (idempotente; si webhook ya lo marcó, devuelve alreadyConfirmed)
        const confirmRes = await fetch(`/api/orders/${orderId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId:
              provider === "stripe" && sessionId ? sessionId : mpPaymentId,
            paymentStatus:
              provider === "stripe" ? "paid" : mpPaymentStatus,
            stripeSessionId:
              provider === "stripe" && sessionId ? sessionId : undefined,
          }),
        });
        const confirmData = await confirmRes.json().catch(() => ({}));

        if (!cancelled && confirmRes.ok && confirmData?.success) {
          clearCart();
          try {
            sessionStorage.removeItem("bricia_pending_order");
          } catch {
            /* ignore */
          }
        }

        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("not found");
        const data = (await res.json()) as Order;
        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    orderIdParam,
    sessionId,
    provider,
    mpPaymentId,
    mpPaymentStatus,
    clearCart,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-32 pb-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-2xl mx-auto"
      >
        {/* Hero */}
        <div className="text-center space-y-6 mb-16">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
            </div>
          </motion.div>

          <div className="space-y-3">
            <p className="editorial-spacing text-brand-accent">Pedido confirmado</p>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-primary">
              ¡Gracias{order ? `, ${order.customer.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-base font-serif italic text-brand-primary/60 leading-relaxed max-w-md mx-auto">
              Tu pedido fue recibido y ya lo estamos preparando con cariño.
            </p>
          </div>
        </div>

        {order && (
          <>
            {/* Order ref */}
            <div className="flex justify-center mb-12">
              <div className="bg-white border border-brand-primary/10 rounded-xl px-7 py-4 text-center">
                <p className="text-[9px] font-sans text-brand-muted tracking-[0.3em] uppercase mb-1">
                  Folio del pedido
                </p>
                <p className="font-sans font-bold tracking-[0.15em] text-brand-primary">
                  {order.id}
                </p>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-white border border-brand-primary/5 rounded-2xl p-8 space-y-7">
              <div>
                <h2 className="text-xl font-serif text-brand-primary border-b border-brand-primary/10 pb-3 mb-4">
                  Tu selección
                </h2>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between items-baseline">
                      <div>
                        <p className="font-serif text-brand-primary leading-tight">
                          {item.name}
                        </p>
                        {item.subtitle && (
                          <p className="text-[11px] font-sans text-brand-muted">{item.subtitle}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-sans text-brand-muted">×{item.quantity}</p>
                        <p className="font-serif text-brand-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-brand-primary/10">
                <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
                <SummaryRow
                  label="Envío"
                  value={
                    order.shippingCost === 0
                      ? <span className="font-serif italic text-brand-accent">Cortesía</span>
                      : formatPrice(order.shippingCost)
                  }
                />
                <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-brand-primary/10">
                  <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-brand-primary font-bold">
                    Total
                  </span>
                  <span className="text-2xl font-serif text-brand-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/* Shipping */}
              <div className="pt-2 border-t border-brand-primary/5">
                <h3 className="text-sm font-sans text-brand-muted tracking-[0.2em] uppercase mb-3">
                  Enviaremos a
                </h3>
                <p className="font-sans text-sm text-brand-primary leading-relaxed">
                  <strong className="font-bold">{order.customer.name}</strong><br />
                  {order.shipping.street} {order.shipping.exterior}
                  {order.shipping.interior ? ` Int. ${order.shipping.interior}` : ""}<br />
                  Col. {order.shipping.neighborhood}<br />
                  {order.shipping.city}, {order.shipping.state}, C.P. {order.shipping.zip}
                </p>
              </div>
            </div>

            {/* Email confirm */}
            <div className="flex items-start gap-3 mt-8 px-2">
              <Mail size={18} className="text-brand-accent shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm font-sans text-brand-muted leading-relaxed">
                Te enviamos los detalles a <span className="text-brand-primary font-medium">{order.customer.email}</span>.
                Si no lo encuentras, revisa la carpeta de spam.
              </p>
            </div>
          </>
        )}

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 mt-16">
          <Link href="/productos">
            <button className="bg-brand-primary text-brand-secondary px-10 py-3.5 rounded-xl text-xs font-sans font-bold tracking-[0.25em] uppercase hover:bg-brand-accent transition-colors">
              Seguir explorando
            </button>
          </Link>
          <Link
            href="/"
            className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors tracking-[0.2em] uppercase"
          >
            Ir al inicio
          </Link>
        </div>

        {/* Closing italic note */}
        <div className="text-center mt-20 px-4 max-w-md mx-auto">
          <div className="w-12 h-px bg-brand-accent mx-auto mb-5 opacity-40" />
          <p className="text-sm font-serif italic text-brand-primary/60 leading-relaxed">
            Cocinar y compartir es un gesto de amor.
            Gracias por dejarnos ser parte de tu mesa.
          </p>
          <p className="font-serif text-brand-primary mt-3">— Bricia</p>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-sans tracking-[0.15em] uppercase text-brand-muted">{label}</span>
      <span className="font-serif text-brand-primary">{value}</span>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-muted" />
      </div>
    }>
      <PagoExitoContent />
    </Suspense>
  );
}
