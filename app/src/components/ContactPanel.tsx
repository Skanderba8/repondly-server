import type { Contact } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface ContactPanelProps {
  contact: Contact
}

export function ContactPanel({ contact }: ContactPanelProps) {
  return (
    <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-[var(--border)] bg-white p-4">
      <section className="border-b border-[var(--border)] py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">{contact.name ?? 'Contact'}</p>
            <p className="truncate text-sm text-[var(--text-secondary)]">{contact.phone ?? 'Aucun numéro'}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Statistiques</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Conversations</span>
            <span className="font-medium text-[var(--text-primary)]">{contact.totalConversations}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Dernière activité</span>
            <span className="font-medium text-[var(--text-primary)]">{contact.lastSeen ?? 'N/A'}</span>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Tags</p>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
            <Button variant="ghost" size="sm">
              + Ajouter
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Notes</p>
          <textarea
            defaultValue={contact.notes ?? ''}
            placeholder="Ajouter une note..."
            className="min-h-[96px] w-full resize-none rounded border border-[var(--border)] bg-white p-2 text-sm text-[var(--text-primary)] outline-none transition-colors duration-100 placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
          />
        </div>
      </section>

      <section className="py-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-[var(--text-primary)]">Relance automatique</span>
          <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)] focus-visible:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]" />
        </label>
      </section>
    </aside>
  )
}
