'use client'

import { PAYMENT_STATUS_LABELS } from '@/lib/order-meta'
import type { Order, PaymentStatus } from '@/types'

const paymentBadgeClassNames: Record<PaymentStatus, string> = {
  PAS_ENCORE: 'nx-badge nx-badge-danger',
  ACOMPTE: 'nx-badge nx-badge-warning',
  RECU: 'nx-badge nx-badge-success',
}

function formatRelativeDate(dateValue: string) {
  const date = new Date(dateValue)
  const diffMinutes = Math.round((date.getTime() - Date.now()) / (1000 * 60))
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}

function formatAmount(value: string) {
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
}

type OrderCardProps = {
  order: Order
  accentColor: string
  onClick: () => void
}

export function OrderCard({ order, accentColor, onClick }: OrderCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nx-card w-full cursor-pointer border-l-[3px] border-l-transparent p-4 text-left transition-shadow hover:border-l-[color:var(--order-accent)] hover:shadow-[var(--shadow-elevated)]"
      style={{ ['--order-accent' as string]: accentColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-semibold text-[color:var(--text-muted)]">#{String(order.orderNumber).padStart(4, '0')}</span>
        <span className={paymentBadgeClassNames[order.paymentStatus]}>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
      </div>
      <p className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">{order.contact.name ?? order.contact.phone ?? order.contact.initials}</p>
      <p className="mt-1 line-clamp-1 text-[12px] text-[color:var(--text-secondary)]">
        {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ')}
      </p>
      <p className="mt-2 text-[15px] font-bold text-[color:var(--text-primary)]">{formatAmount(order.totalAmount)}</p>
      <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">{formatRelativeDate(order.createdAt)}</p>
    </button>
  )
}
