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
  NEW: 'var(--tone-info)',
  IN_PROGRESS: 'var(--tone-warning)',
  CONFIRMED: 'var(--tone-success)',
  FOLLOW_UP: 'var(--tone-followup)',
  RESOLVED: 'var(--text-muted)',
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const contactName =
    conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 rounded-[4px] border px-3 py-3 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        isSelected
          ? 'border-[color:var(--brand-primary-border)] bg-[color:var(--brand-primary-soft)] shadow-[var(--shadow-card)]'
          : 'border-transparent bg-transparent hover:border-[color:var(--surface-border)] hover:bg-[color:var(--surface-0)] hover:shadow-[var(--shadow-card)]',
      )}
    >
      <div className="relative shrink-0 pt-0.5">
        <Avatar initials={conversation.contact.initials} size="md" />
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-[color:var(--surface-0)]"
          style={{ backgroundColor: statusDots[conversation.status] }}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'truncate text-sm text-[color:var(--text-primary)]',
                  conversation.unread ? 'font-semibold' : 'font-medium',
                )}
              >
                {contactName}
              </span>
              {conversation.unread ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)]" aria-hidden="true" />
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[color:var(--text-secondary)]">
              {conversation.summary ?? conversation.lastMessage}
            </p>
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            {conversation.time}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge intent={conversation.intent} />
          <Badge status={conversation.status} />
          {conversation.needsFollowUp ? (
            <span className="text-[11px] font-medium text-[color:var(--text-secondary)]">
              Relance prévue
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
