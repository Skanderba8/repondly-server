import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string
}

export function Input({ className, type = 'text', ...props }: InputProps) {
  return <input type={type} className={cn('rp-field-control h-11 w-full px-3.5 text-[14px]', className)} {...props} />
}
