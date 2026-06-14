'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Plus, Search, Users } from 'lucide-react'
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
    <div className="rp-page">
      <PageHeader
        eyebrow="Base client"
        title="Contacts"
        description="Tous vos contacts WhatsApp avec un historique lisible, des tags et des signaux utiles pour l'équipe."
        actions={<Button className="w-full sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" />Nouveau contact</Button>}
      />

      <section className="rp-panel overflow-hidden p-0">
        <div className="border-b border-[color:var(--surface-border)] px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((filter) => (
                <button key={filter.id} type="button" onClick={() => setActiveFilter(filter.id)} className={activeFilter === filter.id ? 'rp-filter-chip is-active shrink-0' : 'rp-filter-chip shrink-0'}>
                  <span>{filter.label}</span>
                  <span className="rp-filter-chip-count">{counts[filter.id]}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 lg:w-[430px] lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" aria-hidden="true" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un contact" className="pl-9" />
              </div>
              <label className="rp-field-control flex h-9 items-center gap-2 px-3 text-[13px] text-[color:var(--text-secondary)]">
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-full border-none bg-transparent outline-none">
                  <option value="recent">Activité</option>
                  <option value="name">Nom</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="rp-table-head grid-cols-[2fr_1.35fr_1.5fr_0.8fr_1.1fr]"><span>Nom</span><span>Téléphone</span><span>Tags</span><span>Messages</span><span>Dernière act.</span></div>
          <div>
            {contacts.map((contact) => (
              <button key={contact.id} type="button" onClick={() => router.push(`/contacts/${contact.id}`)} className="rp-table-row grid-cols-[2fr_1.35fr_1.5fr_0.8fr_1.1fr] w-full text-left">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-primary-border)] bg-[color:var(--brand-primary-soft)] text-[11px] font-semibold text-[color:var(--brand-primary)]">{contact.initials}</div><span className="truncate text-[13px] font-semibold text-[color:var(--text-primary)]">{contact.name}</span></div>
                <span className="truncate text-[13px] text-[color:var(--text-secondary)]">{contact.phone}</span>
                <div className="flex min-w-0 flex-wrap gap-1.5">{contact.tags.slice(0, 2).map((tag) => <Badge key={tag} variant={tag} />)}</div>
                <span className="text-[13px] text-[color:var(--text-secondary)]">{contact.totalConversations}</span>
                <span className="truncate text-[13px] text-[color:var(--text-secondary)]">{contact.lastSeen}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[color:var(--surface-border)] md:hidden">
          {contacts.map((contact) => (
            <button key={contact.id} type="button" onClick={() => router.push(`/contacts/${contact.id}`)} className="w-full px-4 py-4 text-left transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--surface-1)]">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[color:var(--text-primary)]">{contact.name}</p><p className="mt-1 truncate text-[12.5px] text-[color:var(--text-muted)]">{contact.phone}</p></div><span className="text-[12px] text-[color:var(--text-secondary)]">{contact.totalConversations}</span></div>
              <div className="mt-3 flex flex-wrap gap-1.5">{contact.tags.map((tag) => <Badge key={tag} variant={tag} />)}</div>
            </button>
          ))}
        </div>

        {contacts.length === 0 ? <EmptyState icon={<Users className="h-4 w-4" aria-hidden="true" />} title="Aucun contact trouvé" description="Affinez votre recherche ou changez de filtre." /> : null}
      </section>
    </div>
  )
}
