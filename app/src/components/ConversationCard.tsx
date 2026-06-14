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
  NEW: 'var(--brand-primary)',
  IN_PROGRESS: 'var(--tone-warning)',
  CONFIRMED: 'var(--tone-success)',
  FOLLOW_UP: 'var(--tone-followup)',
  RESOLVED: 'var(--text-muted)',
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const contactName = conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-[72px] w-full items-start gap-3 border-b border-[color:var(--surface-border)] px-[14px] py-[10px] text-left transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--transition-base)]',
        isSelected
          ? 'bg-[color:color-mix(in_srgb,var(--brand-primary-soft)_45%,var(--surface-0)_55%)] shadow-[inset_2px_0_0_var(--brand-primary)]'
          : 'bg-transparent hover:bg-[color:var(--surface-1)]',
      )}
    >
      <div className="relative shrink-0">
        <Avatar initials={conversation.contact.initials} size="sm" />
        <span
          className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: statusDots[conversation.status] }}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('truncate text-[13px] leading-[1.2] text-[color:var(--text-primary)]', conversation.unread ? 'font-semibold' : 'font-medium')}>
                {contactName}
              </span>
              {conversation.unread ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-primary)]" aria-hidden="true" /> : null}
            </div>
            <p className="mt-1 line-clamp-1 text-[12px] leading-[1.5] text-[color:var(--text-secondary)]">
              {conversation.summary ?? conversation.lastMessage}
            </p>
          </div>
          <span className="shrink-0 pt-0.5 text-[11px] font-medium text-[color:var(--text-muted)]">{conversation.time}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Badge intent={conversation.intent} />
          {conversation.status === 'NEW' ? <Badge variant="NEW" tone="success" /> : null}
          {conversation.status === 'FOLLOW_UP' ? (
            <Badge
              variant="RELANCE"
              className="border-[color:var(--tone-followup-border)] bg-[color:var(--tone-followup-soft)] text-[color:var(--tone-followup)]"
            />
          ) : null}
          {conversation.status === 'RESOLVED' ? <Badge variant="RÉSOLU" /> : null}
        </div>
      </div>
    </button>
  )
}
