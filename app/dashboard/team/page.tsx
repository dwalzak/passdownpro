import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { approveUser, rejectUser, assignPlant } from '@/app/actions/team'

/**
 * /dashboard/team
 * Visible to admin and manager roles only.
 * Shows pending users and lets managers approve/reject/assign to a plant.
 */
export default async function TeamPage() {
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('role, plant_id, status')
    .eq('id', user.id)
    .single()

  if (!myProfile || !['admin', 'manager'].includes(myProfile.role)) {
    redirect('/dashboard')
  }

  // Fetch all users in my plant (active) + all pending users (no plant yet)
  const { data: plantUsers } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, status, created_at')
    .eq('plant_id', myProfile.plant_id)
    .order('created_at', { ascending: false })

  const { data: pendingUsers } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, status, created_at')
    .is('plant_id', null)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const roleColors: Record<string, string> = {
    admin: '#f59e0b',
    manager: '#3b82f6',
    supervisor: '#10b981',
    viewer: '#6b7280',
  }

  const statusColors: Record<string, string> = {
    active: '#10b981',
    pending: '#f59e0b',
    suspended: '#ef4444',
  }

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Team Management</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--foreground-muted)' }}>
          Manage users for your plant and approve pending access requests.
        </p>

        {/* Pending Approval Requests */}
        {(pendingUsers?.length ?? 0) > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
                Pending Approval Requests
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
              >
                {pendingUsers!.length}
              </span>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--amber-dim)' }}
            >
              {pendingUsers!.map((u: any, i: number) => (
                <div
                  key={u.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <div>
                    <p className="font-semibold text-sm">{u.full_name || 'Unnamed User'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                      Requested {format(new Date(u.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approveUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="plantId" value={myProfile.plant_id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all"
                        style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        ✓ Approve
                      </button>
                    </form>
                    <form action={rejectUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all"
                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        ✗ Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Plant Users */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--foreground-subtle)' }}>
            Plant Members
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            {!plantUsers?.length ? (
              <div className="px-6 py-10 text-center text-sm" style={{ color: 'var(--foreground-muted)' }}>
                No users in this plant yet.
              </div>
            ) : (
              plantUsers.map((u: any, i: number) => (
                <div
                  key={u.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                >
                  <div>
                    <p className="font-semibold text-sm">{u.full_name || 'Unnamed User'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                      Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: `${statusColors[u.status]}20`, color: statusColors[u.status] }}
                    >
                      {u.status}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ backgroundColor: `${roleColors[u.role]}20`, color: roleColors[u.role] }}
                    >
                      {u.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  )
}
