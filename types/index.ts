import type { Database } from "./supabase";

export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
export type BlockedDate = Database["public"]["Tables"]["blocked_dates"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AiConversation = Database["public"]["Tables"]["ai_conversations"]["Row"];
export type ClinicSettings = Database["public"]["Tables"]["clinic_settings"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export type AppointmentStatus = Appointment["status"];
export type UserRole = User["role"];
export type SubscriptionPlan = Subscription["plan"];

export interface AppointmentWithRelations extends Appointment {
  patient: Patient;
  service: Service;
}

export interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  pendingCancellations: number;
  totalPatients: number;
  completionRate: number;
  noShowRate: number;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface BookingIntent {
  type: "create_booking" | "reschedule_booking" | "cancel_booking" | "ask_availability" | "faq" | "unknown";
  data?: {
    serviceId?: string;
    serviceName?: string;
    date?: string;
    timeSlot?: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    appointmentId?: string;
    question?: string;
  };
}

export interface WidgetConfig {
  clinicId: string;
  clinicName: string;
  widgetColor: string;
  welcomeMessage: string;
  timezone: string;
}

export interface NotificationPayload {
  type: "appointment_confirmation" | "appointment_reminder" | "appointment_cancellation";
  appointmentId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorEmail?: string;
  clinicName: string;
  serviceName: string;
  startAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  patientName: string;
  serviceName: string;
  extendedProps: {
    appointmentId: string;
    patientId: string;
    serviceId: string;
    status: AppointmentStatus;
    notes?: string;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OnboardingData {
  clinicName: string;
  timezone: string;
  slug: string;
}
