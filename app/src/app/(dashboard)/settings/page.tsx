import { Badge } from '@/components/ui/Badge'
import { SignOutButton } from '@/components/SignOutButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { requireBusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SettingsPage() {
  const session = await requireBusinessSession()
  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      plan: true,
      businessType: true,
      tone: true,
    },
  })

  return (
    <div className="rp-page mx-auto max-w-3xl !gap-4">
      <section className="rp-page-header">
        <div>
          <p className="rp-section-label">Configuration</p>
          <h1 className="rp-page-title">Paramètres</h1>
        </div>
      </section>

      <section className="rp-panel space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Mon entreprise</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Ajustez les informations visibles et le ton de réponse préféré.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input defaultValue={business?.name ?? ''} placeholder="Nom de l'entreprise" />
          <Input defaultValue={business?.phone ?? ''} placeholder="Téléphone" />
          <Input defaultValue={business?.email ?? ''} placeholder="Email" type="email" className="md:col-span-2" />
          <select
            defaultValue={business?.businessType ?? 'other'}
            className="rp-field-control h-10 w-full px-3 text-sm"
          >
            <option value="clinic">Clinique</option>
            <option value="salon">Salon</option>
            <option value="ecom">E-commerce</option>
            <option value="garage">Garage</option>
            <option value="other">Autre</option>
          </select>
          <select
            defaultValue={business?.tone ?? 'friendly'}
            className="rp-field-control h-10 w-full px-3 text-sm"
          >
            <option value="formal">Formel</option>
            <option value="friendly">Amical</option>
          </select>
        </div>
        <div>
          <Button>Sauvegarder</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rp-panel space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">WhatsApp</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Connexion et identifiants de synchronisation.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[color:var(--text-primary)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--tone-success)]" />
            <span>Connecté</span>
          </div>
          <Input type="password" placeholder="Phone Number ID" />
          <Button variant="secondary">Reconnecter</Button>
        </article>

        <article className="rp-panel space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Abonnement</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Suivi d'usage et niveau de plan actuel.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={business?.plan ?? 'TRIAL'} />
            <span className="text-sm text-[color:var(--text-secondary)]">47 / 500 conversations ce mois</span>
          </div>
          <div className="h-2 overflow-hidden rounded-[4px] bg-[color:var(--surface-2)]">
            <div className="h-full w-[9.4%] rounded-[4px] bg-[color:var(--brand)]" />
          </div>
          <Button>Passer au Pro</Button>
        </article>
      </section>

      <section className="rp-panel space-y-3">
        <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Compte</h2>
        <button
          type="button"
          className="w-fit text-sm text-[color:var(--text-secondary)] transition-colors duration-200 hover:text-[color:var(--text-primary)]"
        >
          Changer le mot de passe
        </button>
        <p className="text-sm text-[color:var(--text-secondary)]">
          Session active jusqu'au {new Date(session.sessionExpiresAt).toLocaleString('fr-FR')}
        </p>
        <SignOutButton className="w-fit text-sm font-medium text-[color:var(--tone-danger)] transition-opacity duration-200 hover:opacity-80" />
      </section>
    </div>
  )
}
