'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type AuthMode = 'password' | 'magic'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const supabase = createClient()

  // ── Email + password login ────────────────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, middleware will redirect to /dashboard via session detection
  }

  // ── Magic link login ──────────────────────────────────────────────────────
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  // ── OAuth providers ───────────────────────────────────────────────────────
  const handleOAuth = async (provider: 'azure' | 'google') => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // ── Magic link confirmation screen ────────────────────────────────────────
  if (magicSent) {
    return (
      <AuthShell>
        <div className="text-center py-4">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-lg font-bold mb-2">Check your email</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
            We sent a sign-in link to <strong>{email}</strong>.<br />
            Click the link in that email to sign in.
          </p>
          <button
            onClick={() => { setMagicSent(false); setEmail('') }}
            className="text-sm underline"
            style={{ color: 'var(--amber-primary)' }}
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-bold mb-1 text-center">Sign in to PassdownPro</h1>
      <p className="text-sm text-center mb-8" style={{ color: 'var(--foreground-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: 'var(--amber-primary)' }}>Sign up free</Link>
      </p>

      {/* ── OAuth buttons ──────────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        <OAuthButton
          onClick={() => handleOAuth('azure')}
          disabled={loading}
          icon={<MicrosoftIcon />}
          label="Continue with Microsoft 365"
        />
        <OAuthButton
          onClick={() => handleOAuth('google')}
          disabled={loading}
          icon={<GoogleIcon />}
          label="Continue with Google"
        />
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>or continue with email</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* ── Mode toggle ────────────────────────────────────────────────── */}
      <div
        className="flex rounded-lg p-1 mb-6"
        style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)' }}
      >
        {(['password', 'magic'] as AuthMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError('') }}
            className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={
              mode === m
                ? { backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }
                : { color: 'var(--foreground-muted)' }
            }
          >
            {m === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {/* ── Email + password form ───────────────────────────────────────── */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <ErrorMsg message={error} />}
          <SubmitButton loading={loading} label="Sign in" />
        </form>
      )}

      {/* ── Magic link form ─────────────────────────────────────────────── */}
      {mode === 'magic' && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="magic-email">Email</label>
            <input
              id="magic-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
            We&apos;ll email you a sign-in link — no password needed.
          </p>
          {error && <ErrorMsg message={error} />}
          <SubmitButton loading={loading} label="Send magic link" />
        </form>
      )}
    </AuthShell>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function AuthShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  )
}

function OAuthButton({
  onClick, disabled, icon, label,
}: {
  onClick: () => void
  disabled: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      style={{ backgroundColor: 'var(--background-input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
    >
      {icon}
      {label}
    </button>
  )
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
      {message}
    </p>
  )
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-60"
      style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

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
