import { AppNav } from '@/components/AppNav'
import { ShiftReportForm } from '@/components/ShiftReportForm'

/**
 * /report/new — New shift report form page
 *
 * Server component shell; the form itself is a client component
 * to handle controlled state and dynamic rows.
 */
export default function NewReportPage() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <AppNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            New Shift Report
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {dateStr}
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-xl px-5 py-6 sm:px-7 sm:py-8"
          style={{
            backgroundColor: 'var(--background-card)',
            border: '1px solid var(--border)',
          }}
        >
          <ShiftReportForm />
        </div>
      </main>
    </div>
  )
}
