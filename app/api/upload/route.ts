import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAuthenticatedRateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "clinic-assets";

// H4 fix: whitelist of allowed folder values — never trust client input
const ALLOWED_FOLDERS = new Set([
  "avatars",
  "logos",
  "uploads",
  "covers",
  "hero-backgrounds",
  "doctor-photos",
]);

// H5 fix: derive extension from validated MIME type, not filename
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  const db = await createClient();

  const {
    data: { user },
  } = await (db as any).auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!(await checkAuthenticatedRateLimit(user.id, "upload"))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  const rawFolder = (formData.get("folder") as string | null) || "uploads";

  // H4 fix: reject any folder not in the whitelist
  if (!ALLOWED_FOLDERS.has(rawFolder)) {
    return NextResponse.json({ error: "Dossier de destination invalide." }, { status: 400 });
  }
  const folder = rawFolder;

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

  // H5 fix: extension from MIME type, not from user-supplied filename
  const extension = MIME_TO_EXTENSION[file.type] ?? "jpg";
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
