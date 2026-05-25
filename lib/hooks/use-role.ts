"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/rbac";
import { isOwnerOrAbove } from "@/lib/rbac";

interface RoleState {
  role: UserRole | null;
  loading: boolean;
}

export function useRole(): RoleState & { isOwner: boolean; isSuperAdmin: boolean } {
  const [state, setState] = useState<RoleState>({ role: null, loading: true });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ role: null, loading: false });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setState({ role: (data?.role as UserRole) ?? null, loading: false });
    })();
  }, []);

  return {
    ...state,
    isOwner: isOwnerOrAbove(state.role ?? "receptionist"),
    isSuperAdmin: state.role === "super_admin",
  };
}
