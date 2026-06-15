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
  NEW: 'var(--color-info)',
  IN_PROGRESS: 'var(--color-warning)',
  CONFIRMED: 'var(--color-success)',
  FOLLOW_UP: 'var(--color-follow-up)',
  RESOLVED: 'var(--color-text-muted)',
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const contactName = conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[72px] w-full items-start gap-3 border-b border-l-2 border-[color:var(--color-border-subtle)] px-3.5 py-3 text-left',
        'transition-[background-color,border-color] duration-[var(--ease-fast)] focus-visible:relative focus-visible:z-10',
        isSelected
          ? 'border-l-[color:var(--color-accent)] bg-[color:var(--color-surface-hover)]'
          : 'border-l-transparent bg-[color:var(--color-surface)] hover:bg-[color:var(--color-surface-hover)]',
      )}
    >
      <div className="relative shrink-0 pt-0.5">
        <Avatar initials={conversation.contact.initials} size="md" />
        <span
          className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-[color:var(--color-surface)]"
          style={{ backgroundColor: statusDots[conversation.status] }}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn('truncate text-[13px] leading-[1.25] text-[color:var(--color-text-primary)]', conversation.unread ? 'font-semibold' : 'font-medium')}>
              {contactName}
            </span>
            {conversation.unread ? <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-[color:var(--color-info)]" aria-hidden="true" /> : null}
          </div>
          <span className="shrink-0 text-[11px] font-medium text-[color:var(--color-text-muted)]">{conversation.time}</span>
        </div>

        <p className="mt-1 line-clamp-1 text-[12.5px] leading-[1.45] text-[color:var(--color-text-secondary)]">
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
