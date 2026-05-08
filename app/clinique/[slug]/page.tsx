import { getPublicWebsiteData } from "@/actions/website";
import { notFound } from "next/navigation";
import { PublicClinicSite } from "@/components/clinic-website/public-clinic-site";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const { data, success } = await getPublicWebsiteData(slug);
  
  if (!success || !data?.website) {
    return { title: "Clinic Not Found" };
  }

  const { website, clinic } = data;
  
  return {
    title: website.meta_title || `${clinic.name} | DocFlow IA`,
    description: website.meta_description || website.hero_data?.subtitle || `Welcome to ${clinic.name}`,
    openGraph: {
      title: website.meta_title || clinic.name,
      images: website.hero_data?.bgImage ? [website.hero_data.bgImage] : [],
    }
  };
}

export default async function PublicClinicPage({ params }: { params: { slug: string } }) {
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
