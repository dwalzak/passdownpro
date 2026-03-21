import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import { ShiftReportForm } from '@/components/ShiftReportForm'
import { AppNav } from '@/components/AppNav'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ShiftReportForm as ShiftReportFormData } from '@/types'

interface EditReportPageProps {
  params: {
    id: string
  }
}

export default async function EditReportPage({ params }: EditReportPageProps) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Get user profile and verify role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plant_id, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    redirect('/onboarding')
  }

  if (!['admin', 'manager'].includes(profile.role)) {
    redirect(`/report/${params.id}`)
  }

  // 2. Fetch report and children
  const { data: report, error: reportError } = await supabase
    .from('shift_reports')
    .select('*')
    .eq('id', params.id)
    .single()

  if (reportError || !report) {
    notFound()
  }

  if (report.plant_id !== profile.plant_id) {
    redirect('/dashboard')
  }

  const [downtimeRes, maintenanceRes] = await Promise.all([
    supabase.from('downtime_events').select('*').eq('shift_report_id', params.id),
    supabase.from('maintenance_requests').select('*').eq('shift_report_id', params.id)
  ])

  // 3. Map to form structure
  const initialData: ShiftReportFormData = {
    date: report.report_date,
    shift: report.shift,
    supervisor_name: report.supervisor_name,
    units_produced: report.units_produced ?? '',
    units_target: report.units_target ?? '',
    downtime_events: (downtimeRes.data || []).map((e: any) => ({
      machine: e.machine,
      duration_minutes: e.duration_minutes,
      reason: e.reason
    })),
    safety_incidents: {
      count: report.safety_incident_count,
      description: report.safety_description === '[ENCRYPTED]' ? 'Encryption enabled' : (report.safety_description || '')
    },
    quality_issues: {
      reject_count: report.reject_count,
      description: report.quality_description === '[ENCRYPTED]' ? 'Encryption enabled' : (report.quality_description || '')
    },
    maintenance_requests: (maintenanceRes.data || []).map((r: any) => ({
      equipment: r.equipment_name,
      description: r.description,
      priority: r.priority
    })),
    handoff_notes: report.handoff_notes === '[ENCRYPTED]' ? 'Encryption enabled' : (report.handoff_notes || '')
  }

  return (
    <>
      <AppNav />
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link 
            href={`/report/${params.id}`} 
            className="flex items-center gap-2 text-sm font-medium mb-8 transition-colors hover:text-white"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Cancel & Back to Detail
          </Link>
          
          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2">Edit Report</h1>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Correcting shift data for {report.report_date} - {report.shift} shift.
            </p>
          </div>

          <div 
            className="rounded-2xl p-8 border"
            style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
          >
            <ShiftReportForm initialData={initialData} reportId={params.id} />
          </div>
        </div>
      </div>
    </>
  )
}
