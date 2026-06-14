import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const outbound = message.direction === 'OUTBOUND'

  return (
    <div className={cn('flex max-w-[82%] flex-col md:max-w-[70%]', outbound ? 'ml-auto items-end' : 'mr-auto items-start', !isLast && 'mb-1')}>
      <div
        className={cn(
          'rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[13.5px] leading-[1.55] shadow-[var(--shadow-card)]',
          outbound
            ? 'border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)]'
            : 'border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)]',
        )}
      >
        {message.content}
      </div>
      <span className="mt-1 px-1 text-[11px] text-[color:var(--text-muted)]">{message.timestamp}</span>
    </div>
  )
}
