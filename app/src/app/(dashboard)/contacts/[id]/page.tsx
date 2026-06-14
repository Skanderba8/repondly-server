import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ConversationCard } from '@/components/ConversationCard'
import { mockContacts, mockConversations } from '@/lib/mock'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = mockContacts.find((item) => item.id === id) ?? mockContacts[0]
  const relatedConversations = mockConversations.filter((conversation) => conversation.contact.id === contact.id)

  return (
    <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rp-panel p-4 md:p-5">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="lg" className="h-10 w-10 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)]" />
          <div>
            <h1 className="text-[18px] font-semibold leading-[1.1] text-[color:var(--text-primary)]">{contact.name}</h1>
            <p className="mt-1 text-[13px] text-[color:var(--text-secondary)]">{contact.phone}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[color:var(--surface-border)] pt-4">
          <div>
            <p className="rp-micro-label">Conversations</p>
            <p className="mt-2 text-[20px] font-semibold text-[color:var(--text-primary)]">{contact.totalConversations}</p>
          </div>
          <div>
            <p className="rp-micro-label">Dernière activité</p>
            <p className="mt-2 text-[13px] text-[color:var(--text-secondary)]">{contact.lastSeen}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-[color:var(--surface-border)] pt-4">
          <p className="rp-micro-label">Tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant={tag} />
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-[color:var(--surface-border)] pt-4">
          <p className="rp-micro-label">Notes</p>
          <textarea
            defaultValue={contact.notes ?? ''}
            rows={5}
            placeholder="Ajouter une note..."
            className="mt-3 w-full resize-none rounded-[var(--radius-sm)] border-none bg-[color:var(--surface-1)] p-3 text-[13px] text-[color:var(--text-secondary)] outline-none"
          />
        </div>
      </section>

      <section className="rp-table-shell">
        <div className="border-b border-[color:var(--surface-border)] px-4 py-3 md:px-5">
          <p className="rp-section-label">Historique</p>
          <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--text-primary)]">Conversations associées</h2>
        </div>
        <div>
          {(relatedConversations.length ? relatedConversations : mockConversations.slice(0, 3)).map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={false}
              onClick={() => undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
