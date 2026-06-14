import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'type'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-[color:var(--brand-primary-border)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)] shadow-[var(--shadow-card)] hover:bg-[color:var(--brand-primary-hover)] hover:shadow-[var(--shadow-elevated)]',
  secondary:
    'border-[color:var(--surface-border-strong)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] shadow-[var(--shadow-card)] hover:border-[color:var(--brand-primary-border)] hover:bg-[color:var(--surface-0)] hover:shadow-[var(--shadow-elevated)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
  danger:
    'border-[color:var(--tone-danger-border)] bg-[color:var(--tone-danger)] text-[color:var(--text-on-brand)] shadow-[var(--shadow-card)] hover:opacity-96 hover:shadow-[var(--shadow-elevated)]',
  subtle:
    'border-[color:var(--surface-border)] bg-[color:var(--surface-2)] text-[color:var(--text-primary)] hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-3)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[4px] border font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:-translate-y-[1px] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
