import type { MouseEventHandler } from 'react'
import type { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface ConversationCardProps {
  conversation: Conversation
  isSelected: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}

const statusDots: Record<Conversation['status'], string> = {
  NEW: '#1B4FFF',
  IN_PROGRESS: '#D97706',
  CONFIRMED: '#16A34A',
  FOLLOW_UP: '#9333EA',
  RESOLVED: 'var(--text-muted)',
}

export function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const contactName = conversation.contact.name ?? conversation.contact.phone ?? conversation.contact.initials

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 w-full cursor-pointer items-center gap-3 border-l-2 border-transparent px-3 text-left transition-colors duration-100',
        isSelected ? 'bg-[var(--brand-soft)]' : 'bg-transparent hover:bg-[var(--surface-2)]',
      )}
      style={{ borderLeftColor: isSelected ? 'var(--brand)' : 'transparent' }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusDots[conversation.status] }}
        aria-hidden="true"
      />
      <Avatar initials={conversation.contact.initials} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--text-primary)]">{contactName}</span>
          <Badge status={conversation.status} />
        </div>
        <p className="truncate text-xs text-[var(--text-secondary)]">{conversation.lastMessage}</p>
      </div>
      <span className="shrink-0 self-start pt-0.5 text-right text-xs text-[var(--text-muted)]">{conversation.time}</span>
    </button>
  )
}
