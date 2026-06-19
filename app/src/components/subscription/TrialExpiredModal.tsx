'use client'

import { useState } from 'react'
import type { Plan } from '@prisma/client'
import { Button } from '@/components/ui/Button'
import type { SubscriptionState } from '@/lib/subscription'

type TrialExpiredModalProps = {
  subscription: SubscriptionState | null
  onPlanSelected?: (subscription: SubscriptionState) => void
}

type PlanResponse = {
  success: boolean
  error?: string
  data?: SubscriptionState
}

export function TrialExpiredModal({ subscription, onPlanSelected }: TrialExpiredModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  if (!subscription || subscription.planStatus !== 'TRIAL_EXPIRED') {
    return null
  }

  async function choosePlan(plan: Plan) {
    setSelectedPlan(plan)
    setError('')

    const response = await fetch('/api/subscription/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const result = await response.json() as PlanResponse

    setSelectedPlan(null)

    if (!result.success || !result.data) {
      setError(result.error ?? 'Impossible de choisir ce plan.')
      return
    }

    if (onPlanSelected) {
      onPlanSelected(result.data)
      return
    }

    window.location.reload()
  }

  async function deleteBusiness() {
    setDeleting(true)
    setError('')

    const response = await fetch('/api/settings/business', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'SUPPRIMER' }),
    })
    const result = await response.json() as { success: boolean, error?: string }

    setDeleting(false)

    if (!result.success) {
      setError(result.error ?? 'Impossible de supprimer le compte.')
      return
    }

    window.location.assign('/auth/signin')
  }

  return (
    <div className="nx-modal-backdrop z-[100]">
      <div className="nx-card max-h-[92dvh] w-full max-w-5xl overflow-y-auto p-5 md:p-6">
        <div className="max-w-3xl">
          <p className="nx-section-label">Abonnement</p>
          <h2 className="mt-1 text-[22px] font-bold text-[color:var(--text-primary)]">Votre essai gratuit est termine</h2>
          <p className="mt-3 text-[13px] leading-6 text-[color:var(--text-secondary)]">
            Pour continuer a utiliser l assistant IA, vos canaux connectes, la collecte des commandes et les fonctionnalites d automatisation, choisissez un plan adapte a votre business.
          </p>
          <p className="mt-3 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] p-3 text-[13px] font-medium text-[color:var(--danger)]">
            Si aucun plan n est choisi, vos donnees seront supprimees apres 15 jours.
          </p>
          <p className="mt-3 text-[12.5px] leading-6 text-[color:var(--text-secondary)]">
            Une periode d essai est disponible une seule fois par business, numero de telephone et canal connecte. Les canaux deja utilises pendant un essai ne peuvent pas etre reutilises pour creer un nouvel essai gratuit.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subscription.planCards.map((card) => (
            <article key={card.plan} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[15px] font-bold text-[color:var(--text-primary)]">{card.name}</h3>
                  <p className="mt-1 text-[12px] text-[color:var(--text-secondary)]">{card.description}</p>
                </div>
                {card.badge ? <span className="nx-badge nx-badge-success">{card.badge}</span> : null}
              </div>
              <p className="mt-4 text-[22px] font-bold text-[color:var(--text-primary)]">{card.price} DT <span className="text-[12px] font-medium text-[color:var(--text-secondary)]">/ mois</span></p>
              <ul className="mt-4 grid gap-2 text-[12.5px] text-[color:var(--text-secondary)]">
                {card.features.slice(0, 6).map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              <Button className="mt-4 w-full" onClick={() => void choosePlan(card.plan)} loading={selectedPlan === card.plan}>
                Choisir ce plan
              </Button>
            </article>
          ))}
        </div>

        {error ? <p className="mt-4 text-[13px] font-medium text-[color:var(--danger)]">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="mailto:support@repondly.com" className="nx-btn nx-btn-secondary">Contacter support</a>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer mon compte</Button>
        </div>

        {confirmDelete ? (
          <div className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] p-4">
            <p className="text-[13px] font-semibold text-[color:var(--danger)]">Cette action supprimera les donnees du business.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger" onClick={() => void deleteBusiness()} loading={deleting}>Confirmer la suppression</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Annuler</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
