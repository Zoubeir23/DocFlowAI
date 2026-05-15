export type UserRole = "super_admin" | "owner" | "receptionist" | "assistant";

// Routes within /app/ that require owner-level access minimum
export const OWNER_ONLY_ROUTES = [
  "/app/services",
  "/app/analytics",
  "/app/team",
  "/app/clinics",
  "/app/integrations",
  "/app/ai-settings",
  "/app/website-builder",
  "/app/settings",
  "/app/billing",
] as const;

// super_admin inherits all owner permissions (owner who became super_admin)
export function isOwnerOrAbove(role: UserRole): boolean {
  return role === "owner" || role === "super_admin";
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "super_admin") return true;

  if (OWNER_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return isOwnerOrAbove(role);
  }

  return true;
}
