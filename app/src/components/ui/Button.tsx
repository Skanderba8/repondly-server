import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-md'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'type'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'nx-btn-primary',
  secondary: 'nx-btn-secondary',
  ghost: 'nx-btn-ghost',
  danger: 'nx-btn-danger',
  outline: 'nx-btn-secondary',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'nx-btn-sm',
  md: '',
  lg: 'nx-btn-lg',
  icon: 'nx-btn-icon',
  'icon-md': 'nx-btn-icon-md',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  loading,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('nx-btn relative', variantClasses[variant], sizeClasses[size], loading && 'pointer-events-none', className)}
      {...props}
    >
      {loading ? (
        <svg className="absolute h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
      ) : null}
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}>{children}</span>
    </button>
  )
}
