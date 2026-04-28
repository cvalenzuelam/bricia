"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Package, Search, Trash2 } from "lucide-react";
import type { Order, OrderStatus } from "@/data/orders";
import { formatPrice } from "@/data/products";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";

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

const FILTERS: (OrderStatus | "all")[] = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialListReady, setInitialListReady] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("bricia_admin");
    if (session !== "true") { router.push("/admin"); return; }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } finally {
      setLoading(false);
      setInitialListReady(true);
    }
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const status of FILTERS.slice(1)) {
      c[status] = orders.filter((o) => o.status === status).length;
    }
    return c;
  }, [orders]);

  const handleDeleteFromList = async (order: Order, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `¿Eliminar el pedido ${order.id}? No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeletingId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
        return;
      }
      const data = await res.json().catch(() => ({}));
      window.alert(data?.error || "No se pudo eliminar.");
    } catch {
      window.alert("Error de red.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!initialListReady) {
    return <AdminCmsLoading message="Cargando pedidos desde el CMS…" />;
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div className="space-y-1">
            <Link href="/admin" className="text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5 mb-3">
              <ArrowLeft size={14} /> Volver al panel
            </Link>
            <h1 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
              <Package size={28} className="text-brand-accent" />
              Pedidos
            </h1>
            <p className="text-sm font-sans text-brand-muted">
              {orders.length} pedido{orders.length !== 1 ? "s" : ""} totales
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por folio, nombre o correo…"
              className="w-72 pl-9 pr-4 py-2.5 border border-brand-primary/10 rounded-lg bg-white text-brand-primary text-sm focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[10px] font-sans font-bold tracking-[0.2em] uppercase transition-all ${
                filter === f
                  ? "bg-brand-primary text-brand-secondary"
                  : "border border-brand-primary/10 text-brand-muted hover:border-brand-accent/40 hover:text-brand-accent"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_LABEL[f]} · {counts[f] ?? 0}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="animate-spin text-brand-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-2">
            <p className="text-brand-muted font-serif text-xl italic">
              {orders.length === 0 ? "Todavía no hay pedidos." : "No hay pedidos con estos filtros."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="flex items-stretch gap-2 sm:gap-3"
              >
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="flex-1 min-w-0 block bg-white rounded-xl p-5 border border-brand-primary/5 hover:border-brand-accent/30 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-6 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                          style={{
                            color: STATUS_COLOR[order.status],
                            backgroundColor: `${STATUS_COLOR[order.status]}15`,
                          }}
                        >
                          {STATUS_LABEL[order.status]}
                        </span>
                        <span className="text-[11px] font-sans text-brand-muted">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg text-brand-primary group-hover:text-brand-accent transition-colors">
                        {order.customer.name}
                      </h3>
                      <p className="text-xs font-sans text-brand-muted truncate">
                        {order.customer.email} · {order.items.length}{" "}
                        {order.items.length === 1 ? "artículo" : "artículos"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-brand-muted mb-1">
                        {order.id}
                      </p>
                      <p className="text-2xl font-serif text-brand-primary">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  title="Eliminar pedido"
                  aria-label={`Eliminar pedido ${order.id}`}
                  onClick={(e) => handleDeleteFromList(order, e)}
                  disabled={deletingId === order.id}
                  className="shrink-0 self-stretch flex items-center justify-center w-12 sm:w-14 rounded-xl border border-brand-primary/10 bg-white text-brand-muted hover:text-red-800 hover:border-red-800/25 hover:bg-red-900/[0.04] transition-colors disabled:opacity-50"
                >
                  {deletingId === order.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
