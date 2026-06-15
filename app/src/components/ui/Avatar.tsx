import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  initials: string
  size?: AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-[12px]',
  lg: 'h-[38px] w-[38px] text-[13px]',
  xl: 'h-11 w-11 text-[15px]',
}

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-border)]',
        'bg-[color:var(--color-surface-subtle)] font-semibold text-[color:var(--color-text-secondary)]',
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
