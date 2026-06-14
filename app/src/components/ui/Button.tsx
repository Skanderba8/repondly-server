import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'type'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)] hover:border-[color:var(--brand-primary-hover)] hover:bg-[color:var(--brand-primary-hover)]',
  secondary: 'border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-2)]',
  ghost: 'border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
  danger: 'border-[color:var(--tone-danger)] bg-[color:var(--tone-danger)] text-[color:var(--text-on-brand)] hover:opacity-90',
  subtle: 'border-[color:var(--surface-border)] bg-[color:var(--surface-2)] text-[color:var(--text-secondary)] hover:border-[color:var(--surface-border-strong)] hover:text-[color:var(--text-primary)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-9 px-3.5 text-[13px] gap-2',
  lg: 'h-10 px-4 text-[13.5px] gap-2',
  icon: 'h-8 w-8 p-0 text-[13px]',
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
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border font-semibold leading-none',
        'transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-[var(--transition-fast)]',
        'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
        'focus-visible:shadow-[var(--shadow-focus)]',
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
