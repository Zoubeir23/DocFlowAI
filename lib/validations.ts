import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const onboardingSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  timezone: z.string().min(1, "Please select a timezone"),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  duration_minutes: z.coerce.number().min(5).max(480),
  price: z.coerce.number().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const availabilityRuleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().min(1).default("09:00"),
  end_time: z.string().min(1).default("17:00"),
  break_start: z.string().nullable().optional(),
  break_end: z.string().nullable().optional(),
  is_active: z.boolean().default(false),
});

export const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional().nullable(),
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid(),
  service_id: z.string().uuid(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  notes: z.string().optional().nullable(),
  status: z.enum(["booked", "confirmed", "completed", "cancelled", "no_show"]).default("booked"),
  source: z.enum(["widget", "manual"]).default("manual"),
  practitioner_id: z.string().uuid().optional().nullable(),
});

export const patientSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
});

export const clinicSettingsSchema = z.object({
  widget_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  welcome_message: z.string().min(10, "Welcome message is required"),
  slot_duration_minutes: z.coerce.number().min(5).max(120),
  tone: z.string().min(2),
  // M-fix: envoyé tel quel dans le prompt système à chaque message de chaque
  // visiteur — sans limite, un champ mal rempli (notes internes collées par
  // erreur) fuiterait indéfiniment vers le LLM tiers configuré.
  booking_behavior: z.string().max(1000),
  faq: z.array(
    z.object({
      question: z.string().min(5),
      answer: z.string().min(5),
    })
  ),
});

export const widgetChatSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  patientTempId: z.string(),
  clinicSlug: z.string(),
});

export const createBookingFromWidgetSchema = z.object({
  clinicId: z.string().uuid(),
  patientName: z.string().min(2),
  patientPhone: z.string().min(7),
  patientEmail: z.string().email().optional().nullable(),
  serviceId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type BlockedDateInput = z.infer<typeof blockedDateSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>;
export type WidgetChatInput = z.infer<typeof widgetChatSchema>;
export type CreateBookingFromWidgetInput = z.infer<typeof createBookingFromWidgetSchema>;
