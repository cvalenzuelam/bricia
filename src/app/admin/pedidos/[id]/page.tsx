"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Package, MapPin, User, Mail, Phone, CreditCard, Send, CheckCircle2, Trash2, Truck, ExternalLink, Pencil } from "lucide-react";
import type { Order, OrderStatus } from "@/data/orders";
import { formatPrice } from "@/data/products";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#C2A878",
  paid: "#7A9A7E",
  shipped: "#7B8FA8",
  delivered: "#5C6E58",
  cancelled: "#A87878",
};

const STATUS_FLOW: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingMode, setShippingMode] = useState<"view" | "edit">("edit");
  const [savingShipping, setSavingShipping] = useState(false);
  const [resendingShippingEmail, setResendingShippingEmail] = useState(false);
  const [shippingFeedback, setShippingFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }
    loadOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (!res.ok) { setNotFound(true); return; }
      const data: Order = await res.json();
      setOrder(data);
      setTrackingNumber(data.trackingNumber ?? "");
      setTrackingUrl(data.trackingUrl ?? "");
      setShippingMode(data.trackingNumber && data.trackingUrl ? "view" : "edit");
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: OrderStatus) => {
    if (!order) return;
    if (status === "cancelled" && !confirm("¿Marcar el pedido como cancelado?")) return;
    if (
      status === "paid" &&
      !order.confirmationEmailSentAt &&
      !confirm(
        "Marcar como pagado enviará el correo de confirmación al cliente. ¿Continuar?"
      )
    ) {
      return;
    }
    setUpdating(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        if (data.emailJustSent) {
          setEmailFeedback({ ok: true, msg: "Correo de confirmación enviado al cliente." });
        }
      }
    } finally {
      setUpdating(false);
    }
  };

  const resendEmail = async () => {
    if (!order) return;
    if (!confirm(`Reenviar el correo de confirmación a ${order.customer.email}?`)) return;
    setResendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/resend-email`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailFeedback({ ok: true, msg: "Correo enviado nuevamente." });
        if (data.order) setOrder(data.order);
      } else {
        const hint = data?.hint ? ` ${data.hint}` : "";
        setEmailFeedback({
          ok: false,
          msg: `${data?.error || "No se pudo enviar el correo."}${hint}`.trim(),
        });
      }
    } catch {
      setEmailFeedback({ ok: false, msg: "Error de red al reenviar el correo." });
    } finally {
      setResendingEmail(false);
    }
  };

  const submitShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const tn = trackingNumber.trim();
    const tu = trackingUrl.trim();
    if (!tn || !tu) {
      setShippingFeedback({ ok: false, msg: "Captura el número de guía y la URL de rastreo." });
      return;
    }
    if (!/^https?:\/\//i.test(tu)) {
      setShippingFeedback({
        ok: false,
        msg: "La URL debe empezar con http:// o https://",
      });
      return;
    }
    if (
      !confirm(
        `Marcar el pedido como enviado y notificar a ${order.customer.email}?`
      )
    ) {
      return;
    }
    setSavingShipping(true);
    setShippingFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: tn, trackingUrl: tu }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.order) setOrder(data.order);
        setShippingMode("view");
        if (data.emailJustSent) {
          setShippingFeedback({
            ok: true,
            msg: "Pedido marcado como enviado. Correo de envío entregado al cliente.",
          });
        } else if (data.emailError) {
          setShippingFeedback({
            ok: false,
            msg: `Pedido guardado, pero el correo no se envió: ${data.emailError}`,
          });
        } else {
          setShippingFeedback({
            ok: true,
            msg: "Datos de envío guardados.",
          });
        }
      } else {
        setShippingFeedback({
          ok: false,
          msg: data?.error || "No se pudo guardar el envío.",
        });
      }
    } catch {
      setShippingFeedback({ ok: false, msg: "Error de red al guardar envío." });
    } finally {
      setSavingShipping(false);
    }
  };

  const resendShippingEmail = async () => {
    if (!order) return;
    if (!confirm(`Reenviar el correo de envío a ${order.customer.email}?`)) return;
    setResendingShippingEmail(true);
    setShippingFeedback(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "shipping" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.order) setOrder(data.order);
        setShippingFeedback({ ok: true, msg: "Correo de envío reenviado." });
      } else {
        const hint = data?.hint ? ` ${data.hint}` : "";
        setShippingFeedback({
          ok: false,
          msg: `${data?.error || "No se pudo reenviar."}${hint}`.trim(),
        });
      }
    } catch {
      setShippingFeedback({ ok: false, msg: "Error de red al reenviar." });
    } finally {
      setResendingShippingEmail(false);
    }
  };

  const deleteOrderPermanently = async () => {
    if (!order) return;
    if (
      !confirm(
        `¿Eliminar el pedido ${order.id}? No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/pedidos");
        return;
      }
      const data = await res.json().catch(() => ({}));
      window.alert(data?.error || "No se pudo eliminar el pedido.");
    } catch {
      window.alert("Error de red al eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-muted" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-brand-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-serif text-2xl italic text-brand-primary/40">Pedido no encontrado.</p>
          <Link href="/admin/pedidos" className="text-xs font-sans text-brand-accent hover:text-brand-primary transition-colors">
            ← Volver a pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/admin/pedidos" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5 mb-4">
            <ArrowLeft size={14} /> Volver a pedidos
          </Link>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
              <Package size={28} className="text-brand-accent" />
              Pedido {order.id}
            </h1>
            <span
              className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full"
              style={{
                color: STATUS_COLOR[order.status],
                backgroundColor: `${STATUS_COLOR[order.status]}15`,
              }}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <p className="text-sm font-sans text-brand-muted mt-2">
            Realizado el {formatDate(order.createdAt)}
            {order.paidAt && ` · Pagado el ${formatDate(order.paidAt)}`}
          </p>
        </div>

        {/* Status flow buttons */}
        <div className="bg-white border border-brand-primary/5 rounded-xl p-5 mb-8">
          <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-3">
            Cambiar estado
          </p>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || s === order.status}
                className={`px-4 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-all ${
                  s === order.status
                    ? "text-white cursor-default"
                    : "border border-brand-primary/10 text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent"
                }`}
                style={s === order.status ? { backgroundColor: STATUS_COLOR[s] } : {}}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main content */}
          <div className="space-y-8">
            {/* Shipping & tracking */}
            <Card title="Envío y rastreo" icon={<Truck size={16} />}>
              {shippingMode === "view" && order.trackingNumber && order.trackingUrl ? (
                <div className="space-y-4">
                  {order.shippedAt && (
                    <div className="flex items-start gap-2 text-sm font-sans text-brand-primary">
                      <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>Pedido enviado el {formatDate(order.shippedAt)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-brand-secondary rounded-lg">
                      <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1">
                        Número de guía
                      </p>
                      <p className="font-mono text-sm text-brand-primary tracking-wider break-all">
                        {order.trackingNumber}
                      </p>
                    </div>
                    <div className="p-3 bg-brand-secondary rounded-lg">
                      <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1">
                        URL de rastreo
                      </p>
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-sans text-brand-accent hover:text-brand-primary transition-colors inline-flex items-center gap-1.5 break-all"
                      >
                        Abrir rastreo
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {order.shippingEmailSentAt ? (
                    <div className="flex items-start gap-2 text-sm font-sans text-brand-primary">
                      <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                      <span>
                        Correo de envío enviado a {order.customer.email} el {formatDate(order.shippingEmailSentAt)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-sans text-brand-muted">
                      Aún no se ha notificado al cliente por correo.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resendShippingEmail}
                      disabled={resendingShippingEmail}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-primary/10 text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-primary hover:border-brand-accent/40 hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendingShippingEmail ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      {order.shippingEmailSentAt ? "Reenviar correo de envío" : "Enviar correo de envío"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShippingMode("edit");
                        setShippingFeedback(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-primary/10 text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent transition-colors"
                    >
                      <Pencil size={13} />
                      Editar tracking
                    </button>
                  </div>

                  {shippingFeedback && (
                    <p
                      className={`text-xs ${
                        shippingFeedback.ok ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {shippingFeedback.msg}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={submitShipping} className="space-y-4">
                  <p className="text-sm font-sans text-brand-muted leading-relaxed">
                    Captura los datos de la guía. Al guardar se marcará el pedido como{" "}
                    <strong className="text-brand-primary">enviado</strong> y se enviará un
                    correo al cliente con el número de guía y el botón para rastrear.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1.5">
                        Número de guía
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ej. 7790012345678"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-brand-primary/10 text-sm font-mono tracking-wide text-brand-primary bg-white focus:outline-none focus:border-brand-accent/60"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1.5">
                        URL de rastreo
                      </label>
                      <input
                        type="url"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://www.estafeta.com/Tracking/searchByGet?wayBill=…"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-brand-primary/10 text-sm font-sans text-brand-primary bg-white focus:outline-none focus:border-brand-accent/60"
                        autoComplete="off"
                      />
                      <p className="text-[11px] font-sans text-brand-muted mt-1">
                        Pega el enlace completo donde el cliente puede rastrear su pedido.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={savingShipping || updating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary text-white text-[10px] font-sans font-bold tracking-[0.2em] uppercase hover:bg-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingShipping ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Truck size={13} />
                      )}
                      Marcar como enviado y notificar
                    </button>
                    {order.trackingNumber && order.trackingUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setShippingMode("view");
                          setTrackingNumber(order.trackingNumber ?? "");
                          setTrackingUrl(order.trackingUrl ?? "");
                          setShippingFeedback(null);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-primary/10 text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {shippingFeedback && (
                    <p
                      className={`text-xs ${
                        shippingFeedback.ok ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {shippingFeedback.msg}
                    </p>
                  )}
                </form>
              )}
            </Card>

            {/* Customer */}
            <Card title="Cliente" icon={<User size={16} />}>
              <p className="font-serif text-lg text-brand-primary">{order.customer.name}</p>
              <div className="space-y-1.5 text-sm font-sans text-brand-muted">
                <a href={`mailto:${order.customer.email}`} className="flex items-center gap-2 hover:text-brand-accent transition-colors">
                  <Mail size={13} /> {order.customer.email}
                </a>
                <a href={`tel:${order.customer.phone}`} className="flex items-center gap-2 hover:text-brand-accent transition-colors">
                  <Phone size={13} /> {order.customer.phone}
                </a>
              </div>
            </Card>

            {/* Shipping */}
            <Card title="Dirección de envío" icon={<MapPin size={16} />}>
              {order.shippingMethod && (
                <div className="mb-4 p-3 bg-brand-secondary rounded-lg">
                  <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1">
                    Método de envío
                  </p>
                  <p className="font-sans text-sm text-brand-primary">
                    {order.shippingMethod.name} · {order.shippingMethod.eta}
                  </p>
                </div>
              )}
              <p className="font-sans text-sm text-brand-primary leading-relaxed">
                {order.shipping.street} {order.shipping.exterior}
                {order.shipping.interior ? ` Int. ${order.shipping.interior}` : ""}<br />
                Col. {order.shipping.neighborhood}<br />
                {order.shipping.city}, {order.shipping.state}, C.P. {order.shipping.zip}<br />
                {order.shipping.country}
              </p>
              {order.shipping.notes && (
                <div className="mt-4 p-3 bg-brand-secondary rounded-lg">
                  <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-muted mb-1">
                    Indicaciones
                  </p>
                  <p className="font-serif italic text-sm text-brand-primary/80 leading-relaxed">
                    {order.shipping.notes}
                  </p>
                </div>
              )}
            </Card>

            {/* Items */}
            <Card title="Artículos" icon={<Package size={16} />}>
              <div className="space-y-5">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-start">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-brand-secondary shrink-0 border border-brand-primary/5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base text-brand-primary capitalize">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-xs font-sans text-brand-muted">{item.subtitle}</p>
                      )}
                      <p className="text-xs font-sans text-brand-muted mt-1">
                        Cantidad: {item.quantity} · Unitario: {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-serif text-base text-brand-primary shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar — totals + payment */}
          <aside className="space-y-6">
            <Card title="Resumen" icon={null}>
              <div className="space-y-2.5">
                <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
                <SummaryRow
                  label="Envío"
                  value={
                    order.shippingCost === 0 ? (
                      <span className="font-serif italic text-brand-accent">Cortesía</span>
                    ) : (
                      formatPrice(order.shippingCost)
                    )
                  }
                />
                <div className="flex items-baseline justify-between pt-3 border-t border-brand-primary/10">
                  <span className="text-[10px] font-sans tracking-[0.25em] uppercase text-brand-primary font-bold">
                    Total
                  </span>
                  <span className="text-2xl font-serif text-brand-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Pago" icon={<CreditCard size={16} />}>
              <div className="space-y-3 text-sm font-sans">
                <div>
                  <span className="text-brand-muted">Estado: </span>
                  <span className="text-brand-primary capitalize">
                    {order.paymentStatus ?? (order.status === "pending" ? "esperando" : order.status)}
                  </span>
                </div>
                {order.paymentId && (
                  <div>
                    <span className="text-brand-muted">ID Mercado Pago: </span>
                    <span className="text-brand-primary font-mono text-xs">{order.paymentId}</span>
                  </div>
                )}
                {order.paidAt && (
                  <div>
                    <span className="text-brand-muted">Acreditado: </span>
                    <span className="text-brand-primary">{formatDate(order.paidAt)}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Correo al cliente" icon={<Mail size={16} />}>
              <div className="space-y-3 text-sm font-sans">
                {order.confirmationEmailSentAt ? (
                  <div className="flex items-start gap-2 text-brand-primary">
                    <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>
                      Enviado a{" "}
                      <span className="text-brand-primary">{order.customer.email}</span> el{" "}
                      {formatDate(order.confirmationEmailSentAt)}
                    </span>
                  </div>
                ) : (
                  <p className="text-brand-muted leading-relaxed">
                    Aún no se ha enviado el correo de confirmación. Marca el pedido como{" "}
                    <strong className="text-brand-primary">Pagado</strong> o usa el botón
                    de abajo para enviarlo manualmente.
                  </p>
                )}

                <button
                  onClick={resendEmail}
                  disabled={resendingEmail}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-primary/10 text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-brand-primary hover:border-brand-accent/40 hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingEmail ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  {order.confirmationEmailSentAt ? "Reenviar correo" : "Enviar correo"}
                </button>

                {emailFeedback && (
                  <p
                    className={`text-xs ${
                      emailFeedback.ok ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {emailFeedback.msg}
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>

        {/* Zona peligro — eliminar */}
        <div className="mt-14 border border-red-900/10 rounded-xl p-6 bg-red-900/[0.03]">
          <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-red-900/70 mb-2">
            Eliminar pedido
          </p>
          <p className="text-sm font-sans text-brand-muted mb-4 max-w-2xl leading-relaxed">
            Quita el pedido del panel. No cancela cobros en Mercado Pago.
          </p>
          <button
            type="button"
            onClick={deleteOrderPermanently}
            disabled={deleting || updating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-800/20 text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-red-900 hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Borrar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-brand-primary/5 rounded-xl p-6">
      <h2 className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-brand-muted mb-4 flex items-center gap-2">
        {icon && <span className="text-brand-accent">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs font-sans tracking-[0.15em] uppercase text-brand-muted">{label}</span>
      <span className="font-serif text-base text-brand-primary">{value}</span>
    </div>
  );
}
