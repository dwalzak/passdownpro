import Link from 'next/link'
import { AppNav } from '@/components/AppNav'

/**
 * /dashboard — Main landing page after login.
 * Scaffold for now — will be wired to Supabase data in a later step.
 */
export default function DashboardPage() {
  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
              Recent shift activity and plant overview
            </p>
          </div>
          <Link
            href="/report/new"
            className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest no-underline"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            + New Report
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reports This Week', value: '—' },
            { label: 'Downtime Events', value: '—' },
            { label: 'Safety Incidents', value: '—' },
            { label: 'Maintenance Requests', value: '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-5"
              style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--foreground-subtle)' }}>
                {label}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--amber-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent reports placeholder */}
        <div
          className="rounded-xl px-6 py-8 text-center"
          style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold mb-1">No reports yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
            Submit your first shift report to see data here.
          </p>
          <Link
            href="/report/new"
            className="inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest no-underline"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            Submit First Report
          </Link>
        </div>

      </main>
    </>
  )
}
