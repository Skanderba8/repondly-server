'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Ellipsis, Send } from 'lucide-react'
import type { Conversation } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageBubble } from '@/components/MessageBubble'
import { SuggestionChips } from '@/components/SuggestionChips'

const suggestions = [
  'Oui bien sûr, quel créneau vous convient ?',
  'Désolé, nous sommes complets.',
  'Je vous rappelle dans un instant.',
]

interface InboxThreadProps {
  conversation: Conversation
  showBackButton?: boolean
}

export function InboxThread({ conversation, showBackButton = false }: InboxThreadProps) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setDraft('')
  }, [conversation.id])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--surface-0)]">
      <div className="flex min-h-[60px] flex-wrap items-center gap-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-4 py-3">
        {showBackButton ? (
          <Link href="/inbox" className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)] md:hidden" aria-label="Retour à l'inbox">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}

        <Avatar initials={conversation.contact.initials} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-semibold text-[color:var(--text-primary)]">{conversation.contact.name}</p>
            {conversation.unread ? <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand-primary)]" aria-hidden="true" /> : null}
          </div>
          <p className="truncate text-[12.5px] text-[color:var(--text-muted)]">{conversation.contact.phone ?? 'Conversation active'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge intent={conversation.intent} />
          <button type="button" className="inline-flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-2.5 text-[12px] font-semibold text-[color:var(--text-primary)] transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--surface-2)]">
            <span><Badge status={conversation.status} /></span>
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
          </button>
          <Button variant="secondary" size="icon" aria-label="Plus d'actions">
            <Ellipsis className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {conversation.summary ? (
        <div className="border-b border-[color:var(--surface-border)] bg-[color:var(--surface-1)] px-4 py-2.5 text-[12.5px] leading-[1.5] text-[color:var(--text-secondary)]">
          <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Résumé</span>
          {conversation.summary}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[color:var(--surface-1)] px-4 py-4">
          {(conversation.messages ?? []).map((message, index, messages) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                timestamp: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.timestamp)),
              }}
              isLast={index === messages.length - 1}
            />
          ))}
        </div>

        <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-4 py-3">
          <SuggestionChips suggestions={suggestions} onSelect={setDraft} />
          <div className="mt-3 flex items-center gap-2">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écrire une réponse claire et rapide..." className="h-10 flex-1" />
            <Button size="lg" aria-label="Envoyer la réponse">
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Envoyer</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
