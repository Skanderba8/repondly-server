import { CheckCheck } from 'lucide-react'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
  showTimestamp?: boolean
}

export function MessageBubble({ message, isLast, showTimestamp }: MessageBubbleProps) {
  const outbound = message.direction === 'OUTBOUND'
  const withTimestamp = showTimestamp ?? isLast

  return (
    <div className={cn('flex max-w-[82%] flex-col md:max-w-[72%]', outbound ? 'ml-auto items-end' : 'mr-auto items-start', !isLast && 'mb-0.5')}>
      <div
        className={cn(
          'rounded-[var(--radius-sm)] border px-3.5 py-2 text-[13.5px] leading-[1.5]',
          outbound
            ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-text-inverse)]'
            : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-primary)]',
        )}
      >
        {message.content}
      </div>
      {withTimestamp ? (
        <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-[color:var(--color-text-muted)]">
          <span>{message.timestamp}</span>
          {outbound ? <CheckCheck className="h-3 w-3" aria-label="Envoyé" /> : null}
        </div>
      ) : null}
    </div>
  )
}
