'use client'

import { ReactNode } from 'react'

interface FieldGroupProps {
  children: ReactNode
  columns?: 1 | 2 | 3
}

/**
 * Responsive grid wrapper for form fields.
 * Stacks to single column on mobile by default.
 */
export function FieldGroup({ children, columns = 2 }: FieldGroupProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  }[columns]

  return (
    <div className={`grid ${colClass} gap-4`}>
      {children}
    </div>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

/**
 * Wraps a label + input with optional required marker and hint text.
 */
export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ml-1" style={{ color: 'var(--amber-primary)' }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <span className="text-xs" style={{ color: 'var(--foreground-subtle)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}
