import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

interface AvatarProps {
  initials: string
  size?: AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-[var(--surface-2)] font-medium text-[var(--text-secondary)]',
        sizeStyles[size],
        className,
      )}
    >
      {initials}
    </div>
  )
}
