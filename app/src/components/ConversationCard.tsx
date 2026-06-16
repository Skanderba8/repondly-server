import type { MouseEventHandler } from 'react'
import type { Conversation } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}

const statusDots: Record<Conversation['status'], string> = {
  NEW: 'var(--brand)',
  IN_PROGRESS: 'var(--warning)',
  CONFIRMED: 'var(--success)',
  FOLLOW_UP: 'var(--followup)',
  RESOLVED: 'var(--text-muted)',
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const contactName = conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[72px] w-full items-start gap-3 border-b border-[color:var(--border)] px-3.5 py-3 text-left',
        'transition-[background-color,border-color] duration-150 focus-visible:relative focus-visible:z-10',
        isSelected
          ? 'bg-[color:var(--brand-soft)]'
          : 'bg-[color:var(--bg-card)] hover:bg-[color:var(--bg-page)]',
      )}
    >
      <div className="relative shrink-0 pt-0.5">
        <Avatar initials={conversation.contact.initials} size="md" />
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-white"
          style={{ backgroundColor: statusDots[conversation.status] }}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn('truncate text-[13px] leading-[1.25] text-[color:var(--text-primary)]', conversation.unread ? 'font-semibold' : 'font-medium')}>
              {contactName}
            </span>
            {conversation.unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand)]" aria-hidden="true" /> : null}
          </div>
          <span className="shrink-0 text-[11px] font-medium text-[color:var(--text-muted)]">{conversation.time}</span>
        </div>

        <p className="mt-1 line-clamp-1 text-[12.5px] leading-[1.45] text-[color:var(--text-secondary)]">
          {conversation.summary ?? conversation.lastMessage}
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge intent={conversation.intent} />
          <Badge status={conversation.status} />
        </div>
      </div>
    </button>
  )
}
