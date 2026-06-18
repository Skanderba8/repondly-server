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
  const imageUrl = message.type === 'IMAGE' ? message.mediaUrl : undefined

  return (
    <div className={cn('flex max-w-[82%] flex-col md:max-w-[72%]', outbound ? 'ml-auto items-end' : 'mr-auto items-start', !isLast && 'mb-0.5')}>
      <div
        className={cn(
          'rounded-[8px] border px-3.5 py-2 text-[13.5px] leading-[1.5]',
          outbound
            ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
            : 'border-[color:var(--border)] bg-[color:var(--bg-card)] text-[color:var(--text-primary)]',
          imageUrl && 'p-1',
        )}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={message.content || 'Image produit'} className="max-h-[260px] max-w-full rounded-[var(--radius-btn)] object-cover" />
        ) : (
          message.content
        )}
      </div>
      {withTimestamp ? (
        <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-[color:var(--text-muted)]">
          <span>{message.timestamp}</span>
          {outbound ? <CheckCheck className="h-3 w-3" aria-label="Envoyé" /> : null}
        </div>
      ) : null}
    </div>
  )
}
