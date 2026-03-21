'use client'

import { useState, useCallback, useEffect } from 'react'
import { SectionHeader } from './ui/SectionHeader'
import { Field, FieldGroup } from './ui/FieldGroup'
import type {
  ShiftReportForm as ShiftReportFormData,
  ShiftType,
  DowntimeEvent,
  MaintenanceRequest,
} from '@/types'
import { submitShiftReport, updateShiftReport } from '@/app/actions/shift-reports'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ShiftReportPDF } from './ShiftReportPDF'
import { useRouter } from 'next/navigation'

// ─── Default/empty form state ────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]

const defaultForm: ShiftReportFormData = {
  date: today,
  shift: 'day',
  supervisor_name: '',
  units_produced: '',
  units_target: '',
  downtime_events: [],
  safety_incidents: { count: 0, description: '' },
  quality_issues: { reject_count: 0, description: '' },
  maintenance_requests: [],
  handoff_notes: '',
}

const emptyDowntime = (): DowntimeEvent => ({
  machine: '',
  duration_minutes: 0,
  reason: '',
})

const emptyMaintenance = (): MaintenanceRequest => ({
  equipment: '',
  description: '',
  priority: 'medium',
})

// ─── Sub-components ──────────────────────────────────────────────────────────

function DowntimeRow({
  event,
  index,
  onChange,
  onRemove,
}: {
  event: DowntimeEvent
  index: number
  onChange: (index: number, updated: DowntimeEvent) => void
  onRemove: (index: number) => void
}) {
  return (
    <div
      className="rounded-lg p-3 relative"
      style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)' }}
    >
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--danger)', color: '#fff', fontSize: '11px' }}
        aria-label="Remove downtime event"
      >
        ✕
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
        <div>
          <label htmlFor={`dt-machine-${index}`}>Machine / Line</label>
          <input
            id={`dt-machine-${index}`}
            type="text"
            placeholder="e.g. Line 3 press"
            value={event.machine}
            onChange={(e) => onChange(index, { ...event, machine: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`dt-duration-${index}`}>Duration (min)</label>
          <input
            id={`dt-duration-${index}`}
            type="number"
            min="0"
            placeholder="30"
            value={event.duration_minutes || ''}
            onChange={(e) =>
              onChange(index, { ...event, duration_minutes: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label htmlFor={`dt-reason-${index}`}>Reason</label>
          <input
            id={`dt-reason-${index}`}
            type="text"
            placeholder="e.g. Conveyor belt jam"
            value={event.reason}
            onChange={(e) => onChange(index, { ...event, reason: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

function MaintenanceRow({
  req,
  index,
  onChange,
  onRemove,
}: {
  req: MaintenanceRequest
  index: number
  onChange: (index: number, updated: MaintenanceRequest) => void
  onRemove: (index: number) => void
}) {
  return (
    <div
      className="rounded-lg p-3 relative"
      style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)' }}
    >
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--danger)', color: '#fff', fontSize: '11px' }}
        aria-label="Remove maintenance request"
      >
        ✕
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
        <div>
          <label htmlFor={`maint-equip-${index}`}>Equipment</label>
          <input
            id={`maint-equip-${index}`}
            type="text"
            placeholder="e.g. Hydraulic press #2"
            value={req.equipment}
            onChange={(e) => onChange(index, { ...req, equipment: e.target.value })}
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor={`maint-desc-${index}`}>Description</label>
          <input
            id={`maint-desc-${index}`}
            type="text"
            placeholder="What needs attention?"
            value={req.description}
            onChange={(e) => onChange(index, { ...req, description: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={`maint-pri-${index}`}>Priority</label>
          <select
            id={`maint-pri-${index}`}
            value={req.priority}
            onChange={(e) =>
              onChange(index, {
                ...req,
                priority: e.target.value as MaintenanceRequest['priority'],
              })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Amber "Add" button ───────────────────────────────────────────────────────

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors hover:opacity-90"
      style={{
        backgroundColor: 'var(--amber-glow)',
        color: 'var(--amber-bright)',
        border: '1px dashed var(--amber-dim)',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
      {children}
    </button>
  )
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton({ isSubmitting, isEdit }: { isSubmitting: boolean; isEdit: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all"
      style={{
        backgroundColor: isSubmitting ? 'var(--amber-dim)' : 'var(--amber-primary)',
        color: isSubmitting ? 'var(--foreground-muted)' : '#0d0d0f',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
      }}
    >
      {isSubmitting ? 'Processing…' : isEdit ? 'Save Changes' : 'Submit Shift Report'}
    </button>
  )
}

// ─── Main Form Component ──────────────────────────────────────────────────────

export function ShiftReportForm({ 
  initialData, 
  reportId 
}: { 
  initialData?: ShiftReportFormData
  reportId?: string 
}) {
  const router = useRouter()
  const [form, setForm] = useState<ShiftReportFormData>(initialData || defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submittedData, setSubmittedData] = useState<ShiftReportFormData | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Generic field updater
  const setField = useCallback(
    <K extends keyof ShiftReportFormData>(key: K, value: ShiftReportFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // ── Downtime handlers
  const addDowntime = () => setField('downtime_events', [...form.downtime_events, emptyDowntime()])
  const updateDowntime = (i: number, updated: DowntimeEvent) =>
    setField(
      'downtime_events',
      form.downtime_events.map((e, idx) => (idx === i ? updated : e))
    )
  const removeDowntime = (i: number) =>
    setField(
      'downtime_events',
      form.downtime_events.filter((_, idx) => idx !== i)
    )

  // ── Maintenance handlers
  const addMaintenance = () =>
    setField('maintenance_requests', [...form.maintenance_requests, emptyMaintenance()])
  const updateMaintenance = (i: number, updated: MaintenanceRequest) =>
    setField(
      'maintenance_requests',
      form.maintenance_requests.map((r, idx) => (idx === i ? updated : r))
    )
  const removeMaintenance = (i: number) =>
    setField(
      'maintenance_requests',
      form.maintenance_requests.filter((_, idx) => idx !== i)
    )

  // ── Total downtime helper
  const totalDowntime = form.downtime_events.reduce(
    (sum, e) => sum + (e.duration_minutes || 0),
    0
  )

  // ── Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (reportId) {
        const updateRes = await updateShiftReport(reportId, form)
        if (!updateRes.success) {
          throw new Error(updateRes.error)
        }
        console.log('✅ Report updated successfully!')
        router.push(`/report/${reportId}`)
        return 
      }
      
      const result = await submitShiftReport(form)
      if (!result.success) {
        throw new Error(result.error)
      }
      
      console.log('✅ Report submitted successfully!', result)
      setSubmittedData({ ...form }) // capture data for PDF
      setSubmitSuccess(true)
      setForm(defaultForm)
    } catch (err: any) {
      console.error('❌ Error submitting report:', err.message)
      alert(`Submission failed: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--amber-bright)' }}>
          Shift Report Submitted
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
          Your report has been saved. PDF generation coming soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          {isClient && submittedData && (
            <PDFDownloadLink
              document={<ShiftReportPDF report={submittedData} />}
              fileName={`ShiftReport_${submittedData.date}_${submittedData.shift}.pdf`}
              className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--amber-primary)', color: '#000' }}
            >
              {({ loading }) => (loading ? 'Generating PDF...' : '⬇️ Download PDF Report')}
            </PDFDownloadLink>
          )}

          <button
            onClick={() => setSubmitSuccess(false)}
            className="px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            New Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ── 1. Shift Header ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Shift Info" icon="📋" />
        <FieldGroup columns={3}>
          <Field label="Date" htmlFor="date" required>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              required
            />
          </Field>

          <Field label="Shift" htmlFor="shift" required>
            <select
              id="shift"
              value={form.shift}
              onChange={(e) => setField('shift', e.target.value as ShiftType)}
              required
            >
              <option value="day">Day</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </Field>

          <Field label="Supervisor Name" htmlFor="supervisor_name" required>
            <input
              id="supervisor_name"
              type="text"
              placeholder="Full name"
              value={form.supervisor_name}
              onChange={(e) => setField('supervisor_name', e.target.value)}
              required
            />
          </Field>
        </FieldGroup>
      </section>

      {/* ── 2. Production ────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Production" icon="🏭" />
        <FieldGroup columns={2}>
          <Field label="Units Produced" htmlFor="units_produced" required hint="Actual count for this shift">
            <input
              id="units_produced"
              type="number"
              min="0"
              placeholder="0"
              value={form.units_produced}
              onChange={(e) =>
                setField('units_produced', e.target.value === '' ? '' : parseInt(e.target.value))
              }
              required
            />
          </Field>

          <Field label="Units Target" htmlFor="units_target" hint="Planned target for this shift">
            <input
              id="units_target"
              type="number"
              min="0"
              placeholder="0"
              value={form.units_target}
              onChange={(e) =>
                setField('units_target', e.target.value === '' ? '' : parseInt(e.target.value))
              }
            />
          </Field>
        </FieldGroup>

        {/* Production performance indicator */}
        {form.units_produced !== '' && form.units_target !== '' && form.units_target > 0 && (
          <div
            className="mt-3 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm"
            style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)' }}
          >
            <span style={{ color: 'var(--foreground-muted)' }}>Performance:</span>
            <span
              className="font-bold text-base"
              style={{
                color:
                  (form.units_produced as number) >= (form.units_target as number)
                    ? 'var(--success)'
                    : 'var(--danger)',
              }}
            >
              {Math.round(((form.units_produced as number) / (form.units_target as number)) * 100)}%
            </span>
            <span style={{ color: 'var(--foreground-subtle)' }}>
              ({(form.units_produced as number)} / {(form.units_target as number)} units)
            </span>
          </div>
        )}
      </section>

      {/* ── 3. Downtime Events ───────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Downtime Events"
          icon="⚠️"
          subtitle={
            form.downtime_events.length > 0
              ? `${form.downtime_events.length} event(s) — ${totalDowntime} min total`
              : 'No events logged'
          }
        />
        <div className="space-y-3">
          {form.downtime_events.map((event, i) => (
            <DowntimeRow
              key={i}
              event={event}
              index={i}
              onChange={updateDowntime}
              onRemove={removeDowntime}
            />
          ))}
          <AddButton onClick={addDowntime}>Add Downtime Event</AddButton>
        </div>
      </section>

      {/* ── 4. Safety ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Safety" icon="🦺" />
        <FieldGroup columns={2}>
          <Field label="Incident Count" htmlFor="safety_count" hint="0 if no incidents">
            <input
              id="safety_count"
              type="number"
              min="0"
              placeholder="0"
              value={form.safety_incidents.count}
              onChange={(e) =>
                setField('safety_incidents', {
                  ...form.safety_incidents,
                  count: parseInt(e.target.value) || 0,
                })
              }
            />
          </Field>

          <Field label="Description" htmlFor="safety_desc" hint="Brief summary if count > 0">
            <input
              id="safety_desc"
              type="text"
              placeholder="Describe any incidents"
              value={form.safety_incidents.description}
              onChange={(e) =>
                setField('safety_incidents', {
                  ...form.safety_incidents,
                  description: e.target.value,
                })
              }
            />
          </Field>
        </FieldGroup>
      </section>

      {/* ── 5. Quality Issues ────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Quality Issues" icon="🔍" />
        <FieldGroup columns={2}>
          <Field label="Reject Count" htmlFor="reject_count" hint="Units rejected / scrapped">
            <input
              id="reject_count"
              type="number"
              min="0"
              placeholder="0"
              value={form.quality_issues.reject_count}
              onChange={(e) =>
                setField('quality_issues', {
                  ...form.quality_issues,
                  reject_count: parseInt(e.target.value) || 0,
                })
              }
            />
          </Field>

          <Field label="Description" htmlFor="quality_desc">
            <input
              id="quality_desc"
              type="text"
              placeholder="Root cause or part description"
              value={form.quality_issues.description}
              onChange={(e) =>
                setField('quality_issues', {
                  ...form.quality_issues,
                  description: e.target.value,
                })
              }
            />
          </Field>
        </FieldGroup>
      </section>

      {/* ── 6. Maintenance Requests ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Maintenance Requests"
          icon="🔧"
          subtitle={
            form.maintenance_requests.length > 0
              ? `${form.maintenance_requests.length} request(s)`
              : 'No requests'
          }
        />
        <div className="space-y-3">
          {form.maintenance_requests.map((req, i) => (
            <MaintenanceRow
              key={i}
              req={req}
              index={i}
              onChange={updateMaintenance}
              onRemove={removeMaintenance}
            />
          ))}
          <AddButton onClick={addMaintenance}>Add Maintenance Request</AddButton>
        </div>
      </section>

      {/* ── 7. Handoff Notes ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Handoff Notes" icon="📝" subtitle="What does the next shift need to know?" />
        <textarea
          id="handoff_notes"
          rows={4}
          placeholder="Open items, pending work orders, anything the next supervisor needs to know..."
          value={form.handoff_notes}
          onChange={(e) => setField('handoff_notes', e.target.value)}
          style={{ resize: 'vertical', minHeight: '100px' }}
        />
      </section>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <SubmitButton isSubmitting={isSubmitting} isEdit={!!reportId} />
        <p className="text-center text-xs mt-2" style={{ color: 'var(--foreground-subtle)' }}>
          {reportId ? 'Changes will be logged in the audit trail.' : 'Report will be saved and a PDF will be generated.'}
        </p>
      </div>

    </form>
  )
}
