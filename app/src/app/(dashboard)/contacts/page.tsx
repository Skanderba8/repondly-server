'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { mockContacts } from '@/lib/mock'

export default function ContactsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const contacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return mockContacts
    }

    return mockContacts.filter((contact) =>
      [contact.name, contact.phone, contact.tags.join(' ')].some((value) =>
        (value ?? '').toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [query])

  return (
    <div className="rp-page !gap-4">
      <section className="rp-page-header">
        <div>
          <p className="rp-section-label">Base client</p>
          <h1 className="rp-page-title">Contacts</h1>
        </div>
        <div className="w-full md:w-[280px]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un contact"
          />
        </div>
      </section>

      <div className="rp-panel overflow-hidden p-0">
        <div className="hidden md:block">
          <div className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr] border-b border-[color:var(--surface-border)] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
            <span>Nom</span>
            <span>Téléphone</span>
            <span>Conversations</span>
            <span>Tags</span>
          </div>
          <div>
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => router.push(`/contacts/${contact.id}`)}
                className="grid h-14 w-full grid-cols-[2fr_1.4fr_1fr_1.4fr] items-center border-b border-[color:var(--surface-border)] px-4 text-left transition-colors duration-200 hover:bg-[color:var(--surface-2)]"
              >
                <span className="truncate text-sm font-medium text-[color:var(--text-primary)]">{contact.name}</span>
                <span className="truncate text-sm text-[color:var(--text-secondary)]">{contact.phone}</span>
                <span className="text-sm text-[color:var(--text-secondary)]">{contact.totalConversations}</span>
                <span className="truncate text-sm text-[color:var(--text-secondary)]">{contact.tags.join(', ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[color:var(--surface-border)] md:hidden">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => router.push(`/contacts/${contact.id}`)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-200 hover:bg-[color:var(--surface-2)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{contact.name}</p>
                <p className="truncate text-sm text-[color:var(--text-secondary)]">{contact.phone}</p>
              </div>
              <span className="shrink-0 text-sm text-[color:var(--text-secondary)]">{contact.totalConversations}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
