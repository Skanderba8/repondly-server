import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ConversationCard } from '@/components/ConversationCard'
import { mockContacts, mockConversations } from '@/lib/mock'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contact = mockContacts.find((item) => item.id === id) ?? mockContacts[0]
  const relatedConversations = mockConversations.filter((conversation) => conversation.contact.id === contact.id)

  return (
    <div className="rp-page">
      <Link href="/contacts" className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-[color:var(--color-text-secondary)] transition-colors duration-[var(--ease-fast)] hover:text-[color:var(--color-text-primary)]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Contacts
      </Link>

      <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rp-panel p-4 md:p-5">
          <div className="flex items-center gap-3">
            <Avatar initials={contact.initials} size="xl" />
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold leading-[1.1] text-[color:var(--color-text-primary)]">{contact.name}</h1>
              <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">{contact.phone}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[color:var(--color-border)] pt-4">
            <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] p-3">
              <p className="rp-micro-label">Conversations</p>
              <p className="mt-2 text-[20px] font-semibold leading-none text-[color:var(--color-text-primary)]">{contact.totalConversations}</p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] p-3">
              <p className="rp-micro-label">Dernière act.</p>
              <p className="mt-2 text-[13px] font-medium text-[color:var(--color-text-primary)]">{contact.lastSeen}</p>
            </div>
          </div>

          <div className="rp-contact-section">
            <p className="rp-micro-label">Tags</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{contact.tags.map((tag) => <Badge key={tag} variant={tag} />)}</div>
          </div>

          <div className="rp-contact-section">
            <p className="rp-micro-label">Notes</p>
            <textarea defaultValue={contact.notes ?? ''} rows={5} placeholder="Ajouter une note..." className="rp-field-control mt-3 w-full resize-none bg-[color:var(--color-surface-subtle)] p-3 text-[13px] leading-[1.5] text-[color:var(--color-text-secondary)]" aria-label="Notes sur le contact" />
          </div>
        </section>

        <section className="rp-table-shell">
          <div className="rp-panel-header">
            <div>
              <p className="rp-section-label">Historique</p>
              <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--color-text-primary)]">Conversations associées</h2>
            </div>
          </div>
          <div>{(relatedConversations.length ? relatedConversations : mockConversations.slice(0, 3)).map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} isSelected={false} onClick={() => undefined} />)}</div>
        </section>
      </div>
    </div>
  )
}
