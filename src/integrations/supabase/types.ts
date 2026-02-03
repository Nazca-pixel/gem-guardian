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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accessories: {
        Row: {
          bxp_required: number
          created_at: string
          description: string | null
          emoji: string
          id: string
          name: string
        }
        Insert: {
          bxp_required?: number
          created_at?: string
          description?: string | null
          emoji: string
          id?: string
          name: string
        }
        Update: {
          bxp_required?: number
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: string
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
        }
        Insert: {
          badge_type: string
          created_at?: string
          description: string
          emoji: string
          id?: string
          name: string
        }
        Update: {
          badge_type?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      companion_animals: {
        Row: {
          bxp: number
          checkin_streak: number
          consecutive_failed_months: number
          created_at: string
          current_streak: number | null
          fxp: number
          id: string
          last_activity_date: string | null
          last_checkin_date: string | null
          level: number
          longest_streak: number | null
          mood: string
          name: string
          selected_monster_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bxp?: number
          checkin_streak?: number
          consecutive_failed_months?: number
          created_at?: string
          current_streak?: number | null
          fxp?: number
          id?: string
          last_activity_date?: string | null
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number | null
          mood?: string
          name?: string
          selected_monster_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bxp?: number
          checkin_streak?: number
          consecutive_failed_months?: number
          created_at?: string
          current_streak?: number | null
          fxp?: number
          id?: string
          last_activity_date?: string | null
          last_checkin_date?: string | null
          level?: number
          longest_streak?: number | null
          mood?: string
          name?: string
          selected_monster_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          emoji: string | null
          id: string
          is_completed: boolean
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          emoji?: string | null
          id?: string
          is_completed?: boolean
          name: string
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          emoji?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string
          description: string
          emoji: string | null
          id: string
          is_income: boolean
          is_necessary: boolean
          transaction_date: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          description: string
          emoji?: string | null
          id?: string
          is_income?: boolean
          is_necessary?: boolean
          transaction_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          description?: string
          emoji?: string | null
          id?: string
          is_income?: boolean
          is_necessary?: boolean
          transaction_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_accessories: {
        Row: {
          accessory_id: string
          id: string
          is_equipped: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          accessory_id: string
          id?: string
          is_equipped?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          accessory_id?: string
          id?: string
          is_equipped?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          bxp_reward: number
          challenge_id: string
          completed_at: string | null
          created_at: string
          fxp_reward: number
          id: string
          is_completed: boolean
          progress: number
          target: number
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          bxp_reward?: number
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          fxp_reward?: number
          id?: string
          is_completed?: boolean
          progress?: number
          target: number
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          bxp_reward?: number
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          fxp_reward?: number
          id?: string
          is_completed?: boolean
          progress?: number
          target?: number
          updated_at?: string
          user_id?: string
          week_start?: string
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
      transaction_category:
        | "food"
        | "transport"
        | "entertainment"
        | "shopping"
        | "bills"
        | "health"
        | "education"
        | "savings"
        | "income"
        | "other"
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
      transaction_category: [
        "food",
        "transport",
        "entertainment",
        "shopping",
        "bills",
        "health",
        "education",
        "savings",
        "income",
        "other",
      ],
    },
  },
} as const
