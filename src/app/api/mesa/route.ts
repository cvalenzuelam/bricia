import { NextRequest, NextResponse } from "next/server";
import { getMesaArticles, addMesaArticle, generateMesaSlug, MesaArticle } from "@/data/lamesa";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

export async function GET() {
  try {
    const articles = await getMesaArticles();
    return NextResponse.json(articles, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Error al cargar artículos" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, date, type, readingTime, excerpt, coverImage, coverColor, body: articleBody } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Título y tipo son obligatorios" },
        { status: 400 }
      );
    }

    const slug = generateMesaSlug(title);
    const article: MesaArticle = {
      slug,
      title,
      date: date || new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
      type: type as MesaArticle["type"],
      readingTime: readingTime || "3 min",
      excerpt: excerpt || "",
      coverImage: coverImage || "/images/mesa_setting.png",
      coverColor: coverColor || "from-[#F3EDE4] to-[#E5DACE]",
      body: Array.isArray(articleBody) ? articleBody : [],
    };

    await addMesaArticle(article);
    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear artículo" },
      { status: 500 }
    );
  }
}
