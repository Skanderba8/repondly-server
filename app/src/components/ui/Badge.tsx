import type { HTMLAttributes } from 'react'
import type { ConversationStatus, Intent, Plan } from '@/types'
import { cn } from '@/lib/utils'

type BadgeVariant = string
type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'followup'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent
  status?: ConversationStatus
  variant?: BadgeVariant
  tone?: BadgeTone
  /** Render as a bare 6px status dot instead of a pill. */
  dot?: boolean
}

type BadgePalette = { bg: string; text: string; border: string; dot: string }

const toneStyles: Record<BadgeTone, BadgePalette> = {
  neutral: { bg: 'var(--color-surface-subtle)', text: 'var(--color-text-secondary)', border: 'var(--color-border)', dot: 'var(--color-text-muted)' },
  brand: { bg: 'var(--color-accent-soft)', text: 'var(--color-text-primary)', border: 'var(--color-border-strong)', dot: 'var(--color-accent)' },
  info: { bg: 'var(--color-info-soft)', text: 'var(--color-info)', border: 'var(--color-info-border)', dot: 'var(--color-info)' },
  success: { bg: 'var(--color-success-soft)', text: 'var(--color-success)', border: 'var(--color-success-border)', dot: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', border: 'var(--color-warning-border)', dot: 'var(--color-warning)' },
  danger: { bg: 'var(--color-danger-soft)', text: 'var(--color-danger)', border: 'var(--color-danger-border)', dot: 'var(--color-danger)' },
  followup: { bg: 'var(--color-follow-up-soft)', text: 'var(--color-follow-up)', border: 'var(--color-follow-up-border)', dot: 'var(--color-follow-up)' },
}

const intentStyles: Record<Intent, BadgePalette> = {
  RDV: toneStyles.info,
  PRIX: toneStyles.warning,
  COMMANDE: toneStyles.success,
  'RÉCLAMATION': toneStyles.danger,
  AUTRE: toneStyles.neutral,
}

const statusStyles: Record<ConversationStatus, BadgePalette> = {
  NEW: toneStyles.info,
  IN_PROGRESS: toneStyles.warning,
  CONFIRMED: toneStyles.success,
  FOLLOW_UP: toneStyles.followup,
  RESOLVED: toneStyles.neutral,
}

const planStyles: Record<Plan, BadgePalette> = {
  TRIAL: toneStyles.neutral,
  STARTER: toneStyles.info,
  PRO: toneStyles.success,
  AGENCY: toneStyles.warning,
}

const statusLabels: Record<ConversationStatus, string> = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  CONFIRMED: 'Confirmé',
  FOLLOW_UP: 'Relance',
  RESOLVED: 'Résolu',
}

function getLabel(intent?: Intent, status?: ConversationStatus, variant?: string) {
  if (variant) return variant
  if (intent) return intent
  if (status) return statusLabels[status]
  return ''
}

function getStyles(intent?: Intent, status?: ConversationStatus, variant?: string, tone?: BadgeTone) {
  if (tone) return toneStyles[tone]
  if (intent) return intentStyles[intent]
  if (status) return statusStyles[status]
  if (variant && variant in planStyles) return planStyles[variant as Plan]
  return toneStyles.neutral
}

export function Badge({ intent, status, variant, tone, dot, className, ...props }: BadgeProps) {
  const styles = getStyles(intent, status, variant, tone)

  if (dot) {
    return (
      <span
        className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', className)}
        style={{ backgroundColor: styles.dot }}
        aria-hidden="true"
        {...props}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex h-[18px] max-w-full items-center rounded-[var(--radius-pill)] border px-1.5',
        'text-[11px] font-semibold leading-none text-nowrap',
        className,
      )}
      style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
      {...props}
    >
      {getLabel(intent, status, variant)}
    </span>
  )
}
