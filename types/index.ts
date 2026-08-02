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

export type PatientCarnet = {
  id: string;
  public_code: string;
  created_at: string;
};

export type AppointmentStatus = Appointment["status"];
export type UserRole = User["role"];
export type SubscriptionPlan = Subscription["plan"];

export interface PractitionerSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface AppointmentWithRelations extends Appointment {
  patient: Patient;
  service: Service;
  practitioner?: PractitionerSummary | null;
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

// ── Medical Diagnostic System ─────────────────────────────────────────────────

export type PatientAgeGroup = "infant" | "toddler" | "child" | "minor" | "adult";
export type PatientSex = "male" | "female";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "unknown";
export type DiagnosticDocumentType =
  | "consultation"
  | "prescription"
  | "receipt"
  | "medical_report"
  | "sick_leave";
export type DiagnosticValidationStatus =
  | "draft"
  | "pending_validation"
  | "validated"
  | "rejected";

export interface IcdCode {
  id: string;
  code: string;
  title: string;
}

export interface IcdCandidate extends IcdCode {
  score: number;
  probability: number;
  is_serious: boolean;
}

export interface PrescriptionTreatment {
  drug_name: string;
  rxcui: string;
  atc_code: string;
  dosage_mg: string;
  frequency: string;
  duration_days: number;
  route: "oral" | "iv" | "im" | "topical" | "inhaled" | "sublingual";
  precautions: string;
  is_generic: boolean;
}

export interface VitalSigns {
  temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
}

export interface DiagnosticRecord {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  carnet_id: string | null;

  // Step 1 — demographics
  patient_full_name: string;
  patient_age_years: number | null;
  patient_age_group: PatientAgeGroup | null;
  patient_sex: PatientSex | null;
  patient_weight_kg: number | null;
  patient_height_cm: number | null;
  patient_blood_group: BloodGroup | null;

  // Step 1b — medical history
  chronic_conditions: string[];
  allergies: string[];
  current_medications: string[];
  surgical_history: string[];
  family_history: string[];

  // Step 2 — vitals
  vital_temperature: number | null;
  vital_blood_pressure_systolic: number | null;
  vital_blood_pressure_diastolic: number | null;
  vital_heart_rate: number | null;
  vital_respiratory_rate: number | null;
  vital_oxygen_saturation: number | null;

  // Step 2b — symptoms
  chief_complaint: string | null;
  symptoms: string[];
  symptom_duration: string | null;
  symptom_intensity: number | null;
  aggravating_factors: string[];
  relieving_factors: string[];

  // Progress tracking
  current_step: number | null;

  // Step 3 — ICD analysis
  icd_candidates: IcdCandidate[];
  additional_tests_required: string[];
  clinical_notes: string | null;

  // Step 4 — validation
  validation_status: DiagnosticValidationStatus;
  validated_diagnosis_code: string | null;
  validated_diagnosis_name: string | null;
  validated_by: string | null;
  /** Compte réellement à l'origine de la validation (migration 010). */
  validated_by_user_id: string | null;
  validated_at: string | null;
  rejection_reason: string | null;

  // Step 5 — prescription
  document_type: DiagnosticDocumentType | null;
  treatments: PrescriptionTreatment[];
  recommendations: string[];
  follow_up_delay_days: number | null;
  follow_up_tests: string[];
  icf_codes: IcfCode[];
  practitioner_name: string | null;
  practitioner_title: string | null;
  practitioner_rpps: string | null;

  // Scellement (migration 015)
  /** Empreinte SHA-256 du contenu au moment de la production du document. */
  document_seal: string | null;
  document_sealed_at: string | null;
  document_sealed_by_user_id: string | null;

  created_at: string;
  updated_at: string;
}

// Partial inputs per step
export interface PatientProfileInput {
  patient_id?: string | null;
  patient_full_name: string;
  patient_age_years?: number | null;
  patient_age_group?: PatientAgeGroup | null;
  patient_sex?: PatientSex | null;
  patient_weight_kg?: number | null;
  patient_height_cm?: number | null;
  patient_blood_group?: BloodGroup;
  chronic_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
  surgical_history?: string[];
  family_history?: string[];
}

export interface SymptomsInput {
  chief_complaint?: string;
  symptoms?: string[];
  symptom_duration?: string;
  symptom_intensity?: number | null;
  aggravating_factors?: string[];
  relieving_factors?: string[];
  vital_temperature?: number | null;
  vital_blood_pressure_systolic?: number | null;
  vital_blood_pressure_diastolic?: number | null;
  vital_heart_rate?: number | null;
  vital_respiratory_rate?: number | null;
  vital_oxygen_saturation?: number | null;
}

export interface PrescriptionInput {
  document_type: DiagnosticDocumentType;
  treatments: PrescriptionTreatment[];
  recommendations: string[];
  follow_up_delay_days: number | null;
  follow_up_tests: string[];
  practitioner_name: string;
  practitioner_title: string;
  practitioner_rpps: string;
  icf_codes?: IcfCode[];
}

// ── WHO API Types ─────────────────────────────────────────────────────────────

export interface IcfCode {
  id: string;
  code: string;
  title: string;
  definition?: string;
}

export interface DrugInteractionPair {
  drug1Name: string;
  drug2Name: string;
  severity: "high" | "moderate" | "low";
  description: string;
  source: string;
}

export interface PharmacovigilanceSignal {
  drugName: string;
  rxcui: string;
  totalReports: number;
  seriousReports: number;
  seriousnessRate: number;
  topReactions: string[];
  source: "FDA FAERS";
}

export interface NotificationPayload {
  type: "appointment_confirmation" | "appointment_reminder" | "appointment_cancellation";
  appointmentId: string;
  cancelToken?: string;
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
