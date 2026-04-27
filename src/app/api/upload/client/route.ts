import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

export const runtime = "nodejs";

const MAX_RECIPE_IMAGE_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_TOKEN ||
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return NextResponse.json(
        {
          error:
            "Falta configurar BLOB_READ_WRITE_TOKEN en variables de entorno del proyecto.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: MAX_RECIPE_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op: recipe URL is saved by the client after upload.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al preparar subida: ${message}` },
      { status: 400 }
    );
  }
}
