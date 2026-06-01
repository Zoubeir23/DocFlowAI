export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          timezone: string;
          created_at: string;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
          owner_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          timezone?: string;
          created_at?: string;
          owner_id?: string;
        };
      };
      users: {
        Row: {
          id: string;
          clinic_id: string;
          role: "owner" | "receptionist" | "assistant";
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          clinic_id: string;
          role?: "owner" | "receptionist" | "assistant";
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          role?: "owner" | "receptionist" | "assistant";
          full_name?: string;
          email?: string;
          created_at?: string;
        };
      };
      patient_carnets: {
        Row: {
          id: string;
          public_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          public_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          public_code?: string;
          created_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          clinic_id: string;
          carnet_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          carnet_id?: string | null;
          full_name: string;
          phone: string;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          carnet_id?: string | null;
          full_name?: string;
          phone?: string;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          duration_minutes: number;
          price: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          duration_minutes: number;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          name?: string;
          duration_minutes?: number;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      availability_rules: {
        Row: {
          id: string;
          clinic_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start: string | null;
          break_end: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start?: string | null;
          break_end?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          break_start?: string | null;
          break_end?: string | null;
          is_active?: boolean;
        };
      };
      blocked_dates: {
        Row: {
          id: string;
          clinic_id: string;
          date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          date?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string;
          service_id: string;
          status: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
          source: "widget" | "manual";
          start_at: string;
          end_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id: string;
          service_id: string;
          status?: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
          source?: "widget" | "manual";
          start_at: string;
          end_at: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_id?: string;
          service_id?: string;
          status?: "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
          source?: "widget" | "manual";
          start_at?: string;
          end_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          clinic_id: string;
          patient_temp_id: string;
          messages: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_temp_id: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          patient_temp_id?: string;
          messages?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      clinic_settings: {
        Row: {
          id: string;
          clinic_id: string;
          widget_color: string;
          welcome_message: string;
          faq: Json;
          slot_duration_minutes: number;
          tone: string;
          booking_behavior: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          widget_color?: string;
          welcome_message?: string;
          faq?: Json;
          slot_duration_minutes?: number;
          tone?: string;
          booking_behavior?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          widget_color?: string;
          welcome_message?: string;
          faq?: Json;
          slot_duration_minutes?: number;
          tone?: string;
          booking_behavior?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          clinic_id: string;
          plan: "free" | "starter" | "professional" | "enterprise";
          status: "active" | "inactive" | "cancelled" | "past_due";
          current_period_start: string;
          current_period_end: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          payment_provider: "stripe" | "crypto";
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          plan?: "free" | "starter" | "professional" | "enterprise";
          status?: "active" | "inactive" | "cancelled" | "past_due";
          current_period_start: string;
          current_period_end: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          payment_provider?: "stripe" | "crypto";
          created_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: string;
          plan?: "free" | "starter" | "professional" | "enterprise";
          status?: "active" | "inactive" | "cancelled" | "past_due";
          current_period_start?: string;
          current_period_end?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          payment_provider?: "stripe" | "crypto";
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      get_available_slots: {
        Args: {
          p_clinic_id: string;
          p_service_id: string;
          p_date: string;
        };
        Returns: {
          slot_start: string;
          slot_end: string;
        }[];
      };
      create_booking_from_widget: {
        Args: {
          p_clinic_id: string;
          p_patient_name: string;
          p_patient_phone: string;
          p_patient_email: string | null;
          p_service_id: string;
          p_start_at: string;
          p_end_at: string;
          p_notes: string | null;
        };
        Returns: {
          appointment_id: string;
          patient_id: string;
        };
      };
    };
    Enums: {};
  };
}
