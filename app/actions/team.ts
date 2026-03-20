'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

/**
 * Approve a pending user — assign them to the plant with supervisor role.
 */
export async function approveUser(formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify caller is admin or manager
  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('role, plant_id')
    .eq('id', user.id)
    .single()

  if (!myProfile || !['admin', 'manager'].includes(myProfile.role)) {
    throw new Error('Not authorized')
  }

  const userId = formData.get('userId') as string
  const plantId = formData.get('plantId') as string

  const { error } = await supabase
    .from('user_profiles')
    .update({
      plant_id: plantId,
      status: 'active',
      role: 'supervisor', // Default role on approval
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/team')
}

/**
 * Reject / suspend a pending user.
 */
export async function rejectUser(formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!myProfile || !['admin', 'manager'].includes(myProfile.role)) {
    throw new Error('Not authorized')
  }

  const userId = formData.get('userId') as string

  const { error } = await supabase
    .from('user_profiles')
    .update({ status: 'suspended' })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/team')
}

/**
 * Assign a user to a different plant (admin only).
 */
export async function assignPlant(formData: FormData) {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'admin') throw new Error('Only admins can reassign plants')

  const userId = formData.get('userId') as string
  const plantId = formData.get('plantId') as string

  const { error } = await supabase
    .from('user_profiles')
    .update({ plant_id: plantId, status: 'active' })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/team')
}
