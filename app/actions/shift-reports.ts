'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { ShiftReportForm } from '@/types'

/**
 * Submit a shift report with its child events.
 */
export async function submitShiftReport(formData: ShiftReportForm) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // 1. Get user's plant_id
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('plant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.plant_id) {
    throw new Error('User profile or plant not found')
  }

  const plantId = profile.plant_id

  // 2. Insert main report
  // Note: triggers in the DB will handle encryption of safety/quality/handoff descriptions.
  const { data: report, error: reportError } = await supabase
    .from('shift_reports')
    .insert({
      plant_id: plantId,
      submitted_by: user.id,
      report_date: formData.date,
      shift: formData.shift,
      supervisor_name: formData.supervisor_name,
      units_produced: formData.units_produced === '' ? null : formData.units_produced,
      units_target: formData.units_target === '' ? null : formData.units_target,
      safety_incident_count: formData.safety_incidents.count,
      safety_description: formData.safety_incidents.description,
      reject_count: formData.quality_issues.reject_count,
      quality_description: formData.quality_issues.description,
      handoff_notes: formData.handoff_notes,
    })
    .select()
    .single()

  if (reportError || !report) {
    throw new Error(`Failed to insert report: ${reportError.message}`)
  }

  // 3. Insert downtime events (if any)
  if (formData.downtime_events.length > 0) {
    const downtimeToInsert = formData.downtime_events.map(e => ({
      shift_report_id: report.id,
      plant_id: plantId,
      machine: e.machine,
      duration_minutes: e.duration_minutes,
      reason: e.reason,
    }))

    const { error: downtimeError } = await supabase
      .from('downtime_events')
      .insert(downtimeToInsert)

    if (downtimeError) {
      console.error('Error inserting downtime:', downtimeError.message)
      // Partial failure: report exists, but some events failed. TBD how to handle.
    }
  }

  // 4. Insert maintenance requests (if any)
  if (formData.maintenance_requests.length > 0) {
    const maintenanceToInsert = formData.maintenance_requests.map(r => ({
      shift_report_id: report.id,
      plant_id: plantId,
      equipment_name: r.equipment,
      description: r.description,
      priority: r.priority,
    }))

    const { error: maintenanceError } = await supabase
      .from('maintenance_requests')
      .insert(maintenanceToInsert)

    if (maintenanceError) {
      console.error('Error inserting maintenance:', maintenanceError.message)
    }
  }

  revalidatePath('/dashboard')
  return { success: true, reportId: report.id }
}
