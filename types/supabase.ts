export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          admin_reply: string | null
          body: string
          clinic_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          replied_at: string | null
          sender_email: string
          sender_name: string
          sender_plan: string | null
          status: string
          subject: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_reply?: string | null
          body: string
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          replied_at?: string | null
          sender_email: string
          sender_name: string
          sender_plan?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_reply?: string | null
          body?: string
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          replied_at?: string | null
          sender_email?: string
          sender_name?: string
          sender_plan?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          messages: Json
          patient_temp_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          messages?: Json
          patient_temp_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          messages?: Json
          patient_temp_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          clinic_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancel_token: string
          clinic_id: string
          created_at: string
          end_at: string
          id: string
          medical_notes: string | null
          notes: string | null
          patient_id: string
          payment_status: string
          practitioner_id: string | null
          preconsultation_form: Json | null
          preconsultation_submitted_at: string | null
          reminder_sent_at: string | null
          service_id: string
          source: string
          start_at: string
          status: string
          stripe_checkout_session_id: string | null
          teleconsultation_room_id: string | null
          teleconsultation_status: string | null
        }
        Insert: {
          cancel_token?: string
          clinic_id: string
          created_at?: string
          end_at: string
          id?: string
          medical_notes?: string | null
          notes?: string | null
          patient_id: string
          payment_status?: string
          practitioner_id?: string | null
          preconsultation_form?: Json | null
          preconsultation_submitted_at?: string | null
          reminder_sent_at?: string | null
          service_id: string
          source?: string
          start_at: string
          status?: string
          stripe_checkout_session_id?: string | null
          teleconsultation_room_id?: string | null
          teleconsultation_status?: string | null
        }
        Update: {
          cancel_token?: string
          clinic_id?: string
          created_at?: string
          end_at?: string
          id?: string
          medical_notes?: string | null
          notes?: string | null
          patient_id?: string
          payment_status?: string
          practitioner_id?: string | null
          preconsultation_form?: Json | null
          preconsultation_submitted_at?: string | null
          reminder_sent_at?: string | null
          service_id?: string
          source?: string
          start_at?: string
          status?: string
          stripe_checkout_session_id?: string | null
          teleconsultation_room_id?: string | null
          teleconsultation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          break_end: string | null
          break_start: string | null
          clinic_id: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          clinic_id: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          clinic_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          id: string
          reason: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          id?: string
          reason?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      carnet_import_events: {
        Row: {
          carnet_id: string
          clinic_id: string
          created_at: string
          id: string
          imported_by_user_id: string | null
          patient_id: string | null
        }
        Insert: {
          carnet_id: string
          clinic_id: string
          created_at?: string
          id?: string
          imported_by_user_id?: string | null
          patient_id?: string | null
        }
        Update: {
          carnet_id?: string
          clinic_id?: string
          created_at?: string
          id?: string
          imported_by_user_id?: string | null
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carnet_import_events_carnet_id_fkey"
            columns: ["carnet_id"]
            isOneToOne: false
            referencedRelation: "patient_carnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carnet_import_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carnet_import_events_imported_by_user_id_fkey"
            columns: ["imported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carnet_import_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          booking_behavior: string
          clinic_id: string
          created_at: string
          faq: Json
          id: string
          slot_duration_minutes: number
          tone: string
          updated_at: string
          welcome_message: string
          widget_color: string
        }
        Insert: {
          booking_behavior?: string
          clinic_id: string
          created_at?: string
          faq?: Json
          id?: string
          slot_duration_minutes?: number
          tone?: string
          updated_at?: string
          welcome_message?: string
          widget_color?: string
        }
        Update: {
          booking_behavior?: string
          clinic_id?: string
          created_at?: string
          faq?: Json
          id?: string
          slot_duration_minutes?: number
          tone?: string
          updated_at?: string
          welcome_message?: string
          widget_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_websites: {
        Row: {
          about_data: Json | null
          blog_posts: Json | null
          clinic_id: string
          contact_data: Json | null
          created_at: string | null
          experience: Json | null
          gallery: Json | null
          hero_data: Json | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          show_blog: boolean | null
          show_chat_widget: boolean | null
          show_gallery: boolean | null
          show_services: boolean | null
          show_testimonials: boolean | null
          style_config: Json | null
          template_id: string
          testimonials: Json | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          about_data?: Json | null
          blog_posts?: Json | null
          clinic_id: string
          contact_data?: Json | null
          created_at?: string | null
          experience?: Json | null
          gallery?: Json | null
          hero_data?: Json | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          show_blog?: boolean | null
          show_chat_widget?: boolean | null
          show_gallery?: boolean | null
          show_services?: boolean | null
          show_testimonials?: boolean | null
          style_config?: Json | null
          template_id?: string
          testimonials?: Json | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          about_data?: Json | null
          blog_posts?: Json | null
          clinic_id?: string
          contact_data?: Json | null
          created_at?: string | null
          experience?: Json | null
          gallery?: Json | null
          hero_data?: Json | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          show_blog?: boolean | null
          show_chat_widget?: boolean | null
          show_gallery?: boolean | null
          show_services?: boolean | null
          show_testimonials?: boolean | null
          style_config?: Json | null
          template_id?: string
          testimonials?: Json | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_websites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      diagnostics: {
        Row: {
          additional_tests_required: string[]
          aggravating_factors: string[]
          allergies: string[]
          carnet_id: string | null
          chief_complaint: string | null
          chronic_conditions: string[]
          clinic_id: string
          clinical_notes: string | null
          created_at: string
          current_medications: string[]
          current_step: number
          document_seal: string | null
          document_sealed_at: string | null
          document_sealed_by_user_id: string | null
          document_type: string
          family_history: string[]
          follow_up_delay_days: number | null
          follow_up_tests: string[]
          icd_candidates: Json
          icf_codes: Json
          id: string
          interaction_check_acknowledged_at: string | null
          interaction_check_acknowledged_by_user_id: string | null
          interaction_check_status: string | null
          patient_age_group: string | null
          patient_age_years: number | null
          patient_blood_group: string | null
          patient_full_name: string
          patient_height_cm: number | null
          patient_id: string | null
          patient_sex: string | null
          patient_weight_kg: number | null
          practitioner_name: string | null
          practitioner_rpps: string | null
          practitioner_title: string | null
          prescribed_by_user_id: string | null
          recommendations: string[]
          rejection_reason: string | null
          relieving_factors: string[]
          surgical_history: string[]
          symptom_duration: string | null
          symptom_intensity: number | null
          symptoms: string[]
          treatments: Json
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validated_by_user_id: string | null
          validated_diagnosis_code: string | null
          validated_diagnosis_name: string | null
          validation_status: string
          vital_blood_pressure_diastolic: number | null
          vital_blood_pressure_systolic: number | null
          vital_heart_rate: number | null
          vital_oxygen_saturation: number | null
          vital_respiratory_rate: number | null
          vital_temperature: number | null
        }
        Insert: {
          additional_tests_required?: string[]
          aggravating_factors?: string[]
          allergies?: string[]
          carnet_id?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string[]
          clinic_id: string
          clinical_notes?: string | null
          created_at?: string
          current_medications?: string[]
          current_step?: number
          document_seal?: string | null
          document_sealed_at?: string | null
          document_sealed_by_user_id?: string | null
          document_type?: string
          family_history?: string[]
          follow_up_delay_days?: number | null
          follow_up_tests?: string[]
          icd_candidates?: Json
          icf_codes?: Json
          id?: string
          interaction_check_acknowledged_at?: string | null
          interaction_check_acknowledged_by_user_id?: string | null
          interaction_check_status?: string | null
          patient_age_group?: string | null
          patient_age_years?: number | null
          patient_blood_group?: string | null
          patient_full_name: string
          patient_height_cm?: number | null
          patient_id?: string | null
          patient_sex?: string | null
          patient_weight_kg?: number | null
          practitioner_name?: string | null
          practitioner_rpps?: string | null
          practitioner_title?: string | null
          prescribed_by_user_id?: string | null
          recommendations?: string[]
          rejection_reason?: string | null
          relieving_factors?: string[]
          surgical_history?: string[]
          symptom_duration?: string | null
          symptom_intensity?: number | null
          symptoms?: string[]
          treatments?: Json
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_user_id?: string | null
          validated_diagnosis_code?: string | null
          validated_diagnosis_name?: string | null
          validation_status?: string
          vital_blood_pressure_diastolic?: number | null
          vital_blood_pressure_systolic?: number | null
          vital_heart_rate?: number | null
          vital_oxygen_saturation?: number | null
          vital_respiratory_rate?: number | null
          vital_temperature?: number | null
        }
        Update: {
          additional_tests_required?: string[]
          aggravating_factors?: string[]
          allergies?: string[]
          carnet_id?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string[]
          clinic_id?: string
          clinical_notes?: string | null
          created_at?: string
          current_medications?: string[]
          current_step?: number
          document_seal?: string | null
          document_sealed_at?: string | null
          document_sealed_by_user_id?: string | null
          document_type?: string
          family_history?: string[]
          follow_up_delay_days?: number | null
          follow_up_tests?: string[]
          icd_candidates?: Json
          icf_codes?: Json
          id?: string
          interaction_check_acknowledged_at?: string | null
          interaction_check_acknowledged_by_user_id?: string | null
          interaction_check_status?: string | null
          patient_age_group?: string | null
          patient_age_years?: number | null
          patient_blood_group?: string | null
          patient_full_name?: string
          patient_height_cm?: number | null
          patient_id?: string | null
          patient_sex?: string | null
          patient_weight_kg?: number | null
          practitioner_name?: string | null
          practitioner_rpps?: string | null
          practitioner_title?: string | null
          prescribed_by_user_id?: string | null
          recommendations?: string[]
          rejection_reason?: string | null
          relieving_factors?: string[]
          surgical_history?: string[]
          symptom_duration?: string | null
          symptom_intensity?: number | null
          symptoms?: string[]
          treatments?: Json
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validated_by_user_id?: string | null
          validated_diagnosis_code?: string | null
          validated_diagnosis_name?: string | null
          validation_status?: string
          vital_blood_pressure_diastolic?: number | null
          vital_blood_pressure_systolic?: number | null
          vital_heart_rate?: number | null
          vital_oxygen_saturation?: number | null
          vital_respiratory_rate?: number | null
          vital_temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_carnet_id_fkey"
            columns: ["carnet_id"]
            isOneToOne: false
            referencedRelation: "patient_carnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_document_sealed_by_user_id_fkey"
            columns: ["document_sealed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_interaction_check_acknowledged_by_user_id_fkey"
            columns: ["interaction_check_acknowledged_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_prescribed_by_user_id_fkey"
            columns: ["prescribed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostics_validated_by_user_id_fkey"
            columns: ["validated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_signatures: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          signature_data_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          signature_data_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          signature_data_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_signatures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string | null
          created_by: string | null
          failed_count: number | null
          id: string
          recipients_count: number | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          target_roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          target_roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string | null
          created_by?: string | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          target_roles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_carnets: {
        Row: {
          created_at: string
          id: string
          public_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          public_code: string
        }
        Update: {
          created_at?: string
          id?: string
          public_code?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          auth_user_id: string | null
          carnet_id: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          portal_invited_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          carnet_id?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          portal_invited_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          carnet_id?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          portal_invited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_carnet_id_fkey"
            columns: ["carnet_id"]
            isOneToOne: false
            referencedRelation: "patient_carnets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          clinic_id: string
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          clinic_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["staff_role"]
          status: string
          token: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          status?: string
          token?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          clinic_id: string
          created_at: string
          crypto_tx_hash: string | null
          current_period_end: string
          current_period_start: string
          id: string
          payment_provider: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          crypto_tx_hash?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          crypto_tx_hash?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_clinic_access: {
        Row: {
          clinic_id: string
          joined_at: string
          role: Database["public"]["Enums"]["clinic_access_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clinic_access_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["clinic_access_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clinic_access_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clinic_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          is_super_admin: boolean
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          is_super_admin?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "users_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          notes: string | null
          notified_at: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          service_id: string | null
          status: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          service_id?: string | null
          status?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          notified_at?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          service_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          clinic_id: string
          created_at: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_status_code: number | null
          last_triggered_at: string | null
          name: string
          secret: string
          url: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          name: string
          secret: string
          url: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_status_code?: number | null
          last_triggered_at?: string | null
          name?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_from_widget: {
        Args: {
          p_clinic_id: string
          p_end_at?: string
          p_notes?: string
          p_patient_email?: string
          p_patient_name: string
          p_patient_phone: string
          p_service_id?: string
          p_start_at?: string
        }
        Returns: Json
      }
      create_clinic_onboarding: {
        Args: {
          p_clinic_name: string
          p_email: string
          p_full_name: string
          p_plan?: string
          p_slug: string
          p_timezone: string
          p_user_id: string
        }
        Returns: Json
      }
      create_enterprise_clinic: {
        Args: { p_name: string; p_slug: string; p_user_id: string }
        Returns: Json
      }
      get_clinic_info_by_slug: { Args: { p_slug: string }; Returns: Json }
      get_user_clinic_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      increment_website_views: {
        Args: { website_id: string }
        Returns: undefined
      }
      is_super_admin: { Args: never; Returns: boolean }
      rotate_patient_carnet_code: {
        Args: { p_carnet_id: string }
        Returns: string
      }
    }
    Enums: {
      clinic_access_role: "owner" | "receptionist" | "assistant"
      staff_role: "receptionist" | "assistant"
      user_role: "owner" | "receptionist" | "assistant" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      clinic_access_role: ["owner", "receptionist", "assistant"],
      staff_role: ["receptionist", "assistant"],
      user_role: ["owner", "receptionist", "assistant", "super_admin"],
    },
  },
} as const

