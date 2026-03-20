'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

/**
 * /onboarding
 * Shown to users who signed in via OAuth but have no plant association.
 * Lets them request access to a plant by submitting their name.
 * A manager/admin must then approve them.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Create a pending profile — no plant_id yet, admin will assign
    const { error: profileError } = await (supabase as any)
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: fullName || user.user_metadata?.name || user.email,
        role: 'supervisor',
        status: 'pending',
        plant_id: null,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-lg font-bold mb-2">Access Request Sent</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Your request has been submitted. A plant manager will review and approve your account.
            You'll be able to log in once approved.
          </p>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
            You can close this window. Check back later or contact your plant manager.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold mb-1">Welcome to PassdownPro</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
        Your account needs to be linked to a plant by a manager before you can access the system.
        Submit your name below to request access.
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
          <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-60"
          style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
        >
          {loading ? 'Submitting…' : 'Request Access'}
        </button>
      </form>

      <p className="text-xs mt-4 text-center" style={{ color: 'var(--foreground-subtle)' }}>
        Already have access?{' '}
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
