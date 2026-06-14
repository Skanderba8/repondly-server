import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const outbound = message.direction === 'OUTBOUND'

  return (
    <div className={cn('flex max-w-[75%] flex-col', outbound ? 'ml-auto items-end' : 'mr-auto items-start', !isLast && 'mb-2')}>
      <div
        className={cn(
          'rounded px-3 py-2 text-sm',
          outbound
            ? 'bg-[var(--brand)] text-[var(--text-on-brand)]'
            : 'border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)]',
        )}
      >
        {message.content}
      </div>
      <span className="mt-1 text-xs text-[var(--text-muted)]">{message.timestamp}</span>
    </div>
  )
}
