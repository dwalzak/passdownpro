import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { AppNav } from '@/components/AppNav'
import { ChevronLeft, Edit, AlertTriangle, Hammer, Clock, History, FileText, Download } from 'lucide-react'

interface ReportDetailPageProps {
  params: {
    id: string
  }
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile for plant check and role check
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plant_id, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    redirect('/onboarding')
  }

  // Fetch report details
  const { data: report, error: reportError } = await supabase
    .from('shift_reports')
    .select('*')
    .eq('id', params.id)
    .single()

  if (reportError || !report) {
    notFound()
  }

  // Verify plant access
  if (report.plant_id !== profile.plant_id) {
    redirect('/dashboard')
  }

  // Fetch children
  const [downtimeRes, maintenanceRes, auditRes] = await Promise.all([
    supabase.from('downtime_events').select('*').eq('shift_report_id', params.id).order('created_at', { ascending: true }),
    supabase.from('maintenance_requests').select('*').eq('shift_report_id', params.id).order('created_at', { ascending: true }),
    supabase.from('report_audit_log').select('*').eq('report_id', params.id).order('changed_at', { ascending: false })
  ])

  const downtime = downtimeRes.data || []
  const maintenance = maintenanceRes.data || []
  const auditLogs = auditRes.data || []

  const canEdit = ['admin', 'manager'].includes(profile.role)

  return (
    <>
      <AppNav />
      <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
        {/* Header / Actions Bar */}
        <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background-card)' }}>
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Feed
            </Link>
            
            <div className="flex items-center gap-3">
              {report.pdf_url && (
                <a 
                  href={report.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
                  style={{ backgroundColor: 'var(--background-input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
              )}
              {canEdit && (
                <Link 
                  href={`/report/${params.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
                  style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
                >
                  <Edit className="w-4 h-4" />
                  Edit Report
                </Link>
              )}
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Main Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Report Header & Summary */}
            <div className="lg:col-span-2 space-y-8">
              <section 
                className="rounded-2xl p-8 border shadow-sm"
                style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">
                      Shift Report
                    </h1>
                    <p className="text-lg font-medium" style={{ color: 'var(--foreground-muted)' }}>
                      {format(new Date(report.report_date + 'T00:00:00'), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span 
                      className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2"
                      style={{ 
                        backgroundColor: 'var(--amber-glow)', 
                        color: 'var(--amber-bright)',
                        border: '1px solid var(--amber-dim)'
                      }}
                    >
                      {report.shift} SHIFT
                    </span>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      Supervisor: <span className="font-bold text-white">{report.supervisor_name}</span>
                    </p>
                  </div>
                </div>

                {/* Big Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>Yield</p>
                    <p className="text-2xl font-black">
                      {Math.round((report.units_produced / (report.units_target || 1)) * 100)}%
                    </p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {report.units_produced.toLocaleString()} / {report.units_target.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>Safety</p>
                    <p className="text-2xl font-black" style={{ color: report.safety_incident_count > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {report.safety_incident_count}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Incidents</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>Quality</p>
                    <p className="text-2xl font-black" style={{ color: report.reject_count > 20 ? 'var(--amber-primary)' : 'inherit' }}>
                      {report.reject_count}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Rejects</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>Downtime</p>
                    <p className="text-2xl font-black">
                      {downtime.reduce((acc: number, curr: any) => acc + curr.duration_minutes, 0)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Minutes Total</p>
                  </div>
                </div>

                {/* Handoff Notes */}
                <div className="mt-8">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest mb-4" style={{ color: 'var(--foreground-subtle)' }}>
                    <FileText className="w-4 h-4" />
                    Handoff & Safety Notes
                  </h3>
                  <div className="space-y-6">
                    {report.handoff_notes && report.handoff_notes !== '[ENCRYPTED]' && (
                      <div>
                        <p className="text-sm font-bold mb-1">Passdown Notes</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{report.handoff_notes}</p>
                      </div>
                    )}
                    {report.safety_description && report.safety_description !== '[ENCRYPTED]' && (
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                        <p className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Safety Log
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{report.safety_description}</p>
                      </div>
                    )}
                    {report.quality_description && report.quality_description !== '[ENCRYPTED]' && (
                      <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <p className="text-sm font-bold text-yellow-400 mb-1">Quality Log</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{report.quality_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Downtime Section */}
              <section 
                className="rounded-2xl p-8 border shadow-sm"
                style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
              >
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                  <Clock className="w-4 h-4" />
                  Downtime Events ({downtime.length})
                </h3>
                {downtime.length === 0 ? (
                  <p className="text-sm italic" style={{ color: 'var(--foreground-subtle)' }}>No downtime logged this shift.</p>
                ) : (
                  <div className="space-y-4">
                    {downtime.map((event: any) => (
                      <div key={event.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background-input)' }}>
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm tracking-tight">{event.machine}</p>
                          <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-white/5">{event.duration_minutes}m</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{event.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Maintenance Section */}
              <section 
                className="rounded-2xl p-8 border shadow-sm"
                style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
              >
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                  <Hammer className="w-4 h-4" />
                  Maintenance Requests ({maintenance.length})
                </h3>
                {maintenance.length === 0 ? (
                  <p className="text-sm italic" style={{ color: 'var(--foreground-subtle)' }}>No maintenance requests submitted.</p>
                ) : (
                  <div className="space-y-4">
                    {maintenance.map((req: any) => (
                      <div key={req.id} className="p-4 rounded-xl border flex gap-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background-input)' }}>
                        <div 
                          className="w-1 rounded-full shrink-0" 
                          style={{ 
                            backgroundColor: req.priority === 'high' ? 'var(--danger)' : req.priority === 'medium' ? 'var(--amber-primary)' : 'var(--foreground-subtle)' 
                          }} 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-sm">{req.equipment_name}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>{req.priority}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{req.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Audit Trail & Details */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Audit Trail */}
              <section 
                className="rounded-2xl p-6 border shadow-sm"
                style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
              >
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                  <History className="w-4 h-4" />
                  Change History
                </h3>
                
                <div className="relative pl-6 space-y-8">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px" style={{ backgroundColor: 'var(--border)' }} />
                  
                  {/* Current State (Top) */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full border-4 border-black" style={{ backgroundColor: 'var(--amber-primary)' }} />
                    <p className="text-xs font-bold mb-1">Current Version</p>
                    <p className="text-[10px]" style={{ color: 'var(--foreground-subtle)' }}>Verified & Active</p>
                  </div>

                  {/* Historical Entries */}
                  {auditLogs.length === 0 ? (
                    <div className="relative">
                      <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full border-2 border-black bg-neutral-800" />
                      <p className="text-xs font-bold mb-1">Original Submission</p>
                      <p className="text-[10px]" style={{ color: 'var(--foreground-subtle)' }}>
                        {format(new Date(report.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ) : (
                    auditLogs.map((log: any) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full border-2 border-black bg-neutral-600" />
                        <p className="text-xs font-bold mb-1 capitalize">{log.action}</p>
                        <p className="text-[10px] mb-2" style={{ color: 'var(--foreground-subtle)' }}>
                          {format(new Date(log.changed_at), 'MMM d, h:mm a')}
                        </p>
                        
                        {/* Change Diffs */}
                        <div className="space-y-1">
                          {Object.entries(log.changes || {}).map(([key, diff]: [string, any]) => (
                            <div key={key} className="text-[10px] leading-tight">
                              <span className="font-bold">{key.replace(/_/g, ' ')}:</span>{' '}
                              <span className="line-through text-red-500/70">{diff.before}</span>{' '}
                              <span className="text-green-500/70">{diff.after}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* System Details */}
              <section 
                className="rounded-2xl p-6 border shadow-sm"
                style={{ backgroundColor: 'var(--background-card)', borderColor: 'var(--border)' }}
              >
                <h3 className="text-xs font-black uppercase tracking-widest mb-6" style={{ color: 'var(--foreground-subtle)' }}>
                  Report Metadata
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-neutral-500">Resource ID</p>
                    <p className="text-[10px] font-mono break-all">{report.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-neutral-500">Created At</p>
                    <p className="text-xs">{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  {report.updated_at !== report.created_at && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-neutral-500">Last Modified</p>
                      <p className="text-xs">{format(new Date(report.updated_at), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </>
  )
}
