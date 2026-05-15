import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: clinics } = await db
      .from("clinics")
      .select("slug, updated_at")
      .not("slug", "is", null);

    const clinicPages: MetadataRoute.Sitemap = (clinics ?? []).map(
      (clinic: { slug: string; updated_at: string }) => ({
        url: `${siteUrl}/clinique/${clinic.slug}`,
        lastModified: new Date(clinic.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })
    );

    return [...staticPages, ...clinicPages];
  } catch {
    return staticPages;
  }
}
