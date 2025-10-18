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
      events: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_public: boolean | null
          location: string | null
          max_attendees: number | null
          organizer_id: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          ai_summary_id: string | null
          bookmarks_count: number | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          internship_data: Json | null
          likes_count: number | null
          media_urls: string[] | null
          post_type: Database["public"]["Enums"]["post_type"]
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
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
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
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          likes_count?: number | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
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
          company_id: string
          created_at: string | null
          equity_percentage: number | null
          id: string
          investment_date: string | null
          investor_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          equity_percentage?: number | null
          id?: string
          investment_date?: string | null
          investor_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          equity_percentage?: number | null
          id?: string
          investment_date?: string | null
          investor_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
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
      pdf_signatures: {
        Row: {
          document_id: string
          id: string
          page_number: number
          position: Json
          signature_data: string
          signature_type: string
          signed_at: string | null
          signer_email: string | null
          signer_name: string
        }
        Insert: {
          document_id: string
          id?: string
          page_number: number
          position: Json
          signature_data: string
          signature_type: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
        }
        Update: {
          document_id?: string
          id?: string
          page_number?: number
          position?: Json
          signature_data?: string
          signature_type?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_meetings: {
        Row: {
          company_id: string
          created_at: string
          duration_minutes: number
          id: string
          investor_id: string
          meeting_link: string | null
          meeting_notes: string | null
          scheduled_date: string
          startup_id: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          duration_minutes?: number
          id?: string
          investor_id: string
          meeting_link?: string | null
          meeting_notes?: string | null
          scheduled_date: string
          startup_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          investor_id?: string
          meeting_link?: string | null
          meeting_notes?: string | null
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
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          last_profile_update: string | null
          linkedin_url: string | null
          location: string | null
          profile_views_count: number | null
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
          last_profile_update?: string | null
          linkedin_url?: string | null
          location?: string | null
          profile_views_count?: number | null
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
          last_profile_update?: string | null
          linkedin_url?: string | null
          location?: string | null
          profile_views_count?: number | null
          update_count?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      shared_pdf_documents: {
        Row: {
          annotations: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          owner_id: string
          pdf_content: Json
          project_id: string | null
          share_token: string
          signatures: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          annotations?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id: string
          pdf_content: Json
          project_id?: string | null
          share_token?: string
          signatures?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          annotations?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string
          pdf_content?: Json
          project_id?: string | null
          share_token?: string
          signatures?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_pdf_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "lightpaper_projects"
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
      study_groups: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_notification_email: {
        Args: {
          notification_message: string
          notification_title: string
          notification_type: string
          user_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "startup" | "investor" | "mentor" | "advisor" | "student"
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
      app_role: ["startup", "investor", "mentor", "advisor", "student"],
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
      ],
    },
  },
} as const
