// Supabase auto-generated types stub — replace with `supabase gen types` output
// once your Supabase project is configured.

export type Database = {
  public: {
    Tables: {
      shift_reports: {
        Row: {
          id: string
          plant_id: string
          date: string
          shift: 'day' | 'evening' | 'night'
          supervisor_name: string
          units_produced: number | null
          units_target: number | null
          downtime_events: unknown
          safety_incidents: unknown
          quality_issues: unknown
          maintenance_requests: unknown
          handoff_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['shift_reports']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['shift_reports']['Insert']>
      }
      plants: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          shift_names: unknown
          production_targets: unknown
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plants']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'supervisor' | 'viewer'
          plant_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      create_plant_and_admin: {
        Args: {
          p_plant_name: string
          p_full_name: string
          p_user_id: string
          p_plan: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
