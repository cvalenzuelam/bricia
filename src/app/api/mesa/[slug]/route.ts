import { NextRequest, NextResponse } from "next/server";
import { getMesaArticleBySlug, updateMesaArticle, deleteMesaArticle } from "@/data/lamesa";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const article = await getMesaArticleBySlug(slug);
  if (!article) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404, headers: NO_STORE }
    );
  }
  return NextResponse.json(article, { headers: NO_STORE });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const updated = await updateMesaArticle(slug, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, article: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const deleted = await deleteMesaArticle(slug);
  if (!deleted) {
    return NextResponse.json(
      { error: "Artículo no encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
