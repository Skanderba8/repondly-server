import type { Contact } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface ContactPanelProps {
  contact: Contact
}

export function ContactPanel({ contact }: ContactPanelProps) {
  return (
    <aside className="hidden h-full w-[280px] shrink-0 flex-col border-l border-[color:var(--surface-border)] bg-[color:var(--surface-0)] lg:flex">
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar initials={contact.initials} size="lg" className="h-10 w-10 rounded-full bg-[color:var(--brand-primary)] text-[color:var(--text-on-brand)]" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-[1.1] text-[color:var(--text-primary)]">
              {contact.name ?? 'Contact'}
            </p>
            <p className="truncate text-[13px] leading-[1.5] text-[color:var(--text-secondary)]">
              {contact.phone ?? 'Aucun numéro'}
            </p>
          </div>
        </div>

        <section className="rp-contact-section">
          <p className="rp-micro-label">Statistiques</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[color:var(--text-muted)]">Conversations</p>
              <p className="mt-1 text-[20px] font-semibold leading-[1.1] text-[color:var(--text-primary)]">{contact.totalConversations}</p>
            </div>
            <div>
              <p className="text-[11px] text-[color:var(--text-muted)]">Dernière activité</p>
              <p className="mt-1 text-[13px] font-medium leading-[1.5] text-[color:var(--text-primary)]">{contact.lastSeen ?? 'N/A'}</p>
            </div>
          </div>
        </section>

        <section className="rp-contact-section">
          <div className="flex items-center justify-between gap-3">
            <p className="rp-micro-label">Tags</p>
            <button type="button" className="text-[12px] font-medium text-[color:var(--brand-primary)] transition-[color] duration-[var(--transition-fast)] hover:text-[color:var(--brand-primary-hover)]">
              Ajouter
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant={tag} />
            ))}
          </div>
        </section>

        <section className="rp-contact-section">
          <p className="rp-micro-label">Notes</p>
          <textarea
            defaultValue={contact.notes ?? ''}
            placeholder="Ajouter une note..."
            className="mt-3 min-h-20 w-full resize-none rounded-[var(--radius-sm)] border-none bg-[color:var(--surface-1)] px-3 py-2.5 text-[13px] leading-[1.5] text-[color:var(--text-secondary)] outline-none transition-[box-shadow] duration-[var(--transition-fast)] focus-visible:shadow-[var(--shadow-focus)]"
          />
        </section>

        <section className="rp-contact-section">
          <label className="flex items-center justify-between gap-3 text-[13px] text-[color:var(--text-primary)]">
            <span className="font-medium">Relance automatique</span>
            <span className="relative inline-flex h-[18px] w-8 rounded-[var(--radius-pill)] bg-[color:var(--brand-primary)] transition-[background-color] duration-[var(--transition-base)]">
              <span className="absolute right-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-[color:var(--surface-0)]" />
            </span>
          </label>
        </section>
      </div>
    </aside>
  )
}
