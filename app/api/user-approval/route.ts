import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendAccessApprovedEmail, sendAccessDeniedEmail } from '@/lib/email'

/**
 * GET /api/user-approval?token=<token>&action=approve|deny
 *
 * Called when a manager clicks the Approve/Deny link in their email.
 * This route uses the Supabase service role key since no session is present.
 * Validates the token, updates user status, and sends confirmation email to user.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const action = searchParams.get('action')

  if (!token || !['approve', 'deny'].includes(action ?? '')) {
    return htmlResponse('Invalid Link', 'This link is invalid or malformed.', false)
  }

  // Use service role — no user session required for email link clicks
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any

  // Look up the profile by the approval token
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, status, pending_plant_id, approval_token')
    .eq('approval_token', token)
    .single()

  if (error || !profile) {
    return htmlResponse('Link Expired', 'This link has already been used or has expired.', false)
  }

  if (profile.status !== 'pending') {
    return htmlResponse(
      'Already Processed',
      `This user's request has already been ${profile.status === 'active' ? 'approved' : profile.status}.`,
      profile.status === 'active'
    )
  }

  // Fetch the user's email via admin API
  const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
  const userEmail = authData?.user?.email ?? ''
  const userName = profile.full_name || userEmail || 'User'

  if (action === 'approve') {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        status: 'active',
        role: 'supervisor',
        plant_id: profile.pending_plant_id,
        approval_token: null, // consume the token so link can't be reused
      })
      .eq('id', profile.id)

    if (updateError) {
      return htmlResponse('Error', `Failed to approve: ${updateError.message}`, false)
    }

    if (userEmail) {
      await sendAccessApprovedEmail({ userEmail, userName }).catch(console.error)
    }

    return htmlResponse(
      'Access Approved ✅',
      `${userName} has been approved as a Supervisor and notified by email.`,
      true
    )
  } else {
    await supabase
      .from('user_profiles')
      .update({ status: 'suspended', approval_token: null })
      .eq('id', profile.id)

    if (userEmail) {
      await sendAccessDeniedEmail({ userEmail, userName }).catch(console.error)
    }

    return htmlResponse(
      'Access Denied',
      `${userName}'s request has been denied. They've been notified by email.`,
      false
    )
  }
}

// ─── HTML response page (no JS, works in any email client browser) ────────────

function htmlResponse(title: string, message: string, success: boolean) {
  const color = success ? '#16a34a' : '#dc2626'
  const icon = success ? '✅' : '❌'

  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} — PassdownPro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #0d0d0f; display: flex; align-items: center;
                 justify-content: center; min-height: 100vh; padding: 24px; }
          .card { background: #1a1a1f; border: 1px solid #2a2a30; border-radius: 16px;
                  padding: 40px 32px; max-width: 420px; width: 100%; text-align: center; }
          .brand { color: #f59e0b; font-size: 11px; font-weight: 900;
                   letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 24px; }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h1 { color: ${color}; font-size: 20px; margin-bottom: 12px; }
          p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
          a { display: inline-block; margin-top: 24px; color: #f59e0b;
              text-decoration: none; font-size: 13px; font-weight: 600; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">PassdownPro</div>
          <div class="icon">${icon}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="/dashboard/team">← Team Management</a>
        </div>
      </body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
