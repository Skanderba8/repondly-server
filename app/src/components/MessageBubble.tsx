import type { Message } from '@/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isLast: boolean
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const outbound = message.direction === 'OUTBOUND'

  return (
    <div className={cn('flex max-w-[72%] flex-col', outbound ? 'ml-auto items-end' : 'mr-auto items-start', !isLast && 'mb-2')}>
      <div
        className={cn(
          'px-[14px] py-[10px] text-[14px] leading-[1.5]',
          outbound
            ? 'rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[2px] rounded-br-[12px] bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)]'
            : 'rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[2px] bg-[color:var(--surface-2)] text-[color:var(--text-primary)]',
        )}
      >
        {message.content}
      </div>
      <span className="mt-1 px-1 text-[11px] text-[color:var(--text-muted)]">{message.timestamp}</span>
    </div>
  )
}
