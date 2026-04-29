import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { localJsonInDev } from "@/lib/dev-data-source";
import {
  createSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "cms";

/** En local: disco; en producción: Supabase Storage. */
async function saveDevUpload(file: File, ext: string) {
  const dir = path.join(process.cwd(), "public", "uploads-dev");
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const full = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buf);
  return `/uploads-dev/${name}`;
}

async function saveSupabaseUpload(file: File, ext: string) {
  const uniqueName = `bricia/images/cms_${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const sb = createSupabaseAdmin();
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(uniqueName, buf, {
    contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
    upsert: false,
  });

  if (error) throw error;

  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(uniqueName);
  return data.publicUrl;
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

    if (localJsonInDev()) {
      const publicPath = await saveDevUpload(file, ext);
      return NextResponse.json({
        success: true,
        path: publicPath,
      });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Sin almacén: configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en producción; en desarrollo (`npm run dev`) las imágenes se guardan en public/uploads-dev.",
        },
        { status: 500 }
      );
    }

    try {
      const publicUrl = await saveSupabaseUpload(file, ext);
      return NextResponse.json({
        success: true,
        path: publicUrl,
      });
    } catch (err) {
      console.error("[upload] Supabase Storage failed:", err);
      const message =
        err instanceof Error ? err.message : "Error subiendo a Supabase Storage";
      return NextResponse.json(
        { error: `Error al subir imagen: ${message}` },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al subir imagen: ${message}` },
      { status: 500 }
    );
  }
}
