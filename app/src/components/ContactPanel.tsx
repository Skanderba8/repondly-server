import type { Contact } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ContactPanelProps {
  contact: Contact
}

export function ContactPanel({ contact }: ContactPanelProps) {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-l border-[color:var(--surface-border)] bg-[color:var(--surface-0)] xl:flex">
      <div className="border-b border-[color:var(--surface-border)] px-5 py-5">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">
              {contact.name ?? 'Contact'}
            </p>
            <p className="truncate text-[13px] text-[color:var(--text-secondary)]">
              {contact.phone ?? 'Aucun numéro'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="rp-panel-muted space-y-3 p-4">
          <p className="rp-section-label">Statistiques</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                Conversations
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">
                {contact.totalConversations}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                Dernière activité
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">
                {contact.lastSeen ?? 'N/A'}
              </p>
            </div>
          </div>
        </section>

        <section className="rp-panel-muted space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="rp-section-label">Tags</p>
            <Button variant="ghost" size="sm">
              Ajouter
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant={tag} />
            ))}
          </div>
        </section>

        <section className="rp-panel-muted space-y-3 p-4">
          <p className="rp-section-label">Notes</p>
          <textarea
            defaultValue={contact.notes ?? ''}
            placeholder="Ajouter une note..."
            className="rp-field-control min-h-[140px] w-full resize-none px-3 py-2.5 text-sm leading-6"
          />
        </section>

        <section className="rp-panel-muted p-4">
          <label className="flex items-center justify-between gap-3 text-sm text-[color:var(--text-primary)]">
            <span className="font-medium">Relance automatique</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded-[4px] border-[color:var(--surface-border-strong)] bg-[color:var(--surface-0)] text-[color:var(--brand)] accent-[color:var(--brand)]"
            />
          </label>
        </section>
      </div>
    </aside>
  )
}
