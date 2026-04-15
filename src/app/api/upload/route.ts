import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    let ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (ext === "jfif" || ext === "jpeg") ext = "jpg";
    const uniqueName = `bricia/images/recipe_${Date.now()}.${ext}`;

    const blob = await put(uniqueName, buffer, { access: "public" });

    return NextResponse.json({
      success: true,
      path: blob.url,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Error al subir imagen" },
      { status: 500 }
    );
  }
}
