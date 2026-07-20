const DEFAULT_PROJECT_ID = "prj_uMmzAQTueuSdTuHuAPrz0b1s2cnO";
const DEFAULT_TEAM_ID = "team_Fe3Ld4xrAgFma4ZNRHycwgUM";

export type AnalyticsRangeDays = 7 | 30;

export type AnalyticsBreakdownRow = {
  label: string;
  pageviews: number;
  visitors: number;
};

export type AnalyticsDayRow = {
  date: string;
  pageviews: number;
  visitors: number;
};

export type SiteAnalyticsSummary = {
  days: AnalyticsRangeDays;
  since: string;
  until: string;
  pageviews: number;
  visitors: number;
  daily: AnalyticsDayRow[];
  topPages: AnalyticsBreakdownRow[];
  topReferrers: AnalyticsBreakdownRow[];
  topCountries: AnalyticsBreakdownRow[];
  devices: AnalyticsBreakdownRow[];
};

type VercelAggregateRow = Record<string, unknown>;

function getConfig() {
  const token =
    process.env.VERCEL_ACCESS_TOKEN?.trim() ||
    process.env.VERCEL_TOKEN?.trim() ||
    "";
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || DEFAULT_TEAM_ID;

  return { token, projectId, teamId };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForDays(days: AnalyticsRangeDays) {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { since: toIsoDate(since), until: toIsoDate(until) };
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown, fallback = "—"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

async function queryAggregate(params: {
  token: string;
  projectId: string;
  teamId: string;
  by: string;
  since: string;
  until: string;
  limit?: number;
}): Promise<VercelAggregateRow[]> {
  const url = new URL(
    "https://api.vercel.com/v1/query/web-analytics/visits/aggregate"
  );
  url.searchParams.set("projectId", params.projectId);
  url.searchParams.set("teamId", params.teamId);
  url.searchParams.set("since", params.since);
  url.searchParams.set("until", params.until);
  url.searchParams.set("by", params.by);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${params.token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Vercel Analytics API ${res.status}: ${body.slice(0, 240) || res.statusText}`
    );
  }

  const json = (await res.json()) as { data?: VercelAggregateRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

function mapBreakdown(
  rows: VercelAggregateRow[],
  key: string,
  labelFn?: (raw: string) => string
): AnalyticsBreakdownRow[] {
  return rows
    .map((row) => {
      const raw = str(row[key], "Otros");
      return {
        label: labelFn ? labelFn(raw) : raw,
        pageviews: num(row.pageviews),
        visitors: num(row.visitors),
      };
    })
    .filter((row) => row.label !== "Others" || row.pageviews > 0)
    .sort((a, b) => b.pageviews - a.pageviews);
}

function countryLabel(code: string): string {
  if (!code || code === "Others" || code === "—") return code || "Otros";
  try {
    const name = new Intl.DisplayNames(["es"], { type: "region" }).of(
      code.toUpperCase()
    );
    return name || code;
  } catch {
    return code;
  }
}

function deviceLabel(raw: string): string {
  const map: Record<string, string> = {
    desktop: "Escritorio",
    mobile: "Móvil",
    tablet: "Tablet",
    Others: "Otros",
  };
  return map[raw] || raw;
}

function referrerLabel(raw: string): string {
  if (!raw || raw === "Others") return "Directo / Otros";
  return raw;
}

export function isVercelAnalyticsConfigured(): boolean {
  return Boolean(getConfig().token);
}

export async function fetchSiteAnalytics(
  days: AnalyticsRangeDays = 7
): Promise<SiteAnalyticsSummary> {
  const { token, projectId, teamId } = getConfig();
  if (!token) {
    throw new Error(
      "Falta VERCEL_ACCESS_TOKEN. Configúralo en las variables de entorno de Vercel."
    );
  }

  const { since, until } = rangeForDays(days);
  const base = { token, projectId, teamId, since, until };

  const [dailyRows, pageRows, referrerRows, countryRows, deviceRows] =
    await Promise.all([
      queryAggregate({ ...base, by: "day", limit: days }),
      queryAggregate({ ...base, by: "requestPath", limit: 10 }),
      queryAggregate({ ...base, by: "referrerHostname", limit: 8 }),
      queryAggregate({ ...base, by: "country", limit: 8 }),
      queryAggregate({ ...base, by: "deviceType", limit: 5 }),
    ]);

  const daily: AnalyticsDayRow[] = dailyRows
    .map((row) => ({
      date: str(row.timestamp, since).slice(0, 10),
      pageviews: num(row.pageviews),
      visitors: num(row.visitors),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const pageviews = daily.reduce((sum, row) => sum + row.pageviews, 0);
  const visitors = daily.reduce((sum, row) => sum + row.visitors, 0);

  return {
    days,
    since,
    until,
    pageviews,
    visitors,
    daily,
    topPages: mapBreakdown(pageRows, "requestPath", (p) =>
      p === "Others" ? "Otras páginas" : p
    ),
    topReferrers: mapBreakdown(referrerRows, "referrerHostname", referrerLabel),
    topCountries: mapBreakdown(countryRows, "country", countryLabel),
    devices: mapBreakdown(deviceRows, "deviceType", deviceLabel),
  };
}
