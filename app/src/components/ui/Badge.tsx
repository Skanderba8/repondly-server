import type { HTMLAttributes } from 'react'
import type { ConversationStatus, Intent } from '@/types'
import { cn } from '@/lib/utils'

type BadgeVariant = string

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: Intent
  status?: ConversationStatus
  variant?: BadgeVariant
}

const intentStyles: Record<Intent, { bg: string; text: string }> = {
  RDV: { bg: '#DBEAFE', text: '#1D4ED8' },
  PRIX: { bg: '#FEF3C7', text: '#92400E' },
  COMMANDE: { bg: '#DCFCE7', text: '#166534' },
  'RÉCLAMATION': { bg: '#FEE2E2', text: '#991B1B' },
  AUTRE: { bg: 'var(--surface-2)', text: 'var(--text-secondary)' },
}

const statusStyles: Record<ConversationStatus, { bg: string; text: string }> = {
  NEW: { bg: '#DBEAFE', text: '#1D4ED8' },
  IN_PROGRESS: { bg: '#FEF3C7', text: '#92400E' },
  CONFIRMED: { bg: '#DCFCE7', text: '#166534' },
  FOLLOW_UP: { bg: '#F3E8FF', text: '#7E22CE' },
  RESOLVED: { bg: 'var(--surface-2)', text: 'var(--text-muted)' },
}

function getLabel(intent?: Intent, status?: ConversationStatus, variant?: string) {
  if (variant) return variant
  if (intent) return intent
  if (status) return status
  return ''
}

function getStyles(intent?: Intent, status?: ConversationStatus, variant?: string) {
  if (intent) return intentStyles[intent]
  if (status) return statusStyles[status]
  if (variant) return { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
  return { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
}

export function Badge({ intent, status, variant, className, ...props }: BadgeProps) {
  const styles = getStyles(intent, status, variant)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] px-1.5 py-0.5 text-xs font-medium uppercase leading-none',
        className,
      )}
      style={{ backgroundColor: styles.bg, color: styles.text }}
      {...props}
    >
      {getLabel(intent, status, variant)}
    </span>
  )
}
