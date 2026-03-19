'use client'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: string
}

/**
 * Section divider used between form blocks.
 * Amber left-border gives the industrial "warning light" feel.
 */
export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div
      className="flex items-start gap-3 py-3 mb-4 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      {icon && (
        <span className="text-xl mt-0.5" role="img" aria-hidden>
          {icon}
        </span>
      )}
      <div>
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: 'var(--amber-primary)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
