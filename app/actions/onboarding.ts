'use server'

import { createClient } from '@/lib/supabase-server'
import { sendApprovalRequestEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * Called when a new OAuth user submits the onboarding form.
 * Creates a pending profile, generates a secure token, and emails all managers + admins.
 */
export async function requestAccess(formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fullName = (formData.get('fullName') as string)?.trim() ||
    user.user_metadata?.name || user.email || 'New User'

  // Generate a secure random token for the approve/deny links
  const token = crypto.randomBytes(32).toString('hex')

  // Find the first available plant (or could be based on invite code in future)
  const { data: plants } = await supabase
    .from('plants')
    .select('id, name')
    .limit(1)
    .single()

  const plantId = (plants as any)?.id ?? null

  // Upsert the pending profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      role: 'supervisor',
      status: 'pending',
      plant_id: null,
      pending_plant_id: plantId,
      approval_token: token,
    })

  if (profileError) throw new Error(profileError.message)

  // Find all admins and managers of that plant to notify
  let managers: any[] = []
  if (plantId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('plant_id', plantId)
      .in('role', ['admin', 'manager'])
      .eq('status', 'active')

    managers = data ?? []
  }

  // Get manager emails from auth.users
  for (const manager of managers) {
    // Use admin API to get their email
    const { data: authUser } = await supabase.auth.admin.getUserById(manager.id)
    const managerEmail = authUser?.user?.email
    if (!managerEmail) continue

    await sendApprovalRequestEmail({
      managerEmail,
      managerName: manager.full_name || managerEmail,
      requesterName: fullName,
      requesterEmail: user.email ?? '',
      token,
    })
  }

  return { success: true }
}
