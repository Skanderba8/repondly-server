import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  initials: string
  size?: AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-[12px]',
  lg: 'h-10 w-10 text-[13px]',
  xl: 'h-12 w-12 text-[14px]',
}

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-primary-border)]',
        'bg-[color:var(--brand-primary-soft)] font-semibold text-[color:var(--brand-primary)]',
        sizeStyles[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
