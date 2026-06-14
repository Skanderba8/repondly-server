import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { SignOutButton } from '@/components/SignOutButton'
import { requireBusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SettingsPage() {
  const session = await requireBusinessSession()
  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, plan: true, businessType: true, tone: true },
  })

  return (
    <div className="rp-page max-w-3xl">
      <PageHeader eyebrow="Configuration" title="Paramètres" description="Gardez les informations de l'entreprise, la connexion WhatsApp et l'abonnement sous contrôle." />

      <section className="rp-panel p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Mon entreprise</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Informations visibles et ton de réponse préféré.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="rp-field-label">Nom de l'entreprise<Input defaultValue={business?.name ?? ''} placeholder="Nom de l'entreprise" /></label>
          <label className="rp-field-label">Téléphone<Input defaultValue={business?.phone ?? ''} placeholder="Téléphone" /></label>
          <label className="rp-field-label md:col-span-2">Email<Input defaultValue={business?.email ?? ''} placeholder="Email" type="email" /></label>
          <label className="rp-field-label">Type d'activité<select defaultValue={business?.businessType ?? 'other'} className="rp-field-control h-9 w-full px-3 text-[13.5px]"><option value="clinic">Clinique</option><option value="salon">Salon</option><option value="ecom">E-commerce</option><option value="garage">Garage</option><option value="other">Autre</option></select></label>
          <label className="rp-field-label">Ton<select defaultValue={business?.tone ?? 'friendly'} className="rp-field-control h-9 w-full px-3 text-[13.5px]"><option value="formal">Formel</option><option value="friendly">Amical</option></select></label>
        </div>
        <div className="mt-4"><Button>Sauvegarder</Button></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rp-panel p-4 md:p-5">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">WhatsApp</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Connexion et identifiants de synchronisation.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]"><span className="h-2 w-2 rounded-full bg-[color:var(--tone-success)]" />Connecté</div>
          <div className="mt-4"><label className="rp-field-label">Phone Number ID<Input type="password" placeholder="Phone Number ID" /></label></div>
          <div className="mt-4"><Button variant="secondary">Reconnecter</Button></div>
        </article>

        <article className="rp-panel p-4 md:p-5">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Abonnement</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Usage et niveau de plan actuel.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><Badge variant={business?.plan ?? 'TRIAL'} /><span className="text-sm text-[color:var(--text-secondary)]">47 / 500 conversations ce mois</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-[var(--radius-sm)] bg-[color:var(--surface-2)]"><div className="h-full w-[9.4%] rounded-[var(--radius-sm)] bg-[color:var(--brand-primary)]" /></div>
          <div className="mt-4"><Button>Passer au Pro</Button></div>
        </article>
      </section>

      <section className="rp-panel p-4 md:p-5">
        <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Compte</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button type="button" className="text-sm font-medium text-[color:var(--text-secondary)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--text-primary)]">Changer le mot de passe</button>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Session active jusqu'au {new Date(session.sessionExpiresAt).toLocaleString('fr-FR')}</p>
          </div>
          <SignOutButton className="inline-flex h-9 w-fit items-center rounded-[var(--radius-sm)] border border-[color:var(--tone-danger-border)] bg-[color:var(--tone-danger-soft)] px-3 text-[13px] font-semibold text-[color:var(--tone-danger)] transition-opacity duration-[var(--transition-fast)] hover:opacity-80" />
        </div>
      </section>
    </div>
  )
}
