import { getPublicWebsiteData } from "@/actions/website";
import { notFound } from "next/navigation";
import { PublicClinicSite } from "@/components/clinic-website/public-clinic-site";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data, success } = await getPublicWebsiteData(slug);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";

  if (!success || !data?.website) {
    return { title: "Cabinet introuvable | DocFlow IA" };
  }

  const { website, clinic } = data;
  const canonicalUrl = `${siteUrl}/clinique/${slug}`;
  const title = website.meta_title || `${clinic.name} — Prise de rendez-vous en ligne`;
  const description =
    website.meta_description ||
    website.hero_data?.subtitle ||
    `Prenez rendez-vous en ligne avec ${clinic.name}. Réservation disponible 24h/24 via DocFlow IA.`;
  const ogImage = website.hero_data?.bgImage ? [{ url: website.hero_data.bgImage, alt: clinic.name }] : [];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: canonicalUrl,
      title,
      description,
      siteName: "DocFlow IA",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage.map((img) => img.url),
    },
  };
}

export default async function PublicClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, success } = await getPublicWebsiteData(slug);

  if (!success || !data?.website) {
    notFound();
  }

  return (
    <PublicClinicSite 
      website={data.website} 
      clinic={data.clinic} 
      services={data.services}
      doctor={data.doctor}
    />
  );
}
