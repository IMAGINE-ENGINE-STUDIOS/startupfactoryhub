export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accelerator_cohorts: {
        Row: {
          accelerator_id: string
          application_deadline: string | null
          created_at: string | null
          current_startups: number | null
          description: string | null
          end_date: string | null
          enrollment_fee: number | null
          equity_percentage: number | null
          focus_industries: string[] | null
          funding_per_startup: number | null
          id: string
          max_startups: number | null
          name: string
          payment_duration_months: number | null
          payment_type: string | null
          start_date: string | null
          status: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          accelerator_id: string
          application_deadline?: string | null
          created_at?: string | null
          current_startups?: number | null
          description?: string | null
          end_date?: string | null
          enrollment_fee?: number | null
          equity_percentage?: number | null
          focus_industries?: string[] | null
          funding_per_startup?: number | null
          id?: string
          max_startups?: number | null
          name: string
          payment_duration_months?: number | null
          payment_type?: string | null
          start_date?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accelerator_id?: string
          application_deadline?: string | null
          created_at?: string | null
          current_startups?: number | null
          description?: string | null
          end_date?: string | null
          enrollment_fee?: number | null
          equity_percentage?: number | null
          focus_industries?: string[] | null
          funding_per_startup?: number | null
          id?: string
          max_startups?: number | null
          name?: string
          payment_duration_months?: number | null
          payment_type?: string | null
          start_date?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accelerator_cohorts_accelerator_id_fkey"
            columns: ["accelerator_id"]
            isOneToOne: false
            referencedRelation: "accelerator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accelerator_profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          equity_percentage: number | null
          external_link: string | null
          founded_year: number | null
          funding_offered: number | null
          id: string
          industries_focus: string[] | null
          is_accepting_applications: boolean | null
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          organization_name: string
          program_duration: string | null
          total_cohorts: number | null
          total_funding_raised: number | null
          total_startups_supported: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          equity_percentage?: number | null
          external_link?: string | null
          founded_year?: number | null
          funding_offered?: number | null
          id?: string
          industries_focus?: string[] | null
          is_accepting_applications?: boolean | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          organization_name: string
          program_duration?: string | null
          total_cohorts?: number | null
          total_funding_raised?: number | null
          total_startups_supported?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          equity_percentage?: number | null
          external_link?: string | null
          founded_year?: number | null
          funding_offered?: number | null
          id?: string
          industries_focus?: string[] | null
          is_accepting_applications?: boolean | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          organization_name?: string
          program_duration?: string | null
          total_cohorts?: number | null
          total_funding_raised?: number | null
          total_startups_supported?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      accelerator_resources: {
        Row: {
          accelerator_id: string
          contact_email: string | null
          created_at: string | null
          description: string | null
          discount_details: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          promo_code: string | null
          resource_type: string
          title: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          accelerator_id: string
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          discount_details?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          promo_code?: string | null
          resource_type?: string
          title: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          accelerator_id?: string
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          discount_details?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          promo_code?: string | null
          resource_type?: string
          title?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accelerator_resources_accelerator_id_fkey"
            columns: ["accelerator_id"]
            isOneToOne: false
            referencedRelation: "accelerator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          achievement_type: string
          created_at: string | null
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      advisor_achievements: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          icon: string | null
          id: string
          organization: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          icon?: string | null
          id?: string
          organization?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          icon?: string | null
          id?: string
          organization?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      advisor_education: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          institution: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      advisor_experiences: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      advisor_job_tasks: {
        Row: {
          advisor_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          advisor_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_job_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_skills: {
        Row: {
          category: string | null
          created_at: string | null
          endorsement_count: number | null
          id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          skill_name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          endorsement_count?: number | null
          id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          context: Json | null
          conversation_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          conversation_type: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string | null
          embeddings: Json | null
          file_url: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_type?: string | null
          embeddings?: Json | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string | null
          embeddings?: Json | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          insight_data: Json
          insight_type: string
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          insight_data: Json
          insight_type: string
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summaries: {
        Row: {
          created_at: string
          id: string
          key_points: Json | null
          original_text: string
          source_id: string | null
          source_type: string
          summary_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_points?: Json | null
          original_text: string
          source_id?: string | null
          source_type: string
          summary_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_points?: Json | null
          original_text?: string
          source_id?: string | null
          source_type?: string
          summary_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_task_automations: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config: Json
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_translations: {
        Row: {
          created_at: string
          id: string
          original_text: string
          source_language: string
          target_language: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          source_language: string
          target_language: string
          translated_text: string
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          source_language?: string
          target_language?: string
          translated_text?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          estimated_cost: number | null
          id: string
          metadata: Json | null
          request_count: number | null
          service_name: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          request_count?: number | null
          service_name: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          request_count?: number | null
          service_name?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      application_invitations: {
        Row: {
          accepted_at: string | null
          applicant_email: string
          application_id: string
          created_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string | null
          linked_user_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          applicant_email: string
          application_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          invitation_token: string
          invited_at?: string | null
          linked_user_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          applicant_email?: string
          application_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string | null
          linked_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_invitations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "public_job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string
          guest_name: string | null
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          guest_name?: string | null
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          guest_name?: string | null
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          created_at: string
          guest_identifier: string | null
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_identifier?: string | null
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_identifier?: string | null
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          guest_name: string | null
          id: string
          likes_count: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          guest_name?: string | null
          id?: string
          likes_count?: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          guest_name?: string | null
          id?: string
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          created_at: string | null
          id: string
          issued_at: string | null
          student_id: string
          verification_code: string | null
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          student_id: string
          verification_code?: string | null
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          student_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_applications: {
        Row: {
          applicant_user_id: string
          application_answers: Json | null
          applied_at: string | null
          cohort_id: string
          created_at: string | null
          id: string
          interview_date: string | null
          pitch_deck_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          startup_id: string
          status: string | null
          updated_at: string | null
          video_pitch_url: string | null
        }
        Insert: {
          applicant_user_id: string
          application_answers?: Json | null
          applied_at?: string | null
          cohort_id: string
          created_at?: string | null
          id?: string
          interview_date?: string | null
          pitch_deck_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          startup_id: string
          status?: string | null
          updated_at?: string | null
          video_pitch_url?: string | null
        }
        Update: {
          applicant_user_id?: string
          application_answers?: Json | null
          applied_at?: string | null
          cohort_id?: string
          created_at?: string | null
          id?: string
          interview_date?: string | null
          pitch_deck_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          startup_id?: string
          status?: string | null
          updated_at?: string | null
          video_pitch_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_applications_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "accelerator_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_applications_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_resource_access: {
        Row: {
          cohort_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          resource_id: string
        }
        Insert: {
          cohort_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          resource_id: string
        }
        Update: {
          cohort_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_resource_access_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "accelerator_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_resource_access_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "accelerator_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_startups: {
        Row: {
          cohort_id: string
          company_id: string
          created_at: string | null
          current_stage: string | null
          demo_day_slot: string | null
          equity_given: number | null
          external_company_industry: string | null
          external_company_logo: string | null
          external_company_name: string | null
          external_company_website: string | null
          funding_received: number | null
          graduation_date: string | null
          graduation_year: number | null
          id: string
          is_manual_entry: boolean | null
          joined_at: string | null
          notes: string | null
          payment_completed_at: string | null
          payment_status: string | null
          progress_percentage: number | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          cohort_id: string
          company_id: string
          created_at?: string | null
          current_stage?: string | null
          demo_day_slot?: string | null
          equity_given?: number | null
          external_company_industry?: string | null
          external_company_logo?: string | null
          external_company_name?: string | null
          external_company_website?: string | null
          funding_received?: number | null
          graduation_date?: string | null
          graduation_year?: number | null
          id?: string
          is_manual_entry?: boolean | null
          joined_at?: string | null
          notes?: string | null
          payment_completed_at?: string | null
          payment_status?: string | null
          progress_percentage?: number | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          cohort_id?: string
          company_id?: string
          created_at?: string | null
          current_stage?: string | null
          demo_day_slot?: string | null
          equity_given?: number | null
          external_company_industry?: string | null
          external_company_logo?: string | null
          external_company_name?: string | null
          external_company_website?: string | null
          funding_received?: number | null
          graduation_date?: string | null
          graduation_year?: number | null
          id?: string
          is_manual_entry?: boolean | null
          joined_at?: string | null
          notes?: string | null
          payment_completed_at?: string | null
          payment_status?: string | null
          progress_percentage?: number | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cohort_startups_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "accelerator_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_startups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ai_analysis: Json | null
          ai_summary_id: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          funding_amount: number | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          looking_for: string[] | null
          name: string
          pitch_deck_url: string | null
          stage: Database["public"]["Enums"]["company_stage"] | null
          team_size: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_summary_id?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          funding_amount?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          looking_for?: string[] | null
          name: string
          pitch_deck_url?: string | null
          stage?: Database["public"]["Enums"]["company_stage"] | null
          team_size?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_summary_id?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          funding_amount?: number | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          looking_for?: string[] | null
          name?: string
          pitch_deck_url?: string | null
          stage?: Database["public"]["Enums"]["company_stage"] | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_ai_summary_id_fkey"
            columns: ["ai_summary_id"]
            isOneToOne: false
            referencedRelation: "ai_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      company_valuations: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          round_name: string | null
          source: string
          updated_at: string | null
          valuation_amount: number
          valuation_date: string
          verified: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          round_name?: string | null
          source?: string
          updated_at?: string | null
          valuation_amount: number
          valuation_date: string
          verified?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          round_name?: string | null
          source?: string
          updated_at?: string | null
          valuation_amount?: number
          valuation_date?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_valuations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_content: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_content?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_content?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      corporate_partners: {
        Row: {
          company_name: string
          company_size: string | null
          company_website: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          is_featured: boolean | null
          logo_url: string | null
          message: string | null
          notes: string | null
          partnership_interests: string[] | null
          partnership_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          company_website?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          message?: string | null
          notes?: string | null
          partnership_interests?: string[] | null
          partnership_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          company_website?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean | null
          logo_url?: string | null
          message?: string | null
          notes?: string | null
          partnership_interests?: string[] | null
          partnership_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_completions: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          points_earned: number | null
          user_id: string
          watch_time_minutes: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          points_earned?: number | null
          user_id: string
          watch_time_minutes?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          points_earned?: number | null
          user_id?: string
          watch_time_minutes?: number | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          certificate_issued: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          order_index: number
          resources: Json | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index: number
          resources?: Json | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          order_index?: number
          resources?: Json | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          rating: number | null
          review_text: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          created_at: string | null
          description: string
          difficulty: string | null
          duration_hours: number | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          is_published: boolean | null
          price: number | null
          rating: number | null
          thumbnail_url: string | null
          title: string
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_published?: boolean | null
          price?: number | null
          rating?: number | null
          thumbnail_url?: string | null
          title: string
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_published?: boolean | null
          price?: number | null
          rating?: number | null
          thumbnail_url?: string | null
          title?: string
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_cards: {
        Row: {
          company_name: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deal_value: number | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          position: number
          priority: string | null
          stage_id: string
          status: string | null
          tags: string[] | null
          tasks: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority?: string | null
          stage_id: string
          status?: string | null
          tags?: string[] | null
          tasks?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority?: string | null
          stage_id?: string
          status?: string | null
          tags?: string[] | null
          tasks?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_cards_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          pipeline_id: string
          position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          position?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          position: Json | null
          project_id: string
          thread_id: string | null
          updated_at: string
          user_avatar: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          position?: Json | null
          project_id: string
          thread_id?: string | null
          updated_at?: string
          user_avatar?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          position?: Json | null
          project_id?: string
          thread_id?: string | null
          updated_at?: string
          user_avatar?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_cursors: {
        Row: {
          id: string
          last_active: string
          position: Json
          project_id: string
          user_avatar: string | null
          user_color: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          id?: string
          last_active?: string
          position: Json
          project_id: string
          user_avatar?: string | null
          user_color: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          id?: string
          last_active?: string
          position?: Json
          project_id?: string
          user_avatar?: string | null
          user_color?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_cursors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_temporary: boolean
          project_id: string | null
          session_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          is_temporary?: boolean
          project_id?: string | null
          session_id: string
          user_id: string
          version_number: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_temporary?: boolean
          project_id?: string | null
          session_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      endorsements: {
        Row: {
          comment: string | null
          created_at: string
          endorser_id: string
          id: string
          mentor_id: string
          skill: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          endorser_id: string
          id?: string
          mentor_id: string
          skill: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          endorser_id?: string
          id?: string
          mentor_id?: string
          skill?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_external_registrations: {
        Row: {
          company: string | null
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_external_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          invitee_id: string
          inviter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          invitee_id: string
          inviter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_payments: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          event_id: string
          id: string
          payment_status: string
          platform_fee_cents: number
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          payment_status?: string
          platform_fee_cents?: number
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          payment_status?: string
          platform_fee_cents?: number
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          end_date: string
          external_registration_url: string | null
          host_id: string | null
          id: string
          is_paid: boolean
          is_public: boolean | null
          is_virtual: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          max_attendees: number | null
          meeting_room_url: string | null
          organizer_id: string
          start_date: string
          ticket_price_cents: number
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          external_registration_url?: string | null
          host_id?: string | null
          id?: string
          is_paid?: boolean
          is_public?: boolean | null
          is_virtual?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          meeting_room_url?: string | null
          organizer_id: string
          start_date: string
          ticket_price_cents?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          external_registration_url?: string | null
          host_id?: string | null
          id?: string
          is_paid?: boolean
          is_public?: boolean | null
          is_virtual?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          meeting_room_url?: string | null
          organizer_id?: string
          start_date?: string
          ticket_price_cents?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          ai_summary_id: string | null
          bookmarks_count: number | null
          cohort_data: Json | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          internship_data: Json | null
          likes_count: number | null
          media_urls: string[] | null
          post_type: Database["public"]["Enums"]["post_type"]
          room_data: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          shared_post_id: string | null
          shares_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary_id?: string | null
          bookmarks_count?: number | null
          cohort_data?: Json | null
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          room_data?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          shared_post_id?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary_id?: string | null
          bookmarks_count?: number | null
          cohort_data?: Json | null
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          room_data?: Json | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          shared_post_id?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_ai_summary_id_fkey"
            columns: ["ai_summary_id"]
            isOneToOne: false
            referencedRelation: "ai_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      genius_ai_chat_logs: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          messages: Json
          title: string
          tool_used: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          messages?: Json
          title?: string
          tool_used?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          messages?: Json
          title?: string
          tool_used?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      genius_ai_memory: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hub_applications: {
        Row: {
          admin_notes: string | null
          city: string
          country: string
          created_at: string
          digital_signature: string
          ecosystem_strength: string
          email: string
          estimated_startups: string
          full_name: string
          global_framework_readiness: string
          greatest_strength: string
          id: string
          launch_timeline: string
          leadership_style: string
          linkedin_url: string
          long_term_ambition: string
          onboarding_timeline: string
          phone: string
          primary_motivation: string
          primary_role: string
          stakeholders: string[] | null
          status: string
          team_status: string
          three_year_commitment: string
          updated_at: string
          years_experience: string
        }
        Insert: {
          admin_notes?: string | null
          city: string
          country: string
          created_at?: string
          digital_signature: string
          ecosystem_strength: string
          email: string
          estimated_startups: string
          full_name: string
          global_framework_readiness: string
          greatest_strength: string
          id?: string
          launch_timeline: string
          leadership_style: string
          linkedin_url: string
          long_term_ambition: string
          onboarding_timeline: string
          phone: string
          primary_motivation: string
          primary_role: string
          stakeholders?: string[] | null
          status?: string
          team_status: string
          three_year_commitment: string
          updated_at?: string
          years_experience: string
        }
        Update: {
          admin_notes?: string | null
          city?: string
          country?: string
          created_at?: string
          digital_signature?: string
          ecosystem_strength?: string
          email?: string
          estimated_startups?: string
          full_name?: string
          global_framework_readiness?: string
          greatest_strength?: string
          id?: string
          launch_timeline?: string
          leadership_style?: string
          linkedin_url?: string
          long_term_ambition?: string
          onboarding_timeline?: string
          phone?: string
          primary_motivation?: string
          primary_role?: string
          stakeholders?: string[] | null
          status?: string
          team_status?: string
          three_year_commitment?: string
          updated_at?: string
          years_experience?: string
        }
        Relationships: []
      }
      hub_bookings: {
        Row: {
          created_at: string
          currency: string | null
          from_datetime: string
          id: string
          notes: string | null
          payment_intent_id: string | null
          price: number | null
          provider: string
          provider_booking_id: string | null
          status: string
          to_datetime: string
          updated_at: string
          user_id: string
          venue_id: string
          venue_name: string
          workspace_type: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          from_datetime: string
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          price?: number | null
          provider?: string
          provider_booking_id?: string | null
          status?: string
          to_datetime: string
          updated_at?: string
          user_id: string
          venue_id: string
          venue_name: string
          workspace_type: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          from_datetime?: string
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          price?: number | null
          provider?: string
          provider_booking_id?: string | null
          status?: string
          to_datetime?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
          venue_name?: string
          workspace_type?: string
        }
        Relationships: []
      }
      hub_venues_cache: {
        Row: {
          address: string | null
          amenities: string[] | null
          cached_at: string
          city: string
          country: string
          created_at: string
          daily_rate_max: number | null
          daily_rate_min: number | null
          external_venue_id: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          image_url: string | null
          is_hotel: boolean
          is_professional: boolean
          latitude: number | null
          longitude: number | null
          name: string
          rating: number | null
          workspace_types: string[] | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          cached_at?: string
          city: string
          country: string
          created_at?: string
          daily_rate_max?: number | null
          daily_rate_min?: number | null
          external_venue_id?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          image_url?: string | null
          is_hotel?: boolean
          is_professional?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          rating?: number | null
          workspace_types?: string[] | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          cached_at?: string
          city?: string
          country?: string
          created_at?: string
          daily_rate_max?: number | null
          daily_rate_min?: number | null
          external_venue_id?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          image_url?: string | null
          is_hotel?: boolean
          is_professional?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          rating?: number | null
          workspace_types?: string[] | null
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          id: string
          internship_id: string
          resume_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          internship_id: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          internship_id?: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          internship_id: string
          position: number | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          internship_id: string
          position?: number | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          internship_id?: string
          position?: number | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internship_tasks_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          applications_count: number | null
          company_id: string
          compensation: string | null
          created_at: string | null
          description: string
          duration: string | null
          id: string
          location: string | null
          requirements: string[] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          applications_count?: number | null
          company_id: string
          compensation?: string | null
          created_at?: string | null
          description: string
          duration?: string | null
          id?: string
          location?: string | null
          requirements?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          applications_count?: number | null
          company_id?: string
          compensation?: string | null
          created_at?: string | null
          description?: string
          duration?: string | null
          id?: string
          location?: string | null
          requirements?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_interests: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          interest_type: string | null
          investor_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          interest_type?: string | null
          investor_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          interest_type?: string | null
          investor_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_interests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string | null
          current_value: number | null
          equity_percentage: number | null
          external_company_industry: string | null
          external_company_name: string | null
          external_company_website: string | null
          id: string
          investment_date: string | null
          investment_round: string | null
          investor_id: string
          notes: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          valuation_at_investment: number | null
          verification_data: Json | null
          verified: boolean | null
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string | null
          current_value?: number | null
          equity_percentage?: number | null
          external_company_industry?: string | null
          external_company_name?: string | null
          external_company_website?: string | null
          id?: string
          investment_date?: string | null
          investment_round?: string | null
          investor_id: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          valuation_at_investment?: number | null
          verification_data?: Json | null
          verified?: boolean | null
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string | null
          current_value?: number | null
          equity_percentage?: number | null
          external_company_industry?: string | null
          external_company_name?: string | null
          external_company_website?: string | null
          id?: string
          investment_date?: string | null
          investment_round?: string | null
          investor_id?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          valuation_at_investment?: number | null
          verification_data?: Json | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          investor_id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          investor_id: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          investor_id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      investor_profiles: {
        Row: {
          created_at: string | null
          focus_industries: string[] | null
          id: string
          investment_range_max: number | null
          investment_range_min: number | null
          portfolio_size: number | null
          preferred_industries: string[] | null
          preferred_stages: string[] | null
          total_invested: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          focus_industries?: string[] | null
          id?: string
          investment_range_max?: number | null
          investment_range_min?: number | null
          portfolio_size?: number | null
          preferred_industries?: string[] | null
          preferred_stages?: string[] | null
          total_invested?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          focus_industries?: string[] | null
          id?: string
          investment_range_max?: number | null
          investment_range_min?: number | null
          portfolio_size?: number | null
          preferred_industries?: string[] | null
          preferred_stages?: string[] | null
          total_invested?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          job_id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_id: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          job_id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number | null
          benefits: string[] | null
          category: Database["public"]["Enums"]["job_category"] | null
          company_id: string
          compensation_type: string
          created_at: string | null
          description: string
          duration: string | null
          experience_level: string | null
          external_application_url: string | null
          hourly_rate: number | null
          id: string
          is_task_based: boolean | null
          job_type: string | null
          location: string | null
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range_max: number | null
          salary_range_min: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          applications_count?: number | null
          benefits?: string[] | null
          category?: Database["public"]["Enums"]["job_category"] | null
          company_id: string
          compensation_type?: string
          created_at?: string | null
          description: string
          duration?: string | null
          experience_level?: string | null
          external_application_url?: string | null
          hourly_rate?: number | null
          id?: string
          is_task_based?: boolean | null
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          applications_count?: number | null
          benefits?: string[] | null
          category?: Database["public"]["Enums"]["job_category"] | null
          company_id?: string
          compensation_type?: string
          created_at?: string | null
          description?: string
          duration?: string | null
          experience_level?: string | null
          external_application_url?: string | null
          hourly_rate?: number | null
          id?: string
          is_task_based?: boolean | null
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          achievements_count: number | null
          courses_completed: number | null
          created_at: string
          id: string
          points: number
          rank: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements_count?: number | null
          courses_completed?: number | null
          created_at?: string
          id?: string
          points?: number
          rank?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements_count?: number | null
          courses_completed?: number | null
          created_at?: string
          id?: string
          points?: number
          rank?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lightpaper_activity: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lightpaper_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lightpaper_projects: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          last_accessed_at: string | null
          project_type: Database["public"]["Enums"]["lightpaper_project_type"]
          search_vector: unknown
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          project_type: Database["public"]["Enums"]["lightpaper_project_type"]
          search_vector?: unknown
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          project_type?: Database["public"]["Enums"]["lightpaper_project_type"]
          search_vector?: unknown
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lightpaper_share_links: {
        Row: {
          access_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          password_hash: string | null
          project_id: string
          share_token: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          password_hash?: string | null
          project_id: string
          share_token: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          password_hash?: string | null
          project_id?: string
          share_token?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lightpaper_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      live_room_participants: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      live_rooms: {
        Row: {
          api_cost_multiplier: number | null
          created_at: string | null
          creator_id: string
          current_host_id: string | null
          description: string | null
          expires_at: string | null
          for_sale: boolean | null
          government_fund_cents: number | null
          host_elected_at: string | null
          id: string
          invitation_code: string | null
          is_active: boolean | null
          is_private: boolean | null
          is_public: boolean
          join_fee_cents: number | null
          meeting_link: string
          membership_fee_cents: number | null
          name: string
          room_category: string
          sale_initiated_by: string | null
          sale_price_cents: number | null
          updated_at: string | null
          village_type: Database["public"]["Enums"]["village_type"] | null
        }
        Insert: {
          api_cost_multiplier?: number | null
          created_at?: string | null
          creator_id: string
          current_host_id?: string | null
          description?: string | null
          expires_at?: string | null
          for_sale?: boolean | null
          government_fund_cents?: number | null
          host_elected_at?: string | null
          id?: string
          invitation_code?: string | null
          is_active?: boolean | null
          is_private?: boolean | null
          is_public?: boolean
          join_fee_cents?: number | null
          meeting_link: string
          membership_fee_cents?: number | null
          name: string
          room_category?: string
          sale_initiated_by?: string | null
          sale_price_cents?: number | null
          updated_at?: string | null
          village_type?: Database["public"]["Enums"]["village_type"] | null
        }
        Update: {
          api_cost_multiplier?: number | null
          created_at?: string | null
          creator_id?: string
          current_host_id?: string | null
          description?: string | null
          expires_at?: string | null
          for_sale?: boolean | null
          government_fund_cents?: number | null
          host_elected_at?: string | null
          id?: string
          invitation_code?: string | null
          is_active?: boolean | null
          is_private?: boolean | null
          is_public?: boolean
          join_fee_cents?: number | null
          meeting_link?: string
          membership_fee_cents?: number | null
          name?: string
          room_category?: string
          sale_initiated_by?: string | null
          sale_price_cents?: number | null
          updated_at?: string | null
          village_type?: Database["public"]["Enums"]["village_type"] | null
        }
        Relationships: []
      }
      market_themes: {
        Row: {
          created_at: string | null
          description: string | null
          ems_score: number | null
          id: string
          last_updated: string | null
          name: string
          trend_direction: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ems_score?: number | null
          id?: string
          last_updated?: string | null
          name: string
          trend_direction?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ems_score?: number | null
          id?: string
          last_updated?: string | null
          name?: string
          trend_direction?: string | null
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          mentor_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          mentor_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          mentor_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          average_rating: number | null
          created_at: string | null
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          is_accepting_mentees: boolean | null
          max_mentees: number | null
          scheduling_link: string | null
          success_stories: string[] | null
          total_mentees: number | null
          total_sessions: number | null
          updated_at: string | null
          user_id: string
          years_of_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          created_at?: string | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_accepting_mentees?: boolean | null
          max_mentees?: number | null
          scheduling_link?: string | null
          success_stories?: string[] | null
          total_mentees?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id: string
          years_of_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          created_at?: string | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_accepting_mentees?: boolean | null
          max_mentees?: number | null
          scheduling_link?: string | null
          success_stories?: string[] | null
          total_mentees?: number | null
          total_sessions?: number | null
          updated_at?: string | null
          user_id?: string
          years_of_experience?: number | null
        }
        Relationships: []
      }
      mentoring_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          host_id: string | null
          id: string
          meeting_link: string | null
          mentee_id: string
          mentor_id: string
          mentorship_id: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id?: string | null
          id?: string
          meeting_link?: string | null
          mentee_id: string
          mentor_id: string
          mentorship_id?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          host_id?: string | null
          id?: string
          meeting_link?: string | null
          mentee_id?: string
          mentor_id?: string
          mentorship_id?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentoring_sessions_mentorship_id_fkey"
            columns: ["mentorship_id"]
            isOneToOne: false
            referencedRelation: "mentorship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_relationships: {
        Row: {
          created_at: string | null
          end_date: string | null
          goals: string | null
          id: string
          mentee_id: string
          mentor_id: string
          notes: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          goals?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          goals?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          original_language: string | null
          read: boolean | null
          receiver_id: string
          sender_id: string
          sentiment_score: number | null
          translated: boolean | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          original_language?: string | null
          read?: boolean | null
          receiver_id: string
          sender_id: string
          sentiment_score?: number | null
          translated?: boolean | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          original_language?: string | null
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
          sentiment_score?: number | null
          translated?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          module_id: string
          notes: string | null
          student_id: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          module_id: string
          notes?: string | null
          student_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          student_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_accounts: {
        Row: {
          account_status: string
          country: string | null
          created_at: string
          id: string
          stripe_connect_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          country?: string | null
          created_at?: string
          id?: string
          stripe_connect_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          country?: string | null
          created_at?: string
          id?: string
          stripe_connect_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          id: string
          source: string
          status: string
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          id?: string
          source?: string
          status?: string
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          source?: string
          status?: string
          stripe_transfer_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pdf_comment_replies: {
        Row: {
          comment_id: string | null
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "pdf_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          page_number: number
          resolved: boolean | null
          session_id: string
          updated_at: string | null
          user_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          page_number: number
          resolved?: boolean | null
          session_id: string
          updated_at?: string | null
          user_id: string
          x_position: number
          y_position: number
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          page_number?: number
          resolved?: boolean | null
          session_id?: string
          updated_at?: string | null
          user_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: []
      }
      pitch_meetings: {
        Row: {
          company_id: string
          created_at: string
          duration_minutes: number
          host_id: string | null
          id: string
          investor_id: string
          meeting_link: string | null
          meeting_notes: string | null
          outcome: string | null
          scheduled_date: string
          startup_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          duration_minutes?: number
          host_id?: string | null
          id?: string
          investor_id: string
          meeting_link?: string | null
          meeting_notes?: string | null
          outcome?: string | null
          scheduled_date: string
          startup_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          duration_minutes?: number
          host_id?: string | null
          id?: string
          investor_id?: string
          meeting_link?: string | null
          meeting_notes?: string | null
          outcome?: string | null
          scheduled_date?: string
          startup_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_companies: {
        Row: {
          company_logo_url: string | null
          company_name: string
          created_at: string | null
          description: string | null
          exit_status: string | null
          id: string
          industry: string | null
          investment_amount: number | null
          investment_year: number | null
          investor_id: string
          stage: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          company_logo_url?: string | null
          company_name: string
          created_at?: string | null
          description?: string | null
          exit_status?: string | null
          id?: string
          industry?: string | null
          investment_amount?: number | null
          investment_year?: number | null
          investor_id: string
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string
          created_at?: string | null
          description?: string | null
          exit_status?: string | null
          id?: string
          industry?: string | null
          investment_amount?: number | null
          investment_year?: number | null
          investor_id?: string
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string | null
          id: string
          viewed_profile_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          viewed_profile_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          viewed_profile_id?: string
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          industry: string | null
          is_online: boolean | null
          last_profile_update: string | null
          last_seen: string | null
          linkedin_url: string | null
          location: string | null
          profile_views_count: number | null
          resume_url: string | null
          update_count: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          is_online?: boolean | null
          last_profile_update?: string | null
          last_seen?: string | null
          linkedin_url?: string | null
          location?: string | null
          profile_views_count?: number | null
          resume_url?: string | null
          update_count?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          is_online?: boolean | null
          last_profile_update?: string | null
          last_seen?: string | null
          linkedin_url?: string | null
          location?: string | null
          profile_views_count?: number | null
          resume_url?: string | null
          update_count?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      project_favorites: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_favorites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      public_cohort_applications: {
        Row: {
          applied_at: string | null
          cohort_id: string | null
          created_at: string | null
          email: string
          founder_name: string
          id: string
          industry: string | null
          phone: string | null
          pitch_deck_url: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          stage: string | null
          startup_name: string
          status: string | null
          video_pitch_url: string | null
          website: string | null
          why_applying: string | null
        }
        Insert: {
          applied_at?: string | null
          cohort_id?: string | null
          created_at?: string | null
          email: string
          founder_name: string
          id?: string
          industry?: string | null
          phone?: string | null
          pitch_deck_url?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          stage?: string | null
          startup_name: string
          status?: string | null
          video_pitch_url?: string | null
          website?: string | null
          why_applying?: string | null
        }
        Update: {
          applied_at?: string | null
          cohort_id?: string | null
          created_at?: string | null
          email?: string
          founder_name?: string
          id?: string
          industry?: string | null
          phone?: string | null
          pitch_deck_url?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          stage?: string | null
          startup_name?: string
          status?: string | null
          video_pitch_url?: string | null
          website?: string | null
          why_applying?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_cohort_applications_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "accelerator_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      public_internship_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string | null
          id: string
          internship_id: string
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          internship_id: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          internship_id?: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      public_job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string | null
          id: string
          job_id: string
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_accounts: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          total_clicks: number
          total_earned_cents: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          total_clicks?: number
          total_earned_cents?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          total_clicks?: number
          total_earned_cents?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          referral_code: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          referral_code: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          referral_code?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_clicks_referral_code_fkey"
            columns: ["referral_code"]
            isOneToOne: false
            referencedRelation: "referral_accounts"
            referencedColumns: ["referral_code"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          commission_cents: number
          created_at: string
          id: string
          paid_at: string | null
          referred_user_id: string
          referrer_id: string
          status: string
          stripe_subscription_id: string | null
          subscription_amount_cents: number
          subscription_tier: string | null
        }
        Insert: {
          commission_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_user_id: string
          referrer_id: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_amount_cents?: number
          subscription_tier?: string | null
        }
        Update: {
          commission_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_user_id?: string
          referrer_id?: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_amount_cents?: number
          subscription_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referral_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_bookmarks: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          address: string | null
          author_id: string | null
          banner_url: string | null
          category: string | null
          city: string | null
          contact_email: string | null
          content: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_flagship: boolean | null
          is_official_partner: boolean | null
          is_verified: boolean | null
          journey_steps: string[] | null
          latitude: number | null
          linked_accelerator_id: string | null
          location_type: string
          logo_url: string | null
          longitude: number | null
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          author_id?: string | null
          banner_url?: string | null
          category?: string | null
          city?: string | null
          contact_email?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_flagship?: boolean | null
          is_official_partner?: boolean | null
          is_verified?: boolean | null
          journey_steps?: string[] | null
          latitude?: number | null
          linked_accelerator_id?: string | null
          location_type?: string
          logo_url?: string | null
          longitude?: number | null
          resource_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          author_id?: string | null
          banner_url?: string | null
          category?: string | null
          city?: string | null
          contact_email?: string | null
          content?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_flagship?: boolean | null
          is_official_partner?: boolean | null
          is_verified?: boolean | null
          journey_steps?: string[] | null
          latitude?: number | null
          linked_accelerator_id?: string | null
          location_type?: string
          logo_url?: string | null
          longitude?: number | null
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_linked_accelerator_id_fkey"
            columns: ["linked_accelerator_id"]
            isOneToOne: false
            referencedRelation: "accelerator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          step_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          step_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          step_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          given_by: string
          helpful_aspects: string[] | null
          id: string
          improvement_areas: string[] | null
          rating: number | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          given_by: string
          helpful_aspects?: string[] | null
          id?: string
          improvement_areas?: string[] | null
          rating?: number | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          given_by?: string
          helpful_aspects?: string[] | null
          id?: string
          improvement_areas?: string[] | null
          rating?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentoring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_advisor_assignments: {
        Row: {
          advisor_id: string
          assigned_at: string | null
          assigned_by: string
          cohort_startup_id: string
          ended_at: string | null
          expertise_area: string | null
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          advisor_id: string
          assigned_at?: string | null
          assigned_by: string
          cohort_startup_id: string
          ended_at?: string | null
          expertise_area?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          advisor_id?: string
          assigned_at?: string | null
          assigned_by?: string
          cohort_startup_id?: string
          ended_at?: string | null
          expertise_area?: string | null
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_advisor_assignments_cohort_startup_id_fkey"
            columns: ["cohort_startup_id"]
            isOneToOne: false
            referencedRelation: "cohort_startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_journey_milestones: {
        Row: {
          cohort_startup_id: string
          completed_date: string | null
          created_at: string | null
          description: string | null
          evidence_url: string | null
          id: string
          milestone_name: string
          order_index: number | null
          status: string | null
          target_date: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          cohort_startup_id: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          milestone_name: string
          order_index?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cohort_startup_id?: string
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          milestone_name?: string
          order_index?: number | null
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_journey_milestones_cohort_startup_id_fkey"
            columns: ["cohort_startup_id"]
            isOneToOne: false
            referencedRelation: "cohort_startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_mentor_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          cohort_startup_id: string
          ended_at: string | null
          focus_area: string | null
          id: string
          mentor_id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          cohort_startup_id: string
          ended_at?: string | null
          focus_area?: string | null
          id?: string
          mentor_id: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          cohort_startup_id?: string
          ended_at?: string | null
          focus_area?: string | null
          id?: string
          mentor_id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_mentor_assignments_cohort_startup_id_fkey"
            columns: ["cohort_startup_id"]
            isOneToOne: false
            referencedRelation: "cohort_startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_scores: {
        Row: {
          cc_capital_efficiency: number | null
          cc_exit_environment: number | null
          cc_founder_team_quality: number | null
          cc_intellectual_property: number | null
          cc_product_market_fit: number | null
          cc_recurring_revenue_ratio: number | null
          cc_regulatory_momentum: number | null
          cc_strategic_partnerships: number | null
          cc_supply_chain_stability: number | null
          cc_tech_replacement_risk: number | null
          cohort_startup_id: string | null
          company_coefficient: number | null
          company_id: string
          core_score: number | null
          created_at: string | null
          id: string
          market_ems_score: number | null
          notes: string | null
          primary_market: string | null
          scored_at: string | null
          scored_by: string | null
          startup_score: number | null
          traction_score: number | null
          ts_retention_rate: number | null
          ts_revenue_growth: number | null
          ts_sales_cycle_days: number | null
          ts_stage: string | null
          ts_user_pilot_count: number | null
          updated_at: string | null
          weight_alpha: number | null
          weight_beta: number | null
          weight_gamma: number | null
        }
        Insert: {
          cc_capital_efficiency?: number | null
          cc_exit_environment?: number | null
          cc_founder_team_quality?: number | null
          cc_intellectual_property?: number | null
          cc_product_market_fit?: number | null
          cc_recurring_revenue_ratio?: number | null
          cc_regulatory_momentum?: number | null
          cc_strategic_partnerships?: number | null
          cc_supply_chain_stability?: number | null
          cc_tech_replacement_risk?: number | null
          cohort_startup_id?: string | null
          company_coefficient?: number | null
          company_id: string
          core_score?: number | null
          created_at?: string | null
          id?: string
          market_ems_score?: number | null
          notes?: string | null
          primary_market?: string | null
          scored_at?: string | null
          scored_by?: string | null
          startup_score?: number | null
          traction_score?: number | null
          ts_retention_rate?: number | null
          ts_revenue_growth?: number | null
          ts_sales_cycle_days?: number | null
          ts_stage?: string | null
          ts_user_pilot_count?: number | null
          updated_at?: string | null
          weight_alpha?: number | null
          weight_beta?: number | null
          weight_gamma?: number | null
        }
        Update: {
          cc_capital_efficiency?: number | null
          cc_exit_environment?: number | null
          cc_founder_team_quality?: number | null
          cc_intellectual_property?: number | null
          cc_product_market_fit?: number | null
          cc_recurring_revenue_ratio?: number | null
          cc_regulatory_momentum?: number | null
          cc_strategic_partnerships?: number | null
          cc_supply_chain_stability?: number | null
          cc_tech_replacement_risk?: number | null
          cohort_startup_id?: string | null
          company_coefficient?: number | null
          company_id?: string
          core_score?: number | null
          created_at?: string | null
          id?: string
          market_ems_score?: number | null
          notes?: string | null
          primary_market?: string | null
          scored_at?: string | null
          scored_by?: string | null
          startup_score?: number | null
          traction_score?: number | null
          ts_retention_rate?: number | null
          ts_revenue_growth?: number | null
          ts_sales_cycle_days?: number | null
          ts_stage?: string | null
          ts_user_pilot_count?: number | null
          updated_at?: string | null
          weight_alpha?: number | null
          weight_beta?: number | null
          weight_gamma?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_scores_cohort_startup_id_fkey"
            columns: ["cohort_startup_id"]
            isOneToOne: false
            referencedRelation: "cohort_startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      student_internship_tasks: {
        Row: {
          application_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          student_id: string
          task_id: string
          time_spent_hours: number | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          student_id: string
          task_id: string
          time_spent_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          student_id?: string
          task_id?: string
          time_spent_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_internship_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_internship_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "internship_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      student_job_tasks: {
        Row: {
          application_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          student_id: string | null
          task_id: string
          time_spent_hours: number | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          student_id?: string | null
          task_id: string
          time_spent_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          student_id?: string | null
          task_id?: string
          time_spent_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_job_tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_job_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "job_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string | null
          graduation_year: number | null
          id: string
          interests: string[] | null
          last_activity_date: string | null
          learning_streak_days: number | null
          major: string | null
          skills: string[] | null
          total_certificates: number | null
          total_courses_completed: number | null
          university: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          last_activity_date?: string | null
          learning_streak_days?: number | null
          major?: string | null
          skills?: string[] | null
          total_certificates?: number | null
          total_courses_completed?: number | null
          university?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          graduation_year?: number | null
          id?: string
          interests?: string[] | null
          last_activity_date?: string | null
          learning_streak_days?: number | null
          major?: string | null
          skills?: string[] | null
          total_certificates?: number | null
          total_courses_completed?: number | null
          university?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_group_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          max_members: number | null
          name: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          max_members?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string | null
          goal_id: string
          goal_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          goal_type?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          goal_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      village_elections: {
        Row: {
          concluded_at: string | null
          created_at: string | null
          id: string
          room_id: string
          started_at: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          concluded_at?: string | null
          created_at?: string | null
          id?: string
          room_id: string
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          concluded_at?: string | null
          created_at?: string | null
          id?: string
          room_id?: string
          started_at?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "village_elections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_marketplace: {
        Row: {
          asking_price_cents: number
          buyer_id: string | null
          created_at: string | null
          description: string | null
          id: string
          platform_cut_percent: number | null
          room_id: string
          seller_id: string
          sold_at: string | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          asking_price_cents: number
          buyer_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          platform_cut_percent?: number | null
          room_id: string
          seller_id: string
          sold_at?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          asking_price_cents?: number
          buyer_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          platform_cut_percent?: number | null
          room_id?: string
          seller_id?: string
          sold_at?: string | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "village_marketplace_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_member_payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          paid_at: string | null
          payment_status: string | null
          room_id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          room_id: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          room_id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "village_member_payments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_purchases: {
        Row: {
          api_cost_multiplier: number
          base_fee_cents: number
          completed_at: string | null
          created_at: string
          id: string
          payment_status: string
          room_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_paid_cents: number | null
          user_id: string
          village_type: Database["public"]["Enums"]["village_type"]
        }
        Insert: {
          api_cost_multiplier?: number
          base_fee_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_status?: string
          room_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_paid_cents?: number | null
          user_id: string
          village_type: Database["public"]["Enums"]["village_type"]
        }
        Update: {
          api_cost_multiplier?: number
          base_fee_cents?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_status?: string
          room_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_paid_cents?: number | null
          user_id?: string
          village_type?: Database["public"]["Enums"]["village_type"]
        }
        Relationships: [
          {
            foreignKeyName: "village_purchases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_sale_votes: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          vote: boolean
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          vote: boolean
          voter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          vote?: boolean
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "village_sale_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_staff: {
        Row: {
          appointed_by: string
          created_at: string | null
          id: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          appointed_by: string
          created_at?: string | null
          id?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          appointed_by?: string
          created_at?: string | null
          id?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "village_staff_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      village_votes: {
        Row: {
          candidate_id: string
          created_at: string | null
          election_id: string
          id: string
          voter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          election_id: string
          id?: string
          voter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          election_id?: string
          id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "village_votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "village_elections"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_email: string
        }
        Returns: undefined
      }
      cleanup_old_cursors: { Args: never; Returns: undefined }
      cleanup_stale_online_status: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles_batch: {
        Args: { user_ids: string[] }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_lightpaper_projects: {
        Args: { search_query: string; user_id_param: string }
        Returns: {
          content: Json
          id: string
          last_accessed_at: string
          project_type: string
          rank: number
          title: string
          updated_at: string
        }[]
      }
      send_notification_email: {
        Args: {
          actor_avatar_url?: string
          actor_name?: string
          actor_role?: string
          notification_message: string
          notification_title: string
          notification_type: string
          recipient_name?: string
          user_email: string
        }
        Returns: undefined
      }
      update_user_online_status: {
        Args: { p_is_online: boolean; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "startup"
        | "investor"
        | "mentor"
        | "advisor"
        | "student"
        | "accelerator"
        | "admin"
      company_stage: "idea" | "prototype" | "mvp" | "growth" | "scale"
      job_category: "full-time" | "part-time" | "contract" | "internship"
      lightpaper_project_type:
        | "document"
        | "spreadsheet"
        | "presentation"
        | "pdf"
        | "sign"
      post_type:
        | "update"
        | "milestone"
        | "internship"
        | "resource"
        | "announcement"
        | "short"
        | "event"
        | "journey_completion"
        | "cohort"
        | "live_room"
      village_type: "democratic_republic" | "merchant_village"
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
  public: {
    Enums: {
      app_role: [
        "startup",
        "investor",
        "mentor",
        "advisor",
        "student",
        "accelerator",
        "admin",
      ],
      company_stage: ["idea", "prototype", "mvp", "growth", "scale"],
      job_category: ["full-time", "part-time", "contract", "internship"],
      lightpaper_project_type: [
        "document",
        "spreadsheet",
        "presentation",
        "pdf",
        "sign",
      ],
      post_type: [
        "update",
        "milestone",
        "internship",
        "resource",
        "announcement",
        "short",
        "event",
        "journey_completion",
        "cohort",
        "live_room",
      ],
      village_type: ["democratic_republic", "merchant_village"],
    },
  },
} as const
