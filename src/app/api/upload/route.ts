import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";
import { localJsonInDev } from "@/lib/dev-data-source";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.BLOB_TOKEN ||
  process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

/** Sin Blob en máquina local: guardar en disco para poder desarrollar el CMS. */
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

    /** En desarrollo local priorizamos disco (sin put a Blob → menos advanced ops). */
    if (localJsonInDev()) {
      const publicPath = await saveDevUpload(file, ext);
      return NextResponse.json({
        success: true,
        path: publicPath,
      });
    }

    if (!BLOB_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Falta BLOB_READ_WRITE_TOKEN. En local puedes usar `npm run dev` sin Vercel y se guardará en /public/uploads-dev, o añade el token en .env.local.",
        },
        { status: 500 }
      );
    }

    const uniqueName = `bricia/images/recipe_${Date.now()}.${ext}`;
    const blob = await put(uniqueName, file, {
      access: "public",
      token: BLOB_TOKEN,
    });

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
