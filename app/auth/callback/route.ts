import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *  - OAuth login (Microsoft 365, Google)
 *  - Magic link login
 *  - Email confirmation on signup
 *
 * We exchange the code for a session, then redirect to dashboard.
 * For OAuth signups (?signup=true), the plant creation is handled
 * by a separate onboarding step since we don't have plant name yet.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerComponentClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something went wrong, send back to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
