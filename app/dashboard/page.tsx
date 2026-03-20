import Link from 'next/link'
import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase-server'
import { format } from 'date-fns'

/**
 * /dashboard — Main landing page after login.
 * Real-time plant activity feed.
 */
export default async function DashboardPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get plant details + history limit (from user profile)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plant_id')
    .eq('id', user.id)
    .single()

  const plantId = profile?.plant_id

  if (!plantId) {
    return (
      <>
        <AppNav />
        <main className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-xl">Your account is not associated with a plant.</p>
          <p className="mt-2 text-muted">Contact your admin to get joined to a plant.</p>
        </main>
      </>
    )
  }

  // Fetch recent reports (last 30 for now)
  const { data: reports, error } = await supabase
    .from('shift_reports')
    .select('*')
    .eq('plant_id', plantId)
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  // Calculate stats overview (Mocked for now or simplistic)
  const stats = {
    reportsCount: reports?.length || 0,
    safetyIncidents: reports?.reduce((sum: number, r: any) => sum + (r.safety_incident_count || 0), 0) || 0,
    rejectCount: reports?.reduce((sum: number, r: any) => sum + (r.reject_count || 0), 0) || 0,
  }

  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
              Plant-wide shift activity and performance overview
            </p>
          </div>
          <Link
            href="/report/new"
            className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest no-underline transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            + New Report
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Recent Reports', value: stats.reportsCount },
            { label: 'Safety Incidents', value: stats.safetyIncidents },
            { label: 'Reject Count', value: stats.rejectCount },
            { label: 'Uptime Avg', value: '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-5"
              style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>
                {label}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--amber-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Reports List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
              Recent Shift Reports
            </h2>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {!reports?.length ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
                  No reports have been submitted for your plant yet.
                </p>
                <Link
                  href="/report/new"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest no-underline"
                  style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
                >
                  Submit First Report
                </Link>
              </div>
            ) : (
              reports.map((report: any) => (
                <div 
                  key={report.id} 
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold uppercase tracking-tighter" style={{ color: 'var(--amber-bright)' }}>
                        {report.shift} SHIFT
                      </span>
                      <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                        • {format(new Date(report.report_date + 'T00:00:00'), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      Supervisor: <span className="text-foreground">{report.supervisor_name}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Yield</p>
                      <p className="text-sm font-bold" style={{ color: report.units_produced >= (report.units_target || 0) ? 'var(--amber-bright)' : '#ef4444' }}>
                        {report.units_produced || 0}/{report.units_target || '—'}
                      </p>
                    </div>
                    <Link
                      href={`/report/${report.id}`}
                      className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold transition-all no-underline text-white"
                    >
                      DETAILS
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
