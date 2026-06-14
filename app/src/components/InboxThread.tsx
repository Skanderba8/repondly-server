'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
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
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-4 py-4 md:px-5">
        {showBackButton ? (
          <Link
            href="/inbox"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[color:var(--text-secondary)] shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)] md:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}

        <Avatar initials={conversation.contact.initials} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">
              {conversation.contact.name}
            </p>
            {conversation.unread ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)]" aria-hidden="true" />
            ) : null}
          </div>
          <p className="truncate text-[13px] text-[color:var(--text-secondary)]">
            {conversation.contact.phone ?? 'Conversation active'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge intent={conversation.intent} />
          <button
            type="button"
            className="rp-field-control inline-flex h-9 items-center gap-2 px-3 text-xs font-medium text-[color:var(--text-primary)]"
          >
            <span>{conversation.status}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_84%,var(--surface-0)_16%),var(--surface-1))] px-4 py-4 md:px-5 md:py-5">
          {conversation.summary ? (
            <div className="rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-4 py-3 text-sm text-[color:var(--text-secondary)] shadow-[var(--shadow-card)]">
              <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                Résumé
              </span>
              {conversation.summary}
            </div>
          ) : null}

          {(conversation.messages ?? []).map((message, index, messages) => (
            <MessageBubble
              key={message.id}
              message={{
                ...message,
                timestamp: new Intl.DateTimeFormat('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(message.timestamp)),
              }}
              isLast={index === messages.length - 1}
            />
          ))}
        </div>

        <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-4 py-4 md:px-5">
          <SuggestionChips suggestions={suggestions} onSelect={setDraft} />
          <div className="mt-3 flex items-center gap-3">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Écrire une réponse claire et rapide"
              className="h-11 flex-1"
            />
            <Button size="lg">Envoyer</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
