import { NextRequest, NextResponse } from "next/server";
import {
  fetchSiteAnalytics,
  isVercelAnalyticsConfigured,
  type AnalyticsRangeDays,
} from "@/lib/vercel-analytics";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

function parseDays(value: string | null): AnalyticsRangeDays {
  return value === "30" ? 30 : 7;
}

export async function GET(request: NextRequest) {
  if (!isVercelAnalyticsConfigured()) {
    return NextResponse.json(
      {
        error:
          "Analytics aún no está configurado. Falta la variable VERCEL_ACCESS_TOKEN en Vercel.",
        configured: false,
      },
      { status: 503, headers: NO_STORE }
    );
  }

  const days = parseDays(request.nextUrl.searchParams.get("days"));

  try {
    const data = await fetchSiteAnalytics(days);
    return NextResponse.json(
      { configured: true, ...data },
      { headers: NO_STORE }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al cargar analytics";
    return NextResponse.json(
      { error: message, configured: true },
      { status: 502, headers: NO_STORE }
    );
  }
}
