"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentClinic } from "./clinic";
import { clinicTemplates } from "@/data/clinic-templates";
import { revalidatePath } from "next/cache";

export async function getClinicWebsite(clinicId?: string) {
  const db = (await createClient()) as any;
  let targetClinicId = clinicId;

  if (!targetClinicId) {
    const clinic = await getCurrentClinic();
    if (!clinic) return { success: false, error: "No clinic found" };
    targetClinicId = clinic.id;
  }

  const { data: website, error } = await db
    .from("clinic_websites")
    .select("*")
    .eq("clinic_id", targetClinicId)
    .single();

  if (error && error.code !== "PGRST116") { // PGRST116 is "No rows found"
    return { success: false, error: error.message };
  }

  return { success: true, data: website || null };
}

export async function initializeClinicWebsite(templateId: string = "medical-modern") {
  const db = (await createClient()) as any;
  const clinic = await getCurrentClinic();
  
  if (!clinic) return { success: false, error: "No clinic found" };

  const template = clinicTemplates.find((t) => t.id === templateId) || clinicTemplates[0];

  // Get current user to prefill some data
  const { data: authData } = await db.auth.getUser();
  let doctorBio = "";
  let doctorAvatar = "";
  
  if (authData.user) {
    const { data: userData } = await db
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", authData.user.id)
      .single();
      
    if (userData) {
      doctorAvatar = userData.avatar_url || "";
    }
  }

  const newWebsite = {
    clinic_id: clinic.id,
    template_id: template.id,
    hero_data: {
      ...template.data.hero_data,
      title: clinic.name,
    },
    about_data: {
      bio: doctorBio,
      specialties: [],
      diplomas: [],
      avatar: doctorAvatar,
    },
    contact_data: {
      address: "",
      phone: "",
      schedule: "Lundi – Vendredi · 8h – 19h\nSamedi · 9h – 13h",
      insurance_info: "Conventionné secteur 1 · Remboursé Assurance Maladie",
    },
    style_config: template.data.style_config,
    is_published: false,
  };

  const { data, error } = await db
    .from("clinic_websites")
    .insert(newWebsite)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/website-builder");
  return { success: true, data };
}

export async function updateClinicWebsite(updates: any) {
  const db = (await createClient()) as any;
  const clinic = await getCurrentClinic();
  
  if (!clinic) return { success: false, error: "No clinic found" };

  const { data, error } = await db
    .from("clinic_websites")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("clinic_id", clinic.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/website-builder");
  // Also revalidate the public route
  revalidatePath(`/clinique/${clinic.slug}`);
  
  return { success: true, data };
}

export async function getPublicWebsiteData(slug: string): Promise<{success: boolean, data?: any, error?: string}> {
  const db = (await createClient()) as any;
  
  // 1. Get the clinic by slug
  const { data: clinic, error: clinicError } = await db
    .from("clinics")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
    
  if (clinicError || !clinic) {
    return { success: false, error: "Clinic not found" };
  }
  
  // 2. Get the published website
  const { data: website, error: websiteError } = await db
    .from("clinic_websites")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("is_published", true)
    .single();
    
  if (websiteError || !website) {
    return { success: false, error: "Website not found or not published" };
  }
  
  // 3. Get services (if show_services is true)
  let services = [];
  if (website.show_services) {
    const { data: servicesData } = await db
      .from("services")
      .select("*")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true);
    
    if (servicesData) services = servicesData;
  }
  
  // 4. Get clinic settings (for the chat widget)
  const { data: settings } = await db
    .from("clinic_settings")
    .select("widget_color")
    .eq("clinic_id", clinic.id)
    .single();
    
  // 5. Get doctor info
  const { data: doctors } = await db
    .from("users")
    .select("full_name, avatar_url, role")
    .eq("clinic_id", clinic.id)
    .eq("role", "owner");
    
  // Increment view count (fire and forget)
  try {
    const { data: rpcData, error: rpcError } = await db.rpc('increment_website_views', { website_id: website.id });
    if (rpcError) throw rpcError;
  } catch (err) {
    // Silently fail if rpc doesn't exist yet, just fall back to direct update
    db.from("clinic_websites")
      .update({ views_count: (website.views_count || 0) + 1 })
      .eq("id", website.id)
      .then();
  }
    
  return { 
    success: true, 
    data: {
      clinic,
      website,
      services,
      settings,
      doctor: doctors && doctors.length > 0 ? doctors[0] : null
    }
  };
}
