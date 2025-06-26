export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      friend_requests: {
        Row: {
          id: string
          receiver_id: string | null
          sender_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          receiver_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          total_xp: number | null
          updated_at: string | null
          username: string | null
          streak: number | null
          habits_completed_percent: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
          streak?: number | null
          habits_completed_percent?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
          streak?: number | null
          habits_completed_percent?: number | null
        }
        Relationships: []
      }
      user_habits: {
        Row: {
          created_at: string | null
          difficulty: string | null
          frequency: string | null
          habit_name: string
          habit_type: string | null
          id: string
          reminder_time: string | null
          streak_goal: number | null
          time_estimate_minutes: number | null
          user_id: string | null
          completed_today: boolean | null
          streak: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          frequency?: string | null
          habit_name: string
          habit_type?: string | null
          id?: string
          reminder_time?: string | null
          streak_goal?: number | null
          time_estimate_minutes?: number | null
          user_id?: string | null
          completed_today?: boolean | null
          streak?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          frequency?: string | null
          habit_name?: string
          habit_type?: string | null
          id?: string
          reminder_time?: string | null
          streak_goal?: number | null
          time_estimate_minutes?: number | null
          user_id?: string | null
          completed_today?: boolean | null
          streak?: number | null
        }
        Relationships: []
      }
      user_news_preferences: {
        Row: {
          format: string | null
          frequency: string | null
          interests: string[] | null
          preferred_time: string | null
          user_id: string
        }
        Insert: {
          format?: string | null
          frequency?: string | null
          interests?: string[] | null
          preferred_time?: string | null
          user_id: string
        }
        Update: {
          format?: string | null
          frequency?: string | null
          interests?: string[] | null
          preferred_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          profile_visibility: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          profile_visibility?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          profile_visibility?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_key: string;
          unlocked: boolean;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_key: string;
          unlocked?: boolean;
          unlocked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_key?: string;
          unlocked?: boolean;
          unlocked_at?: string | null;
        };
        Relationships: [];
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
