import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "cms";

/**
 * Emite una URL firmada para subida directa a Supabase Storage.
 * Petición ligera (~100 bytes JSON), evita el límite de payload de funciones serverless (~4–5 MB) en Vercel.
 */
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase no está configurado en el servidor." },
        { status: 500 }
      );
    }

    let body: { mime?: string; size?: number; name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const size = Number(body.size);
    const mime = String(body.mime ?? "");
    const name = String(body.name ?? "imagen.jpg");

    if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Tamaño inválido (máx. ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB).`,
        },
        { status: 400 }
      );
    }

    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    }

    let ext = name.split(".").pop()?.toLowerCase() || "png";
    if (ext === "jfif" || ext === "jpeg") ext = "jpg";
    if (!ext || ext.length > 10) ext = "png";

    const uniqueName = `bricia/images/cms_${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const sb = createSupabaseAdmin();
    const { data, error } = await sb.storage.from(STORAGE_BUCKET).createSignedUploadUrl(uniqueName);

    if (error || !data) {
      console.error("[upload/sign]", error);
      return NextResponse.json(
        { error: error?.message ?? "No se pudo generar URL de subida" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(uniqueName);

    return NextResponse.json({
      bucket: STORAGE_BUCKET,
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl,
    });
  } catch (e) {
    console.error("[upload/sign]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
