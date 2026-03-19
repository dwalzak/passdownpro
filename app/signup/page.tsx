'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 'account' | 'plant'

export default function SignupPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'free'

  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — account fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2 — plant fields
  const [plantName, setPlantName] = useState('')

  const supabase = createClient()

  // ── Step 1: validate and move to plant step ───────────────────────────────
  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setStep('plant')
  }

  // ── Step 2: create account + plant in one flow ────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Failed to create account.')
      setLoading(false)
      return
    }

    // 2. Create the plant row (service role not available client-side —
    //    we use a Supabase DB function via RPC to atomically create
    //    plant + user_profile in one call, bypassing RLS for setup)
    const { error: plantError } = await supabase.rpc('create_plant_and_admin', {
      p_plant_name: plantName,
      p_full_name: fullName,
      p_user_id: authData.user.id,
      p_plan: plan,
    })

    if (plantError) {
      setError(plantError.message)
      setLoading(false)
      return
    }

    // 3. Redirect to dashboard — session is active
    window.location.href = '/dashboard'
  }

  // ── OAuth signup (same flow as login — Supabase handles new vs existing) ──
  const handleOAuth = async (provider: 'azure' | 'google') => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?signup=true&plan=${plan}`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Brand */}
      <Link href="/" className="mb-8 text-sm font-black uppercase tracking-widest no-underline"
        style={{ color: 'var(--amber-primary)' }}>
        PassdownPro
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-xl px-6 py-8"
        style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
      >
        {/* Plan badge */}
        {plan !== 'free' && (
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-4"
            style={{ backgroundColor: 'var(--amber-glow)', color: 'var(--amber-bright)', border: '1px solid var(--amber-dim)' }}
          >
            {plan === 'pro' ? 'Pro — $49/mo' : 'Enterprise — $149/mo'}
          </div>
        )}

        <h1 className="text-xl font-bold mb-1">Create your account</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
          Already have one?{' '}
          <Link href="/login" style={{ color: 'var(--amber-primary)' }}>Sign in</Link>
        </p>

        {/* ── Step indicator ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          {(['account', 'plant'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: step === s || (s === 'account' && step === 'plant')
                    ? 'var(--amber-primary)' : 'var(--background-input)',
                  color: step === s || (s === 'account' && step === 'plant')
                    ? '#0d0d0f' : 'var(--foreground-subtle)',
                  border: '1px solid var(--border)',
                }}
              >
                {s === 'account' && step === 'plant' ? '✓' : i + 1}
              </div>
              <span className="text-xs capitalize" style={{ color: step === s ? 'var(--foreground)' : 'var(--foreground-subtle)' }}>
                {s === 'account' ? 'Your account' : 'Your plant'}
              </span>
              {i === 0 && <div className="w-6 h-px" style={{ backgroundColor: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Account ────────────────────────────────────────────── */}
        {step === 'account' && (
          <>
            {/* OAuth options */}
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={() => handleOAuth('azure')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <MicrosoftIcon />
                Sign up with Microsoft 365
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <GoogleIcon />
                Sign up with Google
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            </div>

            <form onSubmit={handleAccountNext} className="space-y-4">
              <div>
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="signup-email">Work email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="jane@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <ErrorMsg message={error} />}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest"
                style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
              >
                Continue →
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Plant ──────────────────────────────────────────────── */}
        {step === 'plant' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <p className="text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>
              What is the name of your plant or facility?
            </p>
            <div>
              <label htmlFor="plant-name">Plant / facility name</label>
              <input
                id="plant-name"
                type="text"
                placeholder="e.g. Acme Manufacturing — Plant 1"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
              You can rename this later in Settings. If you have multiple plants, you can add them after signing up.
            </p>
            {error && <ErrorMsg message={error} />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('account'); setError('') }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: 'var(--background-input)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest disabled:opacity-60"
                style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-xs mt-6 text-center max-w-xs" style={{ color: 'var(--foreground-subtle)' }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
      {message}
    </p>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
