import Link from 'next/link'

// ── Pricing tier data ────────────────────────────────────────────────────────
const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try PassdownPro with your team.',
    features: [
      '1 plant',
      'Up to 3 users',
      '30 days report history',
      'PDF download',
      'Mobile-friendly form',
    ],
    cta: 'Get started free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    description: 'For growing plants that need more.',
    features: [
      'Unlimited users',
      '1 year report history',
      'PDF auto-emailed to manager',
      'CSV export',
      'Maintenance email notifications',
      'Priority support',
    ],
    cta: 'Start Pro trial',
    href: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$149',
    period: 'per month',
    description: 'Multi-site operations and custom needs.',
    features: [
      'Multiple plants',
      'Unlimited history',
      'Custom branding / logo',
      'API access',
      'Everything in Pro',
      'Dedicated onboarding',
    ],
    cta: 'Contact us',
    href: '/signup?plan=enterprise',
    highlight: false,
  },
]

// ── Feature highlights ────────────────────────────────────────────────────────
const highlights = [
  {
    icon: '📋',
    title: 'Structured Shift Reports',
    desc: 'Capture production, downtime, safety, quality, and maintenance in one fast form — on any device.',
  },
  {
    icon: '🔧',
    title: 'Maintenance Notifications',
    desc: 'Maintenance requests trigger instant email alerts to your team — no more missed work orders.',
  },
  {
    icon: '📊',
    title: 'Trend Dashboard',
    desc: 'See production vs. target, downtime patterns, and safety incidents over time at a glance.',
  },
  {
    icon: '🏭',
    title: 'Per-Plant Equipment Lists',
    desc: 'Each facility manages its own equipment list. Supervisors only see what belongs to their plant.',
  },
  {
    icon: '🔒',
    title: 'Secure Multi-Tenant',
    desc: 'Each plant\'s data is fully isolated. Sign in with Microsoft 365, Google, or email.',
  },
  {
    icon: '📄',
    title: 'Auto-Generated PDFs',
    desc: 'Every report generates a clean, formatted PDF — downloadable instantly or emailed to management.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 border-b"
        style={{ backgroundColor: 'var(--background-elevated)', borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--amber-primary)' }}>
          PassdownPro
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-4 py-1.5 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div
          className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
          style={{ backgroundColor: 'var(--amber-glow)', color: 'var(--amber-bright)', border: '1px solid var(--amber-dim)' }}
        >
          Built for the plant floor
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
          Shift handoffs that actually{' '}
          <span style={{ color: 'var(--amber-primary)' }}>work.</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--foreground-muted)' }}>
          PassdownPro replaces emailed Word docs and paper logs with a structured digital shift report — complete with maintenance alerts, trend dashboards, and auto-generated PDFs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors"
            style={{ backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }}
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--background-card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Feature highlights ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">Everything your shift needs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--background-card)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl mb-3">{h.icon}</div>
              <h3 className="font-bold mb-1 text-sm">{h.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-3">Simple, transparent pricing</h2>
        <p className="text-center text-sm mb-12" style={{ color: 'var(--foreground-muted)' }}>
          No setup fees. Cancel any time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="rounded-xl p-6 flex flex-col"
              style={{
                backgroundColor: tier.highlight ? 'var(--background-card)' : 'var(--background-elevated)',
                border: tier.highlight ? '1px solid var(--amber-primary)' : '1px solid var(--border)',
              }}
            >
              {tier.highlight && (
                <div
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full self-start mb-4"
                  style={{ backgroundColor: 'var(--amber-glow)', color: 'var(--amber-bright)', border: '1px solid var(--amber-dim)' }}
                >
                  Most popular
                </div>
              )}
              <h3 className="font-bold text-lg mb-1">{tier.name}</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black">{tier.price}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--foreground-muted)' }}>/ {tier.period}</span>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>{tier.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'var(--amber-primary)' }}>✓</span>
                    <span style={{ color: 'var(--foreground-muted)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className="block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={
                  tier.highlight
                    ? { backgroundColor: 'var(--amber-primary)', color: '#0d0d0f' }
                    : { backgroundColor: 'var(--background-card)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                }
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t mt-16 py-8 text-center text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--foreground-subtle)' }}
      >
        © {new Date().getFullYear()} PassdownPro · passdownpro.app
        <span className="mx-3">·</span>
        <Link href="/login" style={{ color: 'var(--foreground-muted)' }}>Sign in</Link>
      </footer>

    </div>
  )
}
