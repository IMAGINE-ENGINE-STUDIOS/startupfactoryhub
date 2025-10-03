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
      companies: {
        Row: {
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
          stage: Database["public"]["Enums"]["company_stage"] | null
          team_size: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
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
          stage?: Database["public"]["Enums"]["company_stage"] | null
          team_size?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
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
          stage?: Database["public"]["Enums"]["company_stage"] | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
      feed_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          internship_data: Json | null
          media_urls: string[] | null
          post_type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          internship_data?: Json | null
          media_urls?: string[] | null
          post_type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "startup" | "investor" | "mentor" | "advisor" | "student"
      company_stage: "idea" | "prototype" | "mvp" | "growth" | "scale"
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
