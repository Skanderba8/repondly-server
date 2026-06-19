'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VALUES } from '@/lib/order-meta'
import type { Order, OrderStatus, PaymentStatus } from '@/types'

type OrderDetailModalProps = {
  open: boolean
  order: Order | null
  pending: boolean
  onClose: () => void
  onSave: (payload: {
    status: OrderStatus
    paymentStatus: PaymentStatus
    deliveryMethod: string
    deliveryAddress: string
    notes: string
  }) => Promise<void>
  onCancelOrder: () => Promise<void>
}

function formatAmount(value: string) {
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
}

export function OrderDetailModal({ open, order, pending, onClose, onSave, onCancelOrder }: OrderDetailModalProps) {
  const [status, setStatus] = useState<OrderStatus>('NOUVEAU')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAS_ENCORE')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open || !order) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStatus(order.status)
      setPaymentStatus(order.paymentStatus)
      setDeliveryMethod(order.deliveryMethod ?? '')
      setDeliveryAddress(order.deliveryAddress ?? '')
      setNotes(order.notes ?? '')
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [open, order])

  if (!open || !order) {
    return null
  }

  return (
    <div className="nx-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nx-modal-panel w-full max-w-[560px]">
        <div className="nx-modal-header">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-[16px] font-semibold text-[color:var(--text-primary)]">#{String(order.orderNumber).padStart(4, '0')}</h2>
            <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} className="nx-input h-[32px] w-[180px]">
              {ORDER_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {ORDER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="nx-modal-body">
          <section className="space-y-3">
            <p className="nx-section-label">Client</p>
            <div className="flex items-center gap-3 rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
              <Avatar initials={order.contact.initials} size="md" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[color:var(--text-primary)]">{order.contact.name ?? order.contact.phone ?? order.contact.initials}</p>
                <p className="truncate text-[12px] text-[color:var(--text-secondary)]">{order.contact.phone ?? 'Non renseigne'}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="nx-section-label">Articles</p>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border)]">
              <div className="nx-table-head" style={{ gridTemplateColumns: '1.6fr 0.5fr 0.8fr 0.8fr' }}>
                <span>Article</span>
                <span>Qty</span>
                <span>Unite</span>
                <span>Total</span>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="nx-table-row" style={{ gridTemplateColumns: '1.6fr 0.5fr 0.8fr 0.8fr' }}>
                  <span className="nx-table-cell">{item.productName}</span>
                  <span className="nx-table-cell">{item.quantity}</span>
                  <span className="nx-table-cell">{formatAmount(item.unitPrice)}</span>
                  <span className="nx-table-cell">{formatAmount(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <span className="text-[14px] font-semibold text-[color:var(--text-primary)]">Total: {formatAmount(order.totalAmount)}</span>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="nx-field">
              <label className="nx-label" htmlFor="detail-delivery-method">Livraison</label>
              <select
                id="detail-delivery-method"
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value)}
                className="nx-input"
              >
                <option value="">Choisir</option>
                <option value="livraison">Livraison</option>
                <option value="retrait">Retrait</option>
                <option value="sur_place">Sur place</option>
              </select>
            </div>
            <div className="nx-field">
              <label className="nx-label" htmlFor="detail-delivery-address">Adresse</label>
              <input
                id="detail-delivery-address"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                className="nx-input"
                placeholder="Adresse de livraison"
              />
            </div>
          </section>

          <section className="space-y-3">
            <p className="nx-section-label">Paiement</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUS_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentStatus(value)}
                  className={paymentStatus === value ? 'nx-filter-chip is-active' : 'nx-filter-chip'}
                >
                  {PAYMENT_STATUS_LABELS[value]}
                </button>
              ))}
            </div>
          </section>

          <section className="nx-field">
            <label className="nx-label" htmlFor="detail-notes">Notes</label>
            <textarea
              id="detail-notes"
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="nx-input nx-textarea"
              placeholder="Ajouter un contexte utile pour l'equipe"
            />
          </section>
        </div>

        <div className="nx-modal-footer">
          <button
            type="button"
            className="nx-btn nx-btn-danger nx-btn-sm"
            onClick={() => void onCancelOrder()}
            disabled={pending || order.status === 'ANNULE'}
          >
            Annuler la commande
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="nx-btn nx-btn-secondary" onClick={onClose} disabled={pending}>
              Fermer
            </button>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              onClick={() => void onSave({ status, paymentStatus, deliveryMethod, deliveryAddress, notes })}
              disabled={pending}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
