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
      achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_profiles: {
        Row: {
          emergency_fund_status: string | null
          financial_goals: Json | null
          goal_timeframe: string | null
          id: string
          investment_value: number | null
          monthly_expenses: number | null
          monthly_income: number | null
          net_worth: number | null
          notes: string | null
          preferred_budgeting: string | null
          risk_tolerance: string | null
          savings_balance: number | null
          spending_habits: Json | null
          total_assets: number | null
          total_liabilities: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          emergency_fund_status?: string | null
          financial_goals?: Json | null
          goal_timeframe?: string | null
          id?: string
          investment_value?: number | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          net_worth?: number | null
          notes?: string | null
          preferred_budgeting?: string | null
          risk_tolerance?: string | null
          savings_balance?: number | null
          spending_habits?: Json | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          emergency_fund_status?: string | null
          financial_goals?: Json | null
          goal_timeframe?: string | null
          id?: string
          investment_value?: number | null
          monthly_expenses?: number | null
          monthly_income?: number | null
          net_worth?: number | null
          notes?: string | null
          preferred_budgeting?: string | null
          risk_tolerance?: string | null
          savings_balance?: number | null
          spending_habits?: Json | null
          total_assets?: number | null
          total_liabilities?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      journal_config: {
        Row: {
          created_at: string | null
          q_challenged: boolean
          q_feeling: boolean
          q_goals: boolean
          q_grateful: boolean
          q_highlight: boolean
          q_improve: boolean
          q_learned: boolean
          q_letgo: boolean
          q_selfcare: boolean
          q_smile: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          q_challenged?: boolean
          q_feeling?: boolean
          q_goals?: boolean
          q_grateful?: boolean
          q_highlight?: boolean
          q_improve?: boolean
          q_learned?: boolean
          q_letgo?: boolean
          q_selfcare?: boolean
          q_smile?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          q_challenged?: boolean
          q_feeling?: boolean
          q_goals?: boolean
          q_grateful?: boolean
          q_highlight?: boolean
          q_improve?: boolean
          q_learned?: boolean
          q_letgo?: boolean
          q_selfcare?: boolean
          q_smile?: boolean
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          affiliation: string | null
          comment: string
          created_at: string | null
          id: string
          name: string
          stars: number
          user_id: string | null
        }
        Insert: {
          affiliation?: string | null
          comment: string
          created_at?: string | null
          id?: string
          name: string
          stars: number
          user_id?: string | null
        }
        Update: {
          affiliation?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          name?: string
          stars?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          habits_completed_percent: number
          id: string
          level: number | null
          streak: number
          total_xp: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          habits_completed_percent?: number
          id: string
          level?: number | null
          streak?: number
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          habits_completed_percent?: number
          id?: string
          level?: number | null
          streak?: number
          total_xp?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_fitness_goals: {
        Row: {
          cardio_preferences: string[] | null
          created_at: string | null
          current_weight: number | null
          days_per_week: number | null
          end_date: string | null
          equipment_available: string[] | null
          goal_type: string | null
          height: number | null
          id: string
          injury_limitations: string | null
          intensity: string | null
          minutes_per_session: number | null
          muscle_focus: string[] | null
          notes: string | null
          preferred_time_of_day: string | null
          start_date: string | null
          target_weight: number | null
          user_id: string | null
        }
        Insert: {
          cardio_preferences?: string[] | null
          created_at?: string | null
          current_weight?: number | null
          days_per_week?: number | null
          end_date?: string | null
          equipment_available?: string[] | null
          goal_type?: string | null
          height?: number | null
          id?: string
          injury_limitations?: string | null
          intensity?: string | null
          minutes_per_session?: number | null
          muscle_focus?: string[] | null
          notes?: string | null
          preferred_time_of_day?: string | null
          start_date?: string | null
          target_weight?: number | null
          user_id?: string | null
        }
        Update: {
          cardio_preferences?: string[] | null
          created_at?: string | null
          current_weight?: number | null
          days_per_week?: number | null
          end_date?: string | null
          equipment_available?: string[] | null
          goal_type?: string | null
          height?: number | null
          id?: string
          injury_limitations?: string | null
          intensity?: string | null
          minutes_per_session?: number | null
          muscle_focus?: string[] | null
          notes?: string | null
          preferred_time_of_day?: string | null
          start_date?: string | null
          target_weight?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_fitness_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_habits: {
        Row: {
          completed_today: boolean | null
          created_at: string | null
          difficulty: string | null
          frequency: string | null
          habit_name: string
          habit_type: string | null
          id: string
          reminder_time: string | null
          streak: number | null
          user_id: string | null
          xp_value: number | null
        }
        Insert: {
          completed_today?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          frequency?: string | null
          habit_name: string
          habit_type?: string | null
          id?: string
          reminder_time?: string | null
          streak?: number | null
          user_id?: string | null
          xp_value?: number | null
        }
        Update: {
          completed_today?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          frequency?: string | null
          habit_name?: string
          habit_type?: string | null
          id?: string
          reminder_time?: string | null
          streak?: number | null
          user_id?: string | null
          xp_value?: number | null
        }
        Relationships: []
      }
      user_meals: {
        Row: {
          calories: number | null
          carbs: number | null
          completed: boolean | null
          created_at: string | null
          date: string
          date_only: string | null
          description: string | null
          fat: number | null
          id: string
          ingredients: Json | null
          meal_type: string | null
          protein: number | null
          recipe: string | null
          serving_size: string | null
          tags: string[] | null
          time: string | null
          user_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          date_only?: string | null
          description?: string | null
          fat?: number | null
          id?: string
          ingredients?: Json | null
          meal_type?: string | null
          protein?: number | null
          recipe?: string | null
          serving_size?: string | null
          tags?: string[] | null
          time?: string | null
          user_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          date_only?: string | null
          description?: string | null
          fat?: number | null
          id?: string
          ingredients?: Json | null
          meal_type?: string | null
          protein?: number | null
          recipe?: string | null
          serving_size?: string | null
          tags?: string[] | null
          time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_news: {
        Row: {
          created_at: string | null
          date: string
          headline: string | null
          id: string
          read: boolean | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          headline?: string | null
          id?: string
          read?: boolean | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          headline?: string | null
          id?: string
          read?: boolean | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_news_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      user_nutrition_preferences: {
        Row: {
          allergies: string[] | null
          calories_target: number | null
          carbs_target: number | null
          created_at: string | null
          dietary_restrictions: string[] | null
          fat_target: number | null
          fiber_target: number | null
          id: string
          notes: string | null
          protein_target: number | null
          sodium_limit: number | null
          sugar_limit: number | null
          user_id: string | null
        }
        Insert: {
          allergies?: string[] | null
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          notes?: string | null
          protein_target?: number | null
          sodium_limit?: number | null
          sugar_limit?: number | null
          user_id?: string | null
        }
        Update: {
          allergies?: string[] | null
          calories_target?: number | null
          carbs_target?: number | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          fat_target?: number | null
          fiber_target?: number | null
          id?: string
          notes?: string | null
          protein_target?: number | null
          sodium_limit?: number | null
          sugar_limit?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_nutrition_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      user_workouts: {
        Row: {
          calories_burned: number | null
          completed: boolean | null
          created_at: string | null
          date: string
          details: Json | null
          duration: number | null
          id: string
          reps: number | null
          sets: number | null
          user_id: string | null
          week_start: string | null
          workout_type: string | null
        }
        Insert: {
          calories_burned?: number | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          details?: Json | null
          duration?: number | null
          id?: string
          reps?: number | null
          sets?: number | null
          user_id?: string | null
          week_start?: string | null
          workout_type?: string | null
        }
        Update: {
          calories_burned?: number | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          details?: Json | null
          duration?: number | null
          id?: string
          reps?: number | null
          sets?: number | null
          user_id?: string | null
          week_start?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
