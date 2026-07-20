"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Globe2,
  MonitorSmartphone,
  RefreshCw,
  Share2,
} from "lucide-react";
import AdminCmsLoading from "@/components/admin/AdminCmsLoading";
import type {
  AnalyticsBreakdownRow,
  AnalyticsDayRow,
  AnalyticsRangeDays,
  SiteAnalyticsSummary,
} from "@/lib/vercel-analytics";

type AnalyticsResponse = SiteAnalyticsSummary & {
  configured?: boolean;
  error?: string;
};

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-primary/5 p-5 space-y-1">
      <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-brand-muted">
        {label}
      </p>
      <p className="text-3xl font-serif text-brand-primary tabular-nums">
        {value.toLocaleString("es-MX")}
      </p>
      {hint ? (
        <p className="text-xs font-sans text-brand-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function BreakdownList({
  title,
  icon,
  rows,
  empty,
}: {
  title: string;
  icon: ReactNode;
  rows: AnalyticsBreakdownRow[];
  empty: string;
}) {
  const max = Math.max(...rows.map((r) => r.pageviews), 1);

  return (
    <div className="bg-white rounded-xl border border-brand-primary/5 p-5 space-y-4">
      <h2 className="text-sm font-sans font-bold tracking-[0.12em] uppercase text-brand-primary flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm font-sans text-brand-muted">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={`${title}-${row.label}`} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm font-sans">
                <span className="text-brand-primary truncate" title={row.label}>
                  {row.label}
                </span>
                <span className="text-brand-muted shrink-0 tabular-nums">
                  {row.pageviews.toLocaleString("es-MX")} vistas
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-brand-primary/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-accent/70"
                  style={{ width: `${Math.max(4, (row.pageviews / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DailyChart({ rows }: { rows: AnalyticsDayRow[] }) {
  const max = Math.max(...rows.map((r) => r.pageviews), 1);

  return (
    <div className="bg-white rounded-xl border border-brand-primary/5 p-5 space-y-4">
      <h2 className="text-sm font-sans font-bold tracking-[0.12em] uppercase text-brand-primary">
        Vistas por día
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm font-sans text-brand-muted">
          Todavía no hay visitas en este periodo.
        </p>
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2 h-36">
          {rows.map((row) => (
            <div
              key={row.date}
              className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 h-full"
              title={`${formatDateLabel(row.date)}: ${row.pageviews} vistas, ${row.visitors} visitantes`}
            >
              <span className="text-[10px] font-sans text-brand-muted tabular-nums">
                {row.pageviews || ""}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t-md bg-brand-accent/80"
                style={{
                  height: `${Math.max(row.pageviews > 0 ? 8 : 2, (row.pageviews / max) * 100)}%`,
                }}
              />
              <span className="text-[9px] font-sans text-brand-muted truncate w-full text-center">
                {formatDateLabel(row.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [days, setDays] = useState<AnalyticsRangeDays>(7);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (range: AnalyticsRangeDays) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${range}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as AnalyticsResponse;
      if (!res.ok) {
        setData(json);
        setError(json.error || "No se pudieron cargar las métricas");
        return;
      }
      setData(json);
    } catch {
      setError("Error de conexión al cargar analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("bricia_admin") !== "true") {
      router.push("/admin");
      return;
    }
    void load(days);
  }, [router, days, load]);

  if (loading && !data) {
    return <AdminCmsLoading message="Cargando analytics…" />;
  }

  return (
    <div className="min-h-screen bg-brand-secondary pt-20">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-sans text-brand-muted hover:text-brand-accent transition-colors"
            >
              <ArrowLeft size={14} />
              Volver al panel
            </Link>
            <h1 className="text-3xl font-serif text-brand-primary flex items-center gap-3">
              <BarChart3 size={28} className="text-brand-accent" />
              Analytics
            </h1>
            <p className="text-sm font-sans text-brand-muted">
              Visitas del sitio · mismos datos que Vercel, sin entrar a Vercel
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {([7, 30] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`px-3 py-2 rounded-lg text-xs font-sans font-bold tracking-[0.12em] uppercase border transition-colors ${
                  days === value
                    ? "bg-brand-primary text-brand-secondary border-brand-primary"
                    : "border-brand-primary/10 text-brand-primary hover:border-brand-accent hover:text-brand-accent"
                }`}
              >
                {value} días
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load(days)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans font-bold tracking-[0.12em] uppercase border border-brand-primary/10 text-brand-primary hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-2">
            <p className="text-sm font-sans text-red-600">{error}</p>
            {data?.configured === false ? (
              <p className="text-xs font-sans text-brand-muted">
                Chris tiene que agregar el token de Vercel una sola vez. Después
                esta página se llena sola.
              </p>
            ) : null}
          </div>
        ) : null}

        {data && !error ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Visitantes"
                value={data.visitors}
                hint={`Últimos ${data.days} días`}
              />
              <StatCard
                label="Páginas vistas"
                value={data.pageviews}
                hint={`${data.since} → ${data.until}`}
              />
            </div>

            <DailyChart rows={data.daily} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BreakdownList
                title="Páginas más vistas"
                icon={<BarChart3 size={14} className="text-brand-accent" />}
                rows={data.topPages}
                empty="Sin páginas todavía."
              />
              <BreakdownList
                title="De dónde llegan"
                icon={<Share2 size={14} className="text-brand-accent" />}
                rows={data.topReferrers}
                empty="Sin referidos todavía."
              />
              <BreakdownList
                title="Países"
                icon={<Globe2 size={14} className="text-brand-accent" />}
                rows={data.topCountries}
                empty="Sin países todavía."
              />
              <BreakdownList
                title="Dispositivos"
                icon={
                  <MonitorSmartphone size={14} className="text-brand-accent" />
                }
                rows={data.devices}
                empty="Sin dispositivos todavía."
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
