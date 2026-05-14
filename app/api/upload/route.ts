import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "clinic-assets";

export async function POST(request: NextRequest) {
  const db = await createClient();

  const {
    data: { user },
  } = await (db as any).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = (formData.get("folder") as string | null) || "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF, AVIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const fileName = `${folder}/${user.id}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await (db as any).storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload] storage error:", uploadError);
    return NextResponse.json(
      { error: "Erreur lors de l'upload. Vérifiez que le bucket Supabase est configuré." },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = (db as any).storage.from(BUCKET).getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl });
}
