export type Database = {
  public: {
    Tables: {
      plants: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          stripe_customer_id: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'past_due' | 'canceled'
          shift_names: string[]
          production_target: number | null
          maintenance_emails: string[]
          manager_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['plants']['Row']>
        Update: Partial<Database['public']['Tables']['plants']['Row']>
      }
      user_profiles: {
        Row: {
          id: string
          plant_id: string | null
          full_name: string | null
          role: 'admin' | 'supervisor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']>
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      shift_reports: {
        Row: {
          id: string
          plant_id: string
          submitted_by: string | null
          report_date: string
          shift: 'day' | 'evening' | 'night'
          supervisor_name: string
          units_produced: number | null
          units_target: number | null
          safety_incident_count: number
          safety_description: string | null // encrypted field in migration 004 would be bytea
          reject_count: number
          quality_description: string | null
          handoff_notes: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['shift_reports']['Row']>
        Update: Partial<Database['public']['Tables']['shift_reports']['Row']>
      }
      equipment: {
        Row: {
          id: string
          plant_id: string
          name: string
          category: string | null
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['equipment']['Row']>
        Update: Partial<Database['public']['Tables']['equipment']['Row']>
      }
      downtime_events: {
        Row: {
          id: string
          shift_report_id: string
          plant_id: string
          machine: string
          duration_minutes: number
          reason: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['downtime_events']['Row']>
        Update: Partial<Database['public']['Tables']['downtime_events']['Row']>
      }
      maintenance_requests: {
        Row: {
          id: string
          shift_report_id: string
          plant_id: string
          equipment_id: string | null
          equipment_name: string
          description: string
          priority: 'low' | 'medium' | 'high'
          email_sent: boolean
          email_sent_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['maintenance_requests']['Row']>
        Update: Partial<Database['public']['Tables']['maintenance_requests']['Row']>
      }
      stripe_events: {
        Row: {
          id: string
          type: string
          payload: any
          processed_at: string
        }
        Insert: Partial<Database['public']['Tables']['stripe_events']['Row']>
        Update: Partial<Database['public']['Tables']['stripe_events']['Row']>
      }
    }
    Views: {
      my_plant_limits: {
        Row: {
          plant_id: string
          subscription_tier: string
          subscription_status: string
          max_users: number | null
          history_days: number | null
          can_export_csv: boolean
          can_email_pdf: boolean
          can_multi_plant: boolean
          can_custom_branding: boolean
          can_api_access: boolean
        }
      }
    }
    Functions: {
      create_plant_and_admin: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_plant_name: string
          p_plan: string
        }
        Returns: void
      }
      my_plant_id: {
        Args: {}
        Returns: string
      }
      my_role: {
        Args: {}
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
