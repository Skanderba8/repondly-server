import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'type'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--brand)] text-[var(--text-on-brand)] hover:bg-[var(--brand-primary-hover)]',
  secondary: 'border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
  ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--danger)] text-[var(--text-on-brand)] hover:opacity-90',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-xs',
  md: 'h-8 px-4 text-sm',
  lg: 'h-9 px-5 text-sm',
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
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-100',
        'disabled:cursor-not-allowed disabled:opacity-50',
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
