// Barrel re-export — all super-admin logic lives in dedicated domain files.
// This file exists solely so existing imports from "@/actions/super-admin" keep working.

export type { AdminClinicRow, PlatformStats } from "@/actions/admin-clinics";
export {
  getPlatformStats,
  listAllClinics,
  toggleClinicActive,
  updateClinicPlan,
} from "@/actions/admin-clinics";

export type { AdminUserRow } from "@/actions/admin-users";
export {
  listAllUsers,
  toggleUserActive,
  updateUserRole,
} from "@/actions/admin-users";

export type { AdminMessageRow } from "@/actions/admin-messages";
export {
  listAdminMessages,
  getUnreadMessagesCount,
  updateMessageStatus,
  replyToMessage,
} from "@/actions/admin-messages";

export type { NewsletterCampaignRow } from "@/actions/admin-newsletter";
export {
  listNewsletterCampaigns,
  sendNewsletter,
} from "@/actions/admin-newsletter";

export type { AdminApiKeyRow, AdminWebhookRow } from "@/actions/admin-integrations";
export {
  listAllApiKeys,
  listAllWebhooks,
} from "@/actions/admin-integrations";
