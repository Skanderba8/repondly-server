'use client'

import Link from 'next/link'
import type { SubscriptionState } from '@/lib/subscription'

type SubscriptionBannerProps = {
  subscription: SubscriptionState | null
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value))
}

export function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  if (!subscription || subscription.planStatus !== 'TRIALING') {
    return null
  }

  return (
    <section className="mx-4 mt-4 rounded-[var(--radius-card)] border border-[color:var(--warning-border)] bg-[color:var(--warning-soft)] p-3 md:mx-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-[13px] font-medium text-[color:var(--text-primary)]">
          Votre essai gratuit se termine le {formatDate(subscription.trialEndsAt)}. Il reste {subscription.daysUntilTrialEnds} jour(s) pour choisir un plan.
        </p>
        <Link href="/settings#plan-utilisation" className="nx-btn nx-btn-secondary h-8 w-fit text-[12px]">
          Choisir un plan
        </Link>
      </div>
    </section>
  )
}
