'use client'

import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Ellipsis, Send } from 'lucide-react'
import type { Conversation, Message } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MessageBubble } from '@/components/MessageBubble'
import { SuggestionChips } from '@/components/SuggestionChips'
import { useMessageRealtime } from '@/lib/realtime/useMessageRealtime'

const DEFAULT_SUGGESTIONS = [
  'Oui bien sur, quel creneau vous convient ?',
  'Desole, nous sommes complets.',
  'Je vous rappelle dans un instant.',
]

const STATUS_OPTIONS: Conversation['status'][] = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'FOLLOW_UP', 'RESOLVED']

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
  const [messages, setMessages] = useState<Message[]>(conversation.messages ?? [])
  const [status, setStatus] = useState<Conversation['status']>(conversation.status)
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const statusMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraft('')
    setMessages(conversation.messages ?? [])
    setStatus(conversation.status)
    setIsStatusMenuOpen(false)
  }, [conversation.id, conversation.messages, conversation.status])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [conversation.id])

  const handleRealtimeMessage = useCallback((msg: { id: string; content: string; direction: Message['direction']; createdAt: string }) => {
    setMessages((current) => {
      if (current.some((message) => message.id === msg.id)) {
        return current
      }

      return [
        ...current,
        {
          id: msg.id,
          content: msg.content,
          direction: msg.direction,
          timestamp: msg.createdAt,
        },
      ]
    })

    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }, [])

  useMessageRealtime(conversation.id, handleRealtimeMessage)

  function autoResize() {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 112)}px`
  }

  useEffect(() => {
    autoResize()
  }, [draft])

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setIsStatusMenuOpen(false)
      }
    }

    if (!isStatusMenuOpen) {
      return
    }

    document.addEventListener('mousedown', handleDocumentClick)

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [isStatusMenuOpen])

  async function handleSend() {
    const content = draft.trim()

    if (!content || isSending) {
      return
    }

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      direction: 'OUTBOUND',
      timestamp: new Date().toISOString(),
    }

    setIsSending(true)
    setMessages((current) => [...current, optimisticMessage])
    setDraft('')

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id))
        setDraft(content)
        return
      }

      const payload = (await response.json()) as {
        data?: {
          message?: {
            id: string
            content: string
            direction: Message['direction']
            createdAt: string
          }
        }
      }

      const savedMessage = payload.data?.message

      if (!savedMessage) {
        return
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id
            ? {
                id: savedMessage.id,
                content: savedMessage.content,
                direction: savedMessage.direction,
                timestamp: savedMessage.createdAt,
              }
            : message,
        ),
      )
    } finally {
      setIsSending(false)
    }
  }

  async function handleStatusChange(nextStatus: Conversation['status']) {
    if (nextStatus === status || isUpdatingStatus) {
      setIsStatusMenuOpen(false)
      return
    }

    const previousStatus = status
    setStatus(nextStatus)
    setIsUpdatingStatus(true)
    setIsStatusMenuOpen(false)

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        setStatus(previousStatus)
      }
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  let lastDayKey = ''

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--bg-card)]">
      <div className="flex min-h-[56px] flex-wrap items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--bg-card)] px-4 py-2.5">
        {showBackButton ? (
          <Link href="/inbox" className="nx-btn nx-btn-secondary nx-btn-icon-md md:hidden" aria-label="Retour a l'inbox">
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

        <div ref={statusMenuRef} className="relative flex flex-wrap items-center gap-2">
          <Badge intent={conversation.intent} />
          <button
            type="button"
            className="nx-btn nx-btn-secondary nx-btn-sm"
            aria-label="Changer le statut"
            onClick={() => setIsStatusMenuOpen((current) => !current)}
            disabled={isUpdatingStatus}
          >
            <Badge status={status} />
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
          </button>
          {isStatusMenuOpen ? (
            <div className="absolute right-0 top-full z-20 mt-2 flex min-w-[190px] flex-col gap-1 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-card)] p-2 shadow-[var(--shadow-dropdown)]">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="nx-btn nx-btn-ghost justify-between"
                  onClick={() => void handleStatusChange(option)}
                >
                  <Badge status={option} />
                  {option === status ? <span className="text-[12px] text-[color:var(--text-muted)]">Actuel</span> : null}
                </button>
              ))}
            </div>
          ) : null}
          <Button variant="secondary" size="icon" aria-label="Plus d'actions">
            <Ellipsis className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {conversation.summary ? (
        <div className="flex min-h-[40px] items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-page)] px-4 py-2 text-[12.5px] italic leading-[1.4] text-[color:var(--text-secondary)]">
          <span className="not-italic text-[10px] font-bold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">Resume</span>
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
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-[color:var(--border)] bg-[color:var(--bg-card)] px-4 py-3">
          <SuggestionChips suggestions={suggestions} onSelect={setDraft} />
          <div className="mt-3 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ecrire une reponse claire et rapide..."
              className="nx-input nx-textarea min-h-9 flex-1"
              aria-label="Ecrire une reponse"
            />
            <Button size="lg" aria-label="Envoyer la reponse" onClick={() => void handleSend()} disabled={!draft.trim()} loading={isSending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Envoyer</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
