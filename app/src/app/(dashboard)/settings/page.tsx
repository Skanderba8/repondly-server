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
    <div className="mx-auto max-w-[560px] px-4 py-6">
      <section className="mb-6 border-b border-[var(--border)] pb-6">
        <h1 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Mon entreprise</h1>
        <div className="space-y-3">
          <Input defaultValue={business?.name ?? ''} placeholder="Nom de l'entreprise" />
          <Input defaultValue={business?.phone ?? ''} placeholder="Téléphone" />
          <Input defaultValue={business?.email ?? ''} placeholder="Email" type="email" />
          <select
            defaultValue={business?.businessType ?? 'other'}
            className="h-8 w-full rounded-[4px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="clinic">Clinique</option>
            <option value="salon">Salon</option>
            <option value="ecom">E-commerce</option>
            <option value="garage">Garage</option>
            <option value="other">Autre</option>
          </select>
          <select
            defaultValue={business?.tone ?? 'friendly'}
            className="h-8 w-full rounded-[4px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="formal">Formel</option>
            <option value="friendly">Amical</option>
          </select>
          <Button className="mt-4">Sauvegarder</Button>
        </div>
      </section>

      <section className="mb-6 border-b border-[var(--border)] pb-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">WhatsApp</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-success)]" />
            <span className="text-sm text-[var(--text-primary)]">Connecté</span>
          </div>
          <Input type="password" placeholder="Phone Number ID" />
          <Button variant="secondary">Reconnecter</Button>
        </div>
      </section>

      <section className="mb-6 border-b border-[var(--border)] pb-6">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Abonnement</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={business?.plan ?? 'TRIAL'} />
            <span className="text-sm text-[var(--text-secondary)]">47 / 500 conversations ce mois</span>
          </div>
          <div className="h-1 w-full rounded-[4px] bg-[var(--surface-2)]">
            <div className="h-full w-[9.4%] rounded-[4px] bg-[var(--brand)]" />
          </div>
          <Button className="mt-4">Passer au Pro</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Compte</h2>
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            className="text-sm text-[var(--text-secondary)] transition-colors duration-100 hover:text-[var(--text-primary)]"
          >
            Changer le mot de passe
          </button>
          <p className="text-sm text-[var(--text-secondary)]">
            Session active jusqu&apos;au {new Date(session.sessionExpiresAt).toLocaleString('fr-FR')}
          </p>
          <SignOutButton className="text-sm text-[var(--danger)] transition-opacity duration-100 hover:opacity-80" />
        </div>
      </section>
    </div>
  )
}
