import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware — runs on every request.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie if it's stale
 * 2. Redirect unauthenticated users away from protected routes
 * 3. Redirect authenticated users away from auth pages (login/signup)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important for SSR, do not remove
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth required
  const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/onboarding']
  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith('/auth/'))

  // If not authenticated and trying to access a protected route → login
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and hitting login/signup → dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // If authenticated but no plant/pending — send to onboarding (except if already there)
  if (user && pathname !== '/onboarding' && !isPublic) {
    // We do a lightweight check by reading the profile from the DB directly
    // This is done by the page itself — middleware stays lean
    // The dashboard page handles the 'no plant' state via its own redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
