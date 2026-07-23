import { redirect } from "next/navigation";
import { getClinicWebsite } from "@/actions/website";
import { getCurrentClinic } from "@/actions/clinic";
import { WebsiteBuilderClient } from "@/components/website-builder/website-builder-client";

export const metadata = {
  title: "Website Builder | DocFlow IA",
  description: "Create and manage your clinic's public website",
};

export default async function WebsiteBuilderPage() {
  const clinic = await getCurrentClinic();
  if (!clinic) redirect("/login");

  // Fetch the website
  const { data: website } = await getClinicWebsite(clinic.id);

  // If no website exists yet, show the template picker
  // We handle this in the client component, but if it's null we pass null
  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <WebsiteBuilderClient initialWebsite={website} clinic={clinic} />
    </div>
  );
}
