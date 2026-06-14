'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Conversation } from '@/types'
import { MessageBubble } from '@/components/MessageBubble'
import { SuggestionChips } from '@/components/SuggestionChips'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const suggestions = [
  'Oui bien sûr, quel créneau vous convient?',
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
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-1)]">
      <div className="flex h-12 items-center gap-3 border-b border-[var(--border)] bg-white px-4">
        {showBackButton ? (
          <Link
            href="/inbox"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] border border-[var(--border)] text-[var(--text-secondary)] transition-colors duration-100 hover:bg-[var(--surface-2)] md:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--text-primary)]">{conversation.contact.name}</p>
        </div>
        <Badge intent={conversation.intent} />
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-[4px] border border-[var(--border)] px-2 text-xs text-[var(--text-secondary)]"
        >
          Statut
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[var(--surface-1)] p-4">
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

        <div className="border-t border-[var(--border)] bg-white px-4 py-2">
          <SuggestionChips suggestions={suggestions} onSelect={setDraft} />
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-white px-4 py-3">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} className="flex-1" />
          <Button size="md">Envoyer</Button>
        </div>
      </div>
    </div>
  )
}
