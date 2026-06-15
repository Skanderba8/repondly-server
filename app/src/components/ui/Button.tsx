import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'type'> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-text-inverse)] hover:border-[color:var(--color-accent-hover)] hover:bg-[color:var(--color-accent-hover)]',
  secondary: 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)] hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-subtle)]',
  ghost: 'border-transparent bg-transparent text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] hover:text-[color:var(--color-text-primary)]',
  danger: 'border-[color:var(--color-danger)] bg-[color:var(--color-danger)] text-[color:var(--color-text-inverse)] hover:opacity-90',
  outline: 'border-[color:var(--color-border-strong)] bg-transparent text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-subtle)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[11px] gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-2',
  lg: 'h-9 px-3.5 text-[13.5px] gap-2',
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
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border font-medium leading-none',
        'transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-[var(--ease-fast)]',
        'active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0',
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
