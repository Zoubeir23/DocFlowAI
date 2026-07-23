import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function usePlan() {
  return useQuery({
    queryKey: ["integrations-plan"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = createClient() as any;
      const { data: { user } } = await db.auth.getUser();
      if (!user) return "free";
      const { data: userData } = await db.from("users").select("clinic_id, role").eq("id", user.id).maybeSingle();
      if (!userData) return "free";
      if (userData.role === "super_admin") return "enterprise";
      if (!userData.clinic_id) return "free";
      const { data: sub } = await db.from("subscriptions").select("plan").eq("clinic_id", userData.clinic_id).maybeSingle();
      return (sub?.plan as string) ?? "free";
    },
  });
}
