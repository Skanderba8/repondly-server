import { Avatar } from '@/components/ui/Avatar'
import { ConversationCard } from '@/components/ConversationCard'
import { mockContacts, mockConversations } from '@/lib/mock'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = mockContacts.find((item) => item.id === id) ?? mockContacts[0]

  return (
    <div className="grid gap-6 px-4 py-6 md:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-[4px] border border-[var(--border)] bg-white p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="lg" />
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">{contact.name}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{contact.phone}</p>
          </div>
        </div>

        <div className="mt-4 space-y-1 text-sm text-[var(--text-secondary)]">
          <p>Première conversation : il y a 3 mois</p>
          <p>Total conversations : {contact.totalConversations}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-[2px] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              {tag}
            </span>
          ))}
          <button
            type="button"
            className="text-xs text-[var(--text-secondary)] transition-colors duration-100 hover:text-[var(--text-primary)]"
          >
            + Ajouter
          </button>
        </div>

        <div className="my-4 h-px bg-[var(--border)]" />

        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">Notes</p>
          <textarea
            defaultValue={contact.notes ?? ''}
            rows={4}
            placeholder="Ajouter une note..."
            className="w-full resize-none rounded-[4px] border border-[var(--border)] bg-white p-2 text-sm text-[var(--text-primary)] outline-none transition-colors duration-100 placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wide text-[var(--text-muted)]">Historique</h2>
        <div className="overflow-hidden rounded-[4px] border border-[var(--border)] bg-white">
          {mockConversations.slice(0, 3).map((conversation) => (
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
