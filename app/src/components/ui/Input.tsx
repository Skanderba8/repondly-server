import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string
}

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-8 w-full rounded border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-100',
        'placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]',
        className,
      )}
      {...props}
    />
  )
}
