import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió archivo" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen válida" },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La imagen excede el límite de 10 MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    let ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (ext === "jfif" || ext === "jpeg") ext = "jpg";
    if (!ext) ext = "png";
    const uniqueName = `bricia/images/recipe_${Date.now()}.${ext}`;

    const blob = await put(uniqueName, file, { access: "public" });

    return NextResponse.json({
      success: true,
      path: blob.url,
    });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al subir imagen: ${message}` },
      { status: 500 }
    );
  }
}
