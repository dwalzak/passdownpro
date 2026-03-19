// ─── Shift Report ────────────────────────────────────────────────────────────

export type ShiftType = 'day' | 'evening' | 'night'

export interface DowntimeEvent {
  machine: string
  duration_minutes: number
  reason: string
}

export interface SafetyIncident {
  count: number
  description: string
}

export interface QualityIssue {
  reject_count: number
  description: string
}

export interface MaintenanceRequest {
  equipment: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

export interface ShiftReportForm {
  // Header
  date: string                     // ISO date string YYYY-MM-DD
  shift: ShiftType
  supervisor_name: string

  // Production
  units_produced: number | ''
  units_target: number | ''

  // Downtime
  downtime_events: DowntimeEvent[]

  // Safety
  safety_incidents: SafetyIncident

  // Quality
  quality_issues: QualityIssue

  // Maintenance
  maintenance_requests: MaintenanceRequest[]

  // Notes
  handoff_notes: string
}

export interface ShiftReport extends ShiftReportForm {
  id: string
  plant_id: string
  created_at: string
  updated_at: string
}

// ─── Plant ───────────────────────────────────────────────────────────────────

export interface Plant {
  id: string
  name: string
  logo_url: string | null
  shift_names: Record<ShiftType, string>
  production_targets: Record<ShiftType, number>
  created_at: string
}

// ─── User Profile ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'supervisor' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  plant_id: string
  created_at: string
}
