'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Contact } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ContactPanelProps {
  contact: Contact
}

export function ContactPanel({ contact }: ContactPanelProps) {
  const [tags, setTags] = useState<string[]>(contact.tags)
  const [notes, setNotes] = useState(contact.notes ?? '')
  const [followUp, setFollowUp] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTags(contact.tags)
    setNotes(contact.notes ?? '')
    setFollowUp(false)
  }, [contact.id, contact.tags, contact.notes])

  useEffect(() => {
    const node = notesRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.max(node.scrollHeight, 80)}px`
  }, [notes])

  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col border-l border-[color:var(--border)] bg-[color:var(--bg-card)] lg:flex">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} size="xl" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-[1.2] text-[color:var(--text-primary)]">{contact.name ?? 'Contact'}</p>
              <p className="mt-0.5 truncate text-[13px] leading-[1.3] text-[color:var(--text-secondary)]">{contact.phone ?? 'Aucun numéro'}</p>
            </div>
          </div>
          <Badge tone="neutral" variant="WhatsApp" />
        </div>

        <section className="nx-contact-section grid grid-cols-2 gap-2">
          <div className="rounded-[8px] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            <p className="text-[11px] text-[color:var(--text-muted)]">Conversations</p>
            <p className="mt-1 text-[18px] font-semibold leading-none text-[color:var(--text-primary)]">{contact.totalConversations}</p>
          </div>
          <div className="rounded-[8px] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            <p className="text-[11px] text-[color:var(--text-muted)]">Dernière act.</p>
            <p className="mt-1 text-[12px] font-medium leading-[1.3] text-[color:var(--text-primary)]">{contact.lastSeen ?? 'N/A'}</p>
          </div>
        </section>

        <section className="nx-contact-section">
          <p className="nx-section-label">Tags</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex h-[20px] items-center gap-1 rounded-[var(--radius-badge)] border border-[color:var(--border)] bg-[color:var(--bg-page)] pl-2 pr-1 text-[11px] font-semibold text-[color:var(--text-secondary)]">
                {tag}
                <button type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} aria-label={`Retirer le tag ${tag}`} className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors duration-150 hover:bg-[color:var(--border)] hover:text-[color:var(--text-primary)]">
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </span>
            ))}
            {tags.length === 0 ? <span className="text-[12px] text-[color:var(--text-muted)]">Aucun tag</span> : null}
          </div>
        </section>

        <section className="nx-contact-section">
          <p className="nx-section-label">Notes</p>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ajouter une note..."
            className="nx-input nx-textarea mt-3 min-h-20"
            aria-label="Notes sur le contact"
          />
        </section>

        <section className="nx-contact-section">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-[color:var(--text-primary)]">Relance automatique</span>
            <button
              type="button"
              role="switch"
              aria-checked={followUp}
              aria-label="Activer la relance automatique"
              onClick={() => setFollowUp((value) => !value)}
              className={cn('nx-toggle', followUp && 'is-on')}
            >
              <span className="nx-toggle-thumb" />
            </button>
          </div>
          {followUp ? (
            <input
              type="datetime-local"
              className="nx-input mt-3"
              aria-label="Date et heure de relance"
            />
          ) : null}
        </section>
      </div>
    </aside>
  )
}
