import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const outbound = message.direction === 'OUTBOUND'

  return (
    <div
      className={cn(
        'flex max-w-[80%] flex-col',
        outbound ? 'ml-auto items-end' : 'mr-auto items-start',
        !isLast && 'mb-2',
      )}
    >
      <div
        className={cn(
          'rounded-[4px] border px-3 py-2.5 text-sm leading-6 shadow-[var(--shadow-card)]',
          outbound
            ? 'border-[color:var(--brand-primary-border)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
            : 'border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)]',
        )}
      >
        {message.content}
      </div>
      <span className="mt-1 px-1 text-[11px] text-[color:var(--text-muted)]">{message.timestamp}</span>
    </div>
  )
}
