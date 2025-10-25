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
      access_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_used: boolean
          key: string
          type: Database["public"]["Enums"]["access_key_type"]
          used_at: string | null
          used_by: string | null
          used_by_nickname: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          key: string
          type: Database["public"]["Enums"]["access_key_type"]
          used_at?: string | null
          used_by?: string | null
          used_by_nickname?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean
          key?: string
          type?: Database["public"]["Enums"]["access_key_type"]
          used_at?: string | null
          used_by?: string | null
          used_by_nickname?: string | null
        }
        Relationships: []
      }
      custom_questions: {
        Row: {
          created_at: string
          id: string
          profile_name: string
          questions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_name: string
          questions: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_name?: string
          questions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: Json
          created_at: string
          entry_type: string
          id: string
          profile_id: string
          trade_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          entry_type: string
          id?: string
          profile_id: string
          trade_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          entry_type?: string
          id?: string
          profile_id?: string
          trade_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "trading_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_key_id: string | null
          account_expires_at: string | null
          created_at: string
          id: string
          nickname: string | null
          updated_at: string
        }
        Insert: {
          access_key_id?: string | null
          account_expires_at?: string | null
          created_at?: string
          id: string
          nickname?: string | null
          updated_at?: string
        }
        Update: {
          access_key_id?: string | null
          account_expires_at?: string | null
          created_at?: string
          id?: string
          nickname?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_key_id_fkey"
            columns: ["access_key_id"]
            isOneToOne: false
            referencedRelation: "access_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          date: string
          entry_price: number | null
          exit_price: number | null
          id: string
          mistake: string | null
          profile_id: string
          profit: number
          quantity: number | null
          rating: number | null
          setup: string | null
          side: string | null
          stop_loss: number | null
          symbol: string
          target: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          mistake?: string | null
          profile_id: string
          profit: number
          quantity?: number | null
          rating?: number | null
          setup?: string | null
          side?: string | null
          stop_loss?: number | null
          symbol: string
          target?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          mistake?: string | null
          profile_id?: string
          profit?: number
          quantity?: number | null
          rating?: number | null
          setup?: string | null
          side?: string | null
          stop_loss?: number | null
          symbol?: string
          target?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "trading_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_profiles: {
        Row: {
          commission: number | null
          created_at: string
          id: string
          name: string
          selected_question_profile: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission?: number | null
          created_at?: string
          id?: string
          name: string
          selected_question_profile?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission?: number | null
          created_at?: string
          id?: string
          name?: string
          selected_question_profile?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_access_key: {
        Args: { p_key: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      access_key_type:
        | "24_hours"
        | "72_hours"
        | "weekly"
        | "monthly"
        | "unlimited"
      app_role: "admin" | "user"
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
      access_key_type: [
        "24_hours",
        "72_hours",
        "weekly",
        "monthly",
        "unlimited",
      ],
      app_role: ["admin", "user"],
    },
  },
} as const
