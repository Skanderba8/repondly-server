'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Plus, Search, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { mockContacts } from '@/lib/mock'

type ContactFilter = 'ALL' | 'VIP' | 'ACTIVE'
type SortMode = 'recent' | 'name'

const filters: Array<{ id: ContactFilter; label: string }> = [
  { id: 'ALL', label: 'Tous' },
  { id: 'VIP', label: 'VIP' },
  { id: 'ACTIVE', label: 'Actifs' },
]

const COLUMNS = 'grid-cols-[2fr_1.35fr_1.5fr_0.7fr_1.1fr]'

export default function ContactsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('ALL')
  const [sortMode, setSortMode] = useState<SortMode>('recent')

  const contacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = mockContacts.filter((contact) => {
      const matchesQuery = !normalizedQuery || [contact.name, contact.phone, contact.tags.join(' '), contact.lastSeen].join(' ').toLowerCase().includes(normalizedQuery)
      if (!matchesQuery) return false
      if (activeFilter === 'VIP') return contact.tags.some((tag) => tag.toLowerCase() === 'vip')
      if (activeFilter === 'ACTIVE') return contact.totalConversations >= 2
      return true
    })
    return filtered.sort((left, right) => sortMode === 'name' ? (left.name ?? '').localeCompare(right.name ?? '', 'fr-FR') : right.totalConversations - left.totalConversations)
  }, [activeFilter, query, sortMode])

  const counts = useMemo(() => ({
    ALL: mockContacts.length,
    VIP: mockContacts.filter((contact) => contact.tags.some((tag) => tag.toLowerCase() === 'vip')).length,
    ACTIVE: mockContacts.filter((contact) => contact.totalConversations >= 2).length,
  }), [])

  return (
    <div className="nx-page">
      <PageHeader
        eyebrow="Base client"
        title="Contacts"
        description="Tous vos contacts avec un historique lisible, des tags et des signaux utiles pour l'équipe."
        actions={<Button variant="secondary" className="w-full sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" />Nouveau contact</Button>}
      />

      <section className="nx-card overflow-hidden">
        <div className="border-b border-[color:var(--border)] px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="nx-no-scrollbar flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={activeFilter === filter.id ? 'nx-filter-chip is-active shrink-0' : 'nx-filter-chip shrink-0'}>
                  <span>{filter.label}</span>
                  <span className="text-[11px] opacity-70">{counts[filter.id]}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 lg:w-[430px] lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" aria-hidden="true" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un contact" className="pl-9" aria-label="Rechercher un contact" />
              </div>
              <label className="nx-input flex h-9 items-center gap-2 px-3 text-[13px] text-[color:var(--text-secondary)]">
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-full border-none bg-transparent outline-none" aria-label="Trier les contacts">
                  <option value="recent">Activité</option>
                  <option value="name">Nom</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className={`nx-table-head ${COLUMNS}`}><span>Nom</span><span>Téléphone</span><span>Tags</span><span>Messages</span><span>Dernière act.</span></div>
          <div>
            {contacts.map((contact) => (
              <button key={contact.id} type="button" onClick={() => router.push(`/contacts/${contact.id}`)} className={`nx-table-row ${COLUMNS} w-full text-left`}>
                <div className="flex min-w-0 items-center gap-3"><Avatar initials={contact.initials} size="sm" /><span className="truncate text-[13px] font-semibold text-[color:var(--text-primary)]">{contact.name}</span></div>
                <span className="truncate text-[13px] text-[color:var(--text-secondary)]">{contact.phone}</span>
                <div className="flex min-w-0 flex-wrap gap-1.5">{contact.tags.slice(0, 2).map((tag) => <Badge key={tag} variant={tag} />)}</div>
                <span className="text-[13px] text-[color:var(--text-secondary)]">{contact.totalConversations}</span>
                <span className="truncate text-[13px] text-[color:var(--text-secondary)]">{contact.lastSeen}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile rows */}
        <div className="divide-y divide-[color:var(--border)] md:hidden">
          {contacts.map((contact) => (
            <button key={contact.id} type="button" onClick={() => router.push(`/contacts/${contact.id}`)} className="w-full px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[color:var(--bg-page)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[color:var(--text-primary)]">{contact.name}</p><p className="mt-0.5 truncate text-[12.5px] text-[color:var(--text-muted)]">{contact.phone}</p></div>
                <span className="text-[12px] text-[color:var(--text-secondary)]">{contact.totalConversations}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">{contact.tags.map((tag) => <Badge key={tag} variant={tag} />)}</div>
            </button>
          ))}
        </div>

        {contacts.length === 0 ? <EmptyState icon={<Users className="h-4 w-4" aria-hidden="true" />} title="Aucun contact trouvé" description="Affinez votre recherche ou changez de filtre." /> : null}
      </section>
    </div>
  )
}
