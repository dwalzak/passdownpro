'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/report/new', label: 'New Report', icon: '📋' },
]

/**
 * Top navigation bar — stays dark and minimal.
 * Active item gets an amber underline accent.
 */
export function AppNav() {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 border-b"
      style={{
        backgroundColor: 'var(--background-elevated)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Logo / Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 no-underline">
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: 'var(--amber-primary)' }}
        >
          PassdownPro
        </span>
        <span
          className="hidden sm:block text-xs px-1.5 py-0.5 rounded font-semibold"
          style={{
            backgroundColor: 'var(--amber-glow)',
            color: 'var(--amber-bright)',
            border: '1px solid var(--amber-dim)',
          }}
        >
          MVP
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors"
              style={{
                color: isActive ? 'var(--amber-bright)' : 'var(--foreground-muted)',
                backgroundColor: isActive ? 'var(--amber-glow)' : 'transparent',
              }}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
