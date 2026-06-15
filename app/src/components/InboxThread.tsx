'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Ellipsis, Send } from 'lucide-react'
import type { Conversation, Message } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MessageBubble } from '@/components/MessageBubble'
import { SuggestionChips } from '@/components/SuggestionChips'

const DEFAULT_SUGGESTIONS = [
  'Oui bien sûr, quel créneau vous convient ?',
  'Désolé, nous sommes complets.',
  'Je vous rappelle dans un instant.',
]

interface InboxThreadProps {
  conversation: Conversation
  showBackButton?: boolean
  suggestions?: string[]
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDayDivider(value: string) {
  const date = new Date(value)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (dayKey(date) === dayKey(now)) return "Aujourd'hui"
  if (dayKey(date) === dayKey(yesterday)) return 'Hier'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function InboxThread({ conversation, showBackButton = false, suggestions = DEFAULT_SUGGESTIONS }: InboxThreadProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft('')
  }, [conversation.id])

  function autoResize() {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 112)}px`
  }

  useEffect(() => {
    autoResize()
  }, [draft])

  const messages: Message[] = conversation.messages ?? []
  let lastDayKey = ''

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--bg-card)]">
      <div className="flex min-h-[56px] flex-wrap items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--bg-card)] px-4 py-2.5">
        {showBackButton ? (
          <Link href="/inbox" className="nx-btn nx-btn-secondary nx-btn-icon-md md:hidden" aria-label="Retour à l'inbox">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}

        <Avatar initials={conversation.contact.initials} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold text-[color:var(--text-primary)]">{conversation.contact.name}</p>
            {conversation.unread ? <span className="h-[5px] w-[5px] rounded-full bg-[color:var(--brand)]" aria-hidden="true" /> : null}
          </div>
          <p className="truncate text-[12.5px] text-[color:var(--text-muted)]">{conversation.contact.phone ?? 'Conversation active'}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge intent={conversation.intent} />
          <button type="button" className="nx-btn nx-btn-secondary nx-btn-sm" aria-label="Changer le statut">
            <Badge status={conversation.status} />
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
          </button>
          <Button variant="secondary" size="icon" aria-label="Plus d'actions">
            <Ellipsis className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {conversation.summary ? (
        <div className="flex min-h-[40px] items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-page)] px-4 py-2 text-[12.5px] italic leading-[1.4] text-[color:var(--text-secondary)]">
          <span className="not-italic text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">Résumé</span>
          <span className="min-w-0 truncate">{conversation.summary}</span>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-[color:var(--bg-page)] px-4 py-4">
          {messages.map((message, index) => {
            const key = dayKey(new Date(message.timestamp))
            const showDivider = key !== lastDayKey
            lastDayKey = key
            const nextMessage = messages[index + 1]
            const isGroupEnd = !nextMessage || nextMessage.direction !== message.direction || dayKey(new Date(nextMessage.timestamp)) !== key
            return (
              <div key={message.id} className="flex flex-col gap-1">
                {showDivider ? (
                  <div className="my-2 flex items-center justify-center">
                    <span className="rounded-[var(--radius-badge)] bg-[color:var(--bg-card)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--text-muted)]">{formatDayDivider(message.timestamp)}</span>
                  </div>
                ) : null}
                <MessageBubble
                  message={{ ...message, timestamp: formatTime(message.timestamp) }}
                  isLast={index === messages.length - 1}
                  showTimestamp={isGroupEnd}
                />
              </div>
            )
          })}
        </div>

        <div className="border-t border-[color:var(--border)] bg-[color:var(--bg-card)] px-4 py-3">
          <SuggestionChips suggestions={suggestions} onSelect={setDraft} />
          <div className="mt-3 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={1}
              placeholder="Écrire une réponse claire et rapide..."
              className="nx-input nx-textarea min-h-9 flex-1"
              aria-label="Écrire une réponse"
            />
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
