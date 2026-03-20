import { AppNav } from '@/components/AppNav'
import { createClient } from '@/lib/supabase-server'
import { createCheckoutSession, createPortalSession } from '@/app/actions/stripe'
import { Check, Crown, Briefcase, Zap, Info } from 'lucide-react'

// TODO: Replace with real Stripe Price IDs from your dashboard
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_123...'
const ENTERPRISE_PRICE_ID = process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_123...'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Not authenticated</p>
      </main>
    )
  }

  // Get user profile + plant info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, plants:plants(*)')
    .eq('id', user.id)
    .single() as any

  const plant = profile?.plants
  const isFree = plant?.subscription_tier === 'free'
  const isPro = plant?.subscription_tier === 'pro'
  const isEnterprise = plant?.subscription_tier === 'enterprise'

  // Server actions for buttons
  const upgradeToPro = createCheckoutSession.bind(null, PRO_PRICE_ID, plant?.id || '')
  const upgradeToEnterprise = createCheckoutSession.bind(null, ENTERPRISE_PRICE_ID, plant?.id || '')
  const manageSubscription = createPortalSession.bind(null, plant?.id || '')

  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2" style={{ color: 'var(--amber-primary)' }}>
            Plant Settings
          </h1>
          <p className="text-sm font-medium opacity-60">
            Manage your plant configuration and subscription tier
          </p>
        </header>

        <section className="space-y-12">
          {/* Subscription Overview */}
          <div
            className="rounded-2xl p-8 overflow-hidden relative"
            style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  {isFree ? <Zap size={20} className="text-amber-500" /> : <Crown size={20} className="text-amber-500" />}
                </span>
                <h2 className="text-xl font-bold uppercase tracking-wider">Current Plan: {plant?.subscription_tier}</h2>
              </div>

              <p className="text-sm opacity-60 max-w-lg mb-8">
                Your plant is currently on the <strong>{plant?.subscription_tier?.toUpperCase()}</strong> tier. 
                {isFree ? ' Upgrade to unlock more users and longer history.' : ' Manage your billing and invoices via the Stripe Portal.'}
              </p>

              {!isFree && (
                <form action={manageSubscription}>
                  <button
                    className="px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all hover:scale-105"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    Open Billing Portal
                  </button>
                </form>
              )}
            </div>
            
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -z-0 pointer-events-none" />
          </div>

          {/* Pricing Grid */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 px-1 opacity-40">Available Upgrades</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Tier Card */}
              <div
                className={`rounded-2xl p-8 flex flex-col transition-all ${isPro ? 'ring-2 ring-amber-500 shadow-xl shadow-amber-500/10' : ''}`}
                style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold uppercase tracking-widest">Pro Tier</h4>
                  {isPro && <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase">Current</span>}
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black" style={{ color: 'var(--amber-primary)' }}>$49</span>
                  <span className="text-sm opacity-40">/month</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  <TierFeature label="Unlimited Users" />
                  <TierFeature label="1 Year Report History" />
                  <TierFeature label="PDF Email Delivery" />
                  <TierFeature label="CSV Export" />
                </ul>

                <form action={upgradeToPro}>
                  <button
                    disabled={isPro || isEnterprise}
                    className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
                  >
                    {isPro ? 'Active Tier' : isEnterprise ? 'Already Subscribed' : 'Upgrade to Pro'}
                  </button>
                </form>
              </div>

              {/* Enterprise Tier Card */}
              <div
                className={`rounded-2xl p-8 flex flex-col transition-all ${isEnterprise ? 'ring-2 ring-amber-500 shadow-xl shadow-amber-500/10' : ''}`}
                style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold uppercase tracking-widest">Enterprise</h4>
                  {isEnterprise && <span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase">Current</span>}
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black" style={{ color: 'var(--amber-primary)' }}>$149</span>
                  <span className="text-sm opacity-40">/month</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  <TierFeature label="Multiple Plants" />
                  <TierFeature label="Custom Branding" />
                  <TierFeature label="Extended Data Retention" />
                  <TierFeature label="Priority API Access" />
                </ul>

                <form action={upgradeToEnterprise}>
                  <button
                    disabled={isEnterprise}
                    className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
                  >
                    {isEnterprise ? 'Active Tier' : 'Upgrade to Enterprise'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function TierFeature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm font-medium">
      <Check size={16} className="text-amber-500 shrink-0" />
      <span>{label}</span>
    </li>
  )
}
