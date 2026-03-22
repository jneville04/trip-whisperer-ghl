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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_settings: {
        Row: {
          accent_color: string
          agency_logo_url: string
          agency_name: string
          agent_email: string
          agent_name: string
          agent_phone: string
          agent_photo_url: string
          agent_title: string
          agent_website: string
          created_at: string
          default_booking_behavior: string
          default_booking_form_url: string
          default_checkout_url: string
          default_payment_link: string
          ghl_access_token: string
          ghl_connected: boolean
          ghl_location_id: string
          ghl_webhook_url: string
          id: string
          logo_url: string
          primary_color: string
          secondary_color: string
          show_agency_name_with_logo: boolean
          stripe_account_id: string
          stripe_connected: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          agency_logo_url?: string
          agency_name?: string
          agent_email?: string
          agent_name?: string
          agent_phone?: string
          agent_photo_url?: string
          agent_title?: string
          agent_website?: string
          created_at?: string
          default_booking_behavior?: string
          default_booking_form_url?: string
          default_checkout_url?: string
          default_payment_link?: string
          ghl_access_token?: string
          ghl_connected?: boolean
          ghl_location_id?: string
          ghl_webhook_url?: string
          id?: string
          logo_url?: string
          primary_color?: string
          secondary_color?: string
          show_agency_name_with_logo?: boolean
          stripe_account_id?: string
          stripe_connected?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          agency_logo_url?: string
          agency_name?: string
          agent_email?: string
          agent_name?: string
          agent_phone?: string
          agent_photo_url?: string
          agent_title?: string
          agent_website?: string
          created_at?: string
          default_booking_behavior?: string
          default_booking_form_url?: string
          default_checkout_url?: string
          default_payment_link?: string
          ghl_access_token?: string
          ghl_connected?: boolean
          ghl_location_id?: string
          ghl_webhook_url?: string
          id?: string
          logo_url?: string
          primary_color?: string
          secondary_color?: string
          show_agency_name_with_logo?: boolean
          stripe_account_id?: string
          stripe_connected?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          accent_color: string
          admin_photo_url: string | null
          app_name: string
          favicon_url: string | null
          font_body: string
          font_display: string
          ghl_form_approve: string | null
          ghl_form_revision: string | null
          ghl_webhook_approve: string | null
          ghl_webhook_revision: string | null
          helpdesk_email: string | null
          helpdesk_message: string | null
          helpdesk_phone: string | null
          id: number
          login_button_color: string | null
          login_hero_position: string | null
          login_hero_url: string | null
          login_message: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          tagline: string
          updated_at: string | null
        }
        Insert: {
          accent_color?: string
          admin_photo_url?: string | null
          app_name?: string
          favicon_url?: string | null
          font_body?: string
          font_display?: string
          ghl_form_approve?: string | null
          ghl_form_revision?: string | null
          ghl_webhook_approve?: string | null
          ghl_webhook_revision?: string | null
          helpdesk_email?: string | null
          helpdesk_message?: string | null
          helpdesk_phone?: string | null
          id?: number
          login_button_color?: string | null
          login_hero_position?: string | null
          login_hero_url?: string | null
          login_message?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string
          updated_at?: string | null
        }
        Update: {
          accent_color?: string
          admin_photo_url?: string | null
          app_name?: string
          favicon_url?: string | null
          font_body?: string
          font_display?: string
          ghl_form_approve?: string | null
          ghl_form_revision?: string | null
          ghl_webhook_approve?: string | null
          ghl_webhook_revision?: string | null
          helpdesk_email?: string | null
          helpdesk_message?: string | null
          helpdesk_phone?: string | null
          id?: number
          login_button_color?: string | null
          login_hero_position?: string | null
          login_hero_url?: string | null
          login_message?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          brand_color_hex: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          webhook_url: string | null
        }
        Insert: {
          brand_color_hex?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          webhook_url?: string | null
        }
        Update: {
          brand_color_hex?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          booking_url: string
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          status: string
        }
        Insert: {
          agency_name?: string | null
          booking_url?: string
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
        }
        Update: {
          agency_name?: string | null
          booking_url?: string
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_name: string | null
          created_at: string | null
          data: Json
          destination: string | null
          id: string
          share_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          data?: Json
          destination?: string | null
          id?: string
          share_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          data?: Json
          destination?: string | null
          id?: string
          share_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      snapshots: {
        Row: {
          created_at: string | null
          final_price: number | null
          frozen_content: Json
          id: string
          selection_summary: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          final_price?: number | null
          frozen_content: Json
          id?: string
          selection_summary?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          final_price?: number | null
          frozen_content?: Json
          id?: string
          selection_summary?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          archived_at: string | null
          created_at: string | null
          current_occupancy: number | null
          draft_data: Json | null
          id: string
          max_capacity: number | null
          org_id: string | null
          public_slug: string | null
          published_data: Json | null
          status: string | null
          traveler_email: string
          traveler_phone: string
          trip_type: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          draft_data?: Json | null
          id?: string
          max_capacity?: number | null
          org_id?: string | null
          public_slug?: string | null
          published_data?: Json | null
          status?: string | null
          traveler_email?: string
          traveler_phone?: string
          trip_type?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          current_occupancy?: number | null
          draft_data?: Json | null
          id?: string
          max_capacity?: number | null
          org_id?: string | null
          public_slug?: string | null
          published_data?: Json | null
          status?: string | null
          traveler_email?: string
          traveler_phone?: string
          trip_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_share_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
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
      app_role: ["admin", "user"],
    },
  },
} as const
