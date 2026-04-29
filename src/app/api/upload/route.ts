import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { localJsonInDev } from "@/lib/dev-data-source";

export const runtime = "nodejs";

/** Solo desarrollo local: guarda multipart en disco. Producción debe usar /api/upload/sign + navegador → Supabase. */
const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

async function saveDevUpload(file: File, ext: string) {
  const dir = path.join(process.cwd(), "public", "uploads-dev");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const full = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buf);
  return `/uploads-dev/${name}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!localJsonInDev()) {
      return NextResponse.json(
        {
          error:
            "Este endpoint multipart solo existe en desarrollo local. Actualiza el CMS para subir con URL firmada a Supabase.",
          code: "DEV_UPLOAD_ONLY",
        },
        { status: 405 }
      );
    }

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
        { error: "La imagen excede el límite de 25 MB" },
        { status: 400 }
      );
    }

    let ext = file.name.split(".").pop()?.toLowerCase() || "png";
    if (ext === "jfif" || ext === "jpeg") ext = "jpg";
    if (!ext) ext = "png";

    const publicPath = await saveDevUpload(file, ext);
    return NextResponse.json({
      success: true,
      path: publicPath,
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
