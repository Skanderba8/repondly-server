'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, Plus, Search, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { Contact } from '@/types'

type ContactFilter = 'ALL' | 'VIP' | 'ACTIVE'
type SortMode = 'recent' | 'name'

const filters: Array<{ id: ContactFilter; label: string }> = [
  { id: 'ALL', label: 'Tous' },
  { id: 'VIP', label: 'VIP' },
  { id: 'ACTIVE', label: 'Actifs' },
]

const columns = '2fr 1.35fr 1.5fr 0.7fr 1.1fr'

type ContactsViewProps = {
  contacts: Contact[]
}

export function ContactsView({ contacts }: ContactsViewProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('ALL')
  const [sortMode, setSortMode] = useState<SortMode>('recent')

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const visible = contacts.filter((contact) => {
      const matchesQuery =
        !normalizedQuery ||
        [contact.name, contact.phone, contact.tags.join(' '), contact.lastSeen]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      if (!matchesQuery) return false
      if (activeFilter === 'VIP') return contact.tags.some((tag) => tag.toLowerCase() === 'vip')
      if (activeFilter === 'ACTIVE') return contact.totalConversations >= 2
      return true
    })

    return visible.sort((left, right) =>
      sortMode === 'name'
        ? (left.name ?? '').localeCompare(right.name ?? '', 'fr-FR')
        : right.totalConversations - left.totalConversations,
    )
  }, [activeFilter, contacts, query, sortMode])

  const counts = useMemo(
    () => ({
      ALL: contacts.length,
      VIP: contacts.filter((contact) => contact.tags.some((tag) => tag.toLowerCase() === 'vip')).length,
      ACTIVE: contacts.filter((contact) => contact.totalConversations >= 2).length,
    }),
    [contacts],
  )

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <div>
          <p className="nx-section-label">Base client</p>
          <h1 className="nx-page-title">Contacts</h1>
          <p className="nx-page-sub">Tous vos contacts avec un historique lisible, des tags et des signaux utiles pour l&apos;equipe.</p>
        </div>
        <button type="button" className="nx-btn nx-btn-secondary">
          <Plus size={16} aria-hidden="true" />
          Nouveau contact
        </button>
      </header>

      <section className="nx-card">
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div className="nx-no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={activeFilter === filter.id ? 'nx-filter-chip is-active' : 'nx-filter-chip'}
                >
                  <span>{filter.label}</span>
                  <span>{counts[filter.id]}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: '1 1 360px', justifyContent: 'flex-end' }}>
              <label className="nx-input" style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 320 }}>
                <Search size={16} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un contact"
                  aria-label="Rechercher un contact"
                  style={{ border: 0, background: 'transparent', width: '100%' }}
                />
              </label>

              <label className="nx-input" style={{ display: 'flex', alignItems: 'center', gap: 8, width: 180 }}>
                <ArrowUpDown size={16} aria-hidden="true" />
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="nx-select"
                  aria-label="Trier les contacts"
                  style={{ border: 0, background: 'transparent', width: '100%' }}
                >
                  <option value="recent">Activite</option>
                  <option value="name">Nom</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {filteredContacts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <div className="nx-table-head" style={{ gridTemplateColumns: columns }}>
              <span>Nom</span>
              <span>Telephone</span>
              <span>Tags</span>
              <span>Messages</span>
              <span>Derniere act.</span>
            </div>
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => router.push(`/contacts/${contact.id}`)}
                className="nx-table-row"
                style={{ gridTemplateColumns: columns, width: '100%', textAlign: 'left' }}
              >
                <div className="nx-table-cell" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={contact.initials} size="sm" />
                  <span>{contact.name ?? contact.phone ?? contact.initials}</span>
                </div>
                <span className="nx-table-cell">{contact.phone ?? 'Non renseigne'}</span>
                <div className="nx-table-cell" style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>
                  {contact.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant={tag} />
                  ))}
                </div>
                <span className="nx-table-cell">{contact.totalConversations}</span>
                <span className="nx-table-cell">{contact.lastSeen || 'Aucune activite'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="nx-empty">
            <div className="nx-empty-icon">
              <Users size={16} aria-hidden="true" />
            </div>
            <p className="nx-card-title">Aucun contact trouve</p>
            <p className="nx-page-sub">Affinez votre recherche ou changez de filtre.</p>
          </div>
        )}
      </section>
    </div>
  )
}
