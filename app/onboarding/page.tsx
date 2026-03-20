'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestAccess } from '@/app/actions/onboarding'

/**
 * /onboarding
 * Shown to authenticated users who have no plant association.
 * Submits a request to the plant manager for approval.
 * Manager gets an email with Approve/Deny links.
 */
export default function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('fullName', fullName)
      await requestAccess(fd)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-lg font-bold mb-3">Request Submitted!</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--foreground-muted)' }}>
            Your access request has been sent to the plant manager for review.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
            You'll receive an email once your access has been approved or denied.
          </p>
          <div
            className="rounded-lg px-4 py-3 text-xs text-left"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid var(--amber-dim)', color: 'var(--amber-bright)' }}
          >
            📬 Check your email inbox for a confirmation once the manager reviews your request.
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-1">Request Plant Access</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
        Your account needs to be approved by a plant manager before you can access reports.
        Enter your name and we'll send them a notification.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full-name">Your full name</label>
          <input
            id="full-name"
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && (
          <p
            className="text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-60 transition-all"
          style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
        >
          {loading ? 'Sending request…' : 'Request Access →'}
        </button>
      </form>

      <p className="text-xs mt-4 text-center" style={{ color: 'var(--foreground-subtle)' }}>
        Wrong account?{' '}
        <Link href="/login" style={{ color: 'var(--amber-primary)' }}>Sign in with a different account</Link>
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <span className="mb-8 text-sm font-black uppercase tracking-widest" style={{ color: 'var(--amber-primary)' }}>
        PassdownPro
      </span>
      <div
        className="w-full max-w-sm rounded-xl px-6 py-8"
        style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
      >
        {children}
      </div>
    </div>
  )
}
