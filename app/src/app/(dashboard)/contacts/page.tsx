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
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Contacts</h1>
        <div className="ml-auto w-full max-w-[240px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" />
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[2fr_1.4fr_1fr_1.4fr] border-b border-[var(--border)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
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
              className="grid h-11 w-full grid-cols-[2fr_1.4fr_1fr_1.4fr] items-center border-b border-[var(--border)] px-4 text-left transition-colors duration-100 hover:bg-[var(--surface-2)]"
            >
              <span className="truncate text-sm text-[var(--text-primary)]">{contact.name}</span>
              <span className="truncate text-sm text-[var(--text-secondary)]">{contact.phone}</span>
              <span className="text-sm text-[var(--text-secondary)]">{contact.totalConversations}</span>
              <span className="truncate text-sm text-[var(--text-secondary)]">{contact.tags.join(', ')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => router.push(`/contacts/${contact.id}`)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-100 hover:bg-[var(--surface-2)]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{contact.name}</p>
              <p className="truncate text-sm text-[var(--text-secondary)]">{contact.phone}</p>
            </div>
            <span className="shrink-0 text-sm text-[var(--text-secondary)]">{contact.totalConversations}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
