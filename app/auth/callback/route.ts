import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *  - OAuth login (Microsoft 365, Google)
 *  - Magic link login
 *  - Email confirmation on signup
 *
 * We exchange the code for a session, then redirect to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // If there's no code at all, something went wrong upstream
  if (!code) {
    console.error('[auth/callback] No code in URL params')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Success — redirect to dashboard (or the original intended page)
    return NextResponse.redirect(`${origin}${next}`)
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err)
    return NextResponse.redirect(`${origin}/login?error=unexpected`)
  }
}
