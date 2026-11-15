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
    PostgrestVersion: "14.18"
  }
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
      billing: {
        Row: {
          business_id: string
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          payroll_settings: Json | null
          roles: string[]
          state: string | null
          team_token: string
          timezone: string
          week_start_day: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          payroll_settings?: Json | null
          roles?: string[]
          state?: string | null
          team_token?: string
          timezone?: string
          week_start_day?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          payroll_settings?: Json | null
          roles?: string[]
          state?: string | null
          team_token?: string
          timezone?: string
          week_start_day?: number
        }
        Relationships: []
      }
      day_notes: {
        Row: {
          business_id: string
          created_at: string
          date: string
          id: string
          note: string
        }
        Insert: {
          business_id: string
          created_at?: string
          date: string
          id?: string
          note: string
        }
        Update: {
          business_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          business_id: string
          created_at: string
          id: string
          published_at: string | null
          status: string
          week_start: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          status?: string
          week_start: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          status?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          business_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          role: string | null
          roster_id: string
          staff_id: string | null
          start_time: string
        }
        Insert: {
          break_minutes?: number
          business_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          role?: string | null
          roster_id: string
          staff_id?: string | null
          start_time: string
        }
        Update: {
          break_minutes?: number
          business_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          role?: string | null
          roster_id?: string
          staff_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_roster_id_business_id_fkey"
            columns: ["roster_id", "business_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "shifts_staff_id_business_id_fkey"
            columns: ["staff_id", "business_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          default_role: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          mobile: string | null
          name: string
          payroll_id: string | null
          roster_token: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          default_role?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          mobile?: string | null
          name: string
          payroll_id?: string | null
          roster_token?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          default_role?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          mobile?: string | null
          name?: string
          payroll_id?: string | null
          roster_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off: {
        Row: {
          business_id: string
          created_at: string
          end_date: string
          id: string
          reason: string
          staff_id: string
          start_date: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          end_date: string
          id?: string
          reason?: string
          staff_id: string
          start_date: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          end_date?: string
          id?: string
          reason?: string
          staff_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_staff_id_business_id_fkey"
            columns: ["staff_id", "business_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id", "business_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_staff_calendar: { Args: { p_token: string }; Returns: Json }
      set_week_start_day: { Args: { p_day: number }; Returns: number }
      get_staff_roster: {
        Args: { p_token: string; p_week?: string }
        Returns: Json
      }
      get_team_roster: {
        Args: { p_token: string; p_week?: string }
        Returns: Json
      }
      request_time_off: {
        Args: {
          p_end: string
          p_reason?: string
          p_start: string
          p_token: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {},
  },
} as const
