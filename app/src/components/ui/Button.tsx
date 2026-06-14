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
    'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)] hover:bg-[color:var(--brand-primary-hover)]',
  secondary:
    'border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-1)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)]',
  danger:
    'border-[color:var(--tone-danger)] bg-[color:var(--tone-danger)] text-[color:var(--text-on-brand)] hover:opacity-96',
  subtle:
    'border-[color:var(--surface-border)] bg-[color:var(--surface-1)] text-[color:var(--text-primary)] hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-2)]',
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
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--transition-fast)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
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
