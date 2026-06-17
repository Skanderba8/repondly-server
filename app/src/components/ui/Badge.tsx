import type { HTMLAttributes } from 'react'
import type { ConversationStatus, Intent, Plan } from '@/types'
import { cn } from '@/lib/utils'

type BadgeVariant = string
type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'followup' | 'teal'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent
  status?: ConversationStatus
  variant?: BadgeVariant
  tone?: BadgeTone
  dot?: boolean
}

const statusLabels: Record<ConversationStatus, string> = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  CONFIRMED: 'Confirmé',
  FOLLOW_UP: 'Relance',
  RESOLVED: 'Résolu',
}

const statusTones: Record<ConversationStatus, Exclude<BadgeTone, 'info'>> = {
  NEW: 'brand',
  IN_PROGRESS: 'warning',
  CONFIRMED: 'success',
  FOLLOW_UP: 'followup',
  RESOLVED: 'neutral',
}

const intentTones: Partial<Record<Intent, Exclude<BadgeTone, 'info'>>> = {
  RDV: 'brand',
  PRIX: 'warning',
  COMMANDE: 'success',
  AUTRE: 'neutral',
}

const planTones: Record<Plan, Exclude<BadgeTone, 'info'>> = {
  ESSENTIEL: 'neutral',
  BUSINESS: 'brand',
  BUSINESS_PLUS: 'success',
  GROWTH: 'warning',
}

const planLabels: Record<Plan, string> = {
  ESSENTIEL: 'Essentiel',
  BUSINESS: 'Business',
  BUSINESS_PLUS: 'Business Plus',
  GROWTH: 'Growth',
}

function normalizeTone(tone?: BadgeTone) {
  if (!tone || tone === 'info') return 'brand'
  return tone
}

function getLabel(intent?: Intent, status?: ConversationStatus, variant?: string) {
  if (variant && variant in planLabels) return planLabels[variant as Plan]
  if (variant) return variant
  if (status) return statusLabels[status]
  if (intent) return intent
  return ''
}

function getTone(intent?: Intent, status?: ConversationStatus, variant?: string, tone?: BadgeTone) {
  if (tone) return normalizeTone(tone)
  if (status) return statusTones[status]
  if (intent) return intentTones[intent] ?? ((intent as string).includes('CLAMATION') ? 'danger' : 'neutral')
  if (variant && variant in planTones) return planTones[variant as Plan]
  if (variant?.toLowerCase().includes('plan')) return 'brand'
  return 'neutral'
}

export function Badge({ intent, status, variant, tone, dot, className, ...props }: BadgeProps) {
  const badgeTone = getTone(intent, status, variant, tone)

  if (dot) {
    return (
      <span
        className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', `nx-badge-${badgeTone}`, className)}
        aria-hidden="true"
        {...props}
      />
    )
  }

  return (
    <span className={cn('nx-badge', `nx-badge-${badgeTone}`, className)} {...props}>
      {getLabel(intent, status, variant)}
    </span>
  )
}
