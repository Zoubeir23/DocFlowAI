"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

async function fetchCurrentClinic() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("*, clinic:clinics(*)")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  return {
    user: {
      id: userData.id,
      fullName: userData.full_name,
      email: userData.email,
      role: userData.role,
    },
    clinic: userData.clinic,
    clinicId: userData.clinic_id,
  };
}

export function useClinic() {
  return useQuery({
    queryKey: ["current-clinic"],
    queryFn: fetchCurrentClinic,
    staleTime: 5 * 60 * 1000,
  });
}
