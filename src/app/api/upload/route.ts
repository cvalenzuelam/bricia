import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const uniqueName = `recipe_${Date.now()}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public/images", uniqueName);

    await writeFile(uploadPath, buffer);

    return NextResponse.json({
      success: true,
      path: `/images/${uniqueName}`,
    });
  } catch {
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
