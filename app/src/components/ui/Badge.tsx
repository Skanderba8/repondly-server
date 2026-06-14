import type { HTMLAttributes } from 'react'
import type { ConversationStatus, Intent, Plan } from '@/types'
import { cn } from '@/lib/utils'

type BadgeVariant = string
type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent
  status?: ConversationStatus
  variant?: BadgeVariant
  tone?: BadgeTone
}

type BadgePalette = {
  bg: string
  text: string
  border: string
}

const toneStyles: Record<BadgeTone, BadgePalette> = {
  neutral: {
    bg: 'var(--surface-2)',
    text: 'var(--text-secondary)',
    border: 'var(--surface-border)',
  },
  brand: {
    bg: 'var(--tone-info-soft)',
    text: 'var(--tone-info)',
    border: 'var(--tone-info-border)',
  },
  success: {
    bg: 'var(--tone-success-soft)',
    text: 'var(--tone-success)',
    border: 'var(--tone-success-border)',
  },
  warning: {
    bg: 'var(--tone-warning-soft)',
    text: 'var(--tone-warning)',
    border: 'var(--tone-warning-border)',
  },
  danger: {
    bg: 'var(--tone-danger-soft)',
    text: 'var(--tone-danger)',
    border: 'var(--tone-danger-border)',
  },
}

const intentStyles: Record<Intent, BadgePalette> = {
  RDV: toneStyles.brand,
  PRIX: toneStyles.warning,
  COMMANDE: toneStyles.success,
  'RÉCLAMATION': toneStyles.danger,
  AUTRE: toneStyles.neutral,
}

const statusStyles: Record<ConversationStatus, BadgePalette> = {
  NEW: toneStyles.brand,
  IN_PROGRESS: toneStyles.warning,
  CONFIRMED: toneStyles.success,
  FOLLOW_UP: {
    bg: 'var(--tone-followup-soft)',
    text: 'var(--tone-followup)',
    border: 'var(--tone-followup-border)',
  },
  RESOLVED: toneStyles.neutral,
}

const planStyles: Record<Plan, BadgePalette> = {
  TRIAL: toneStyles.neutral,
  STARTER: toneStyles.brand,
  PRO: toneStyles.success,
  AGENCY: toneStyles.warning,
}

function getLabel(intent?: Intent, status?: ConversationStatus, variant?: string) {
  if (variant) return variant
  if (intent) return intent
  if (status) return status
  return ''
}

function getStyles(intent?: Intent, status?: ConversationStatus, variant?: string, tone?: BadgeTone) {
  if (tone) return toneStyles[tone]
  if (intent) return intentStyles[intent]
  if (status) return statusStyles[status]
  if (variant && variant in planStyles) {
    return planStyles[variant as Plan]
  }
  return toneStyles.neutral
}

export function Badge({ intent, status, variant, tone, className, ...props }: BadgeProps) {
  const styles = getStyles(intent, status, variant, tone)

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-[4px] border px-2 text-[11px] font-medium uppercase tracking-[0.08em]',
        className,
      )}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: styles.border,
      }}
      {...props}
    >
      {getLabel(intent, status, variant)}
    </span>
  )
}
