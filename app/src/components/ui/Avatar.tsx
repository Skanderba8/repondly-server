import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  initials: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'nx-avatar-sm',
  md: 'nx-avatar-md',
  lg: 'nx-avatar-lg',
  xl: 'nx-avatar-xl',
}

export function Avatar({ initials, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn('nx-avatar', sizeClasses[size], className)} aria-hidden="true">
      {initials}
    </div>
  )
}
