'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_VALUES } from '@/lib/order-meta'
import type { ContactSearchResult, PaymentStatus } from '@/types'

type DraftItem = {
  id: string
  productName: string
  quantity: number
  unitPrice: string
}

type CreateOrderModalProps = {
  open: boolean
  pending: boolean
  onClose: () => void
  onCreate: (payload: {
    contactId: string
    deliveryMethod: string
    deliveryAddress: string
    notes: string
    paymentStatus: PaymentStatus
    items: Array<{ productName: string; quantity: number; unitPrice: number }>
  }) => Promise<void>
}

function createDraftItem(index: number): DraftItem {
  return {
    id: `draft-${index}-${Date.now()}`,
    productName: '',
    quantity: 1,
    unitPrice: '0',
  }
}

function formatAmount(value: number) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
}

export function CreateOrderModal({ open, pending, onClose, onCreate }: CreateOrderModalProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [results, setResults] = useState<ContactSearchResult[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null)
  const [items, setItems] = useState<DraftItem[]>([createDraftItem(0)])
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAS_ENCORE')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    if (!deferredQuery.trim() || selectedContact) {
      setResults([])
      return
    }

    const controller = new AbortController()
    void fetch(`/api/contacts?search=${encodeURIComponent(deferredQuery.trim())}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return []
        }

        const payload = (await response.json()) as { success: boolean; data?: ContactSearchResult[] }
        return payload.data ?? []
      })
      .then((data) => {
        setResults(data)
      })
      .catch(() => {
        setResults([])
      })

    return () => controller.abort()
  }, [deferredQuery, open, selectedContact])

  useEffect(() => {
    if (open) {
      return
    }

    setQuery('')
    setResults([])
    setSelectedContact(null)
    setItems([createDraftItem(0)])
    setDeliveryMethod('')
    setDeliveryAddress('')
    setPaymentStatus('PAS_ENCORE')
    setNotes('')
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="nx-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nx-modal-panel w-full max-w-[720px]">
        <div className="nx-modal-header">
          <div>
            <p className="nx-section-label">Nouvelle commande</p>
            <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--text-primary)]">Creer une commande</h2>
          </div>
          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="nx-modal-body">
          <section className="space-y-3">
            <p className="nx-section-label">Client</p>
            <div className="relative">
              <label className="flex items-center gap-2 rounded-[var(--radius-input)] border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3">
                <Search className="h-4 w-4 text-[color:var(--text-muted)]" aria-hidden="true" />
                <input
                  value={selectedContact ? (selectedContact.name ?? selectedContact.phone ?? selectedContact.initials) : query}
                  onChange={(event) => {
                    setSelectedContact(null)
                    setQuery(event.target.value)
                  }}
                  className="nx-input border-0 bg-transparent px-0"
                  placeholder="Rechercher un contact"
                  aria-label="Rechercher un contact"
                />
              </label>
              {!selectedContact && results.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-card)] shadow-[var(--shadow-dropdown)]">
                  {results.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-page)]"
                      onClick={() => {
                        setSelectedContact(contact)
                        setQuery(contact.name ?? contact.phone ?? contact.initials)
                        setResults([])
                      }}
                    >
                      <span>{contact.name ?? contact.phone ?? contact.initials}</span>
                      <span className="text-[11px] text-[color:var(--text-muted)]">{contact.phone ?? ''}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="nx-section-label">Articles</p>
              <button
                type="button"
                className="nx-btn nx-btn-ghost"
                onClick={() => setItems((current) => [...current, createDraftItem(current.length)])}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter un article
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const total = Math.max(item.quantity, 0) * Number(item.unitPrice || 0)

                return (
                  <div key={item.id} className="grid gap-2 rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3 md:grid-cols-[minmax(0,2fr)_96px_120px_120px_40px]">
                    <input
                      value={item.productName}
                      onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, productName: event.target.value } : row))}
                      className="nx-input"
                      placeholder="Produit"
                    />
                    <input
                      value={item.quantity}
                      onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, quantity: Number(event.target.value || 0) } : row))}
                      className="nx-input"
                      type="number"
                      min={1}
                      placeholder="Qty"
                    />
                    <input
                      value={item.unitPrice}
                      onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, unitPrice: event.target.value } : row))}
                      className="nx-input"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Prix unitaire"
                    />
                    <div className="flex h-[36px] items-center rounded-[var(--radius-input)] border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3 text-[13px] font-medium text-[color:var(--text-primary)]">
                      {formatAmount(total)}
                    </div>
                    <button
                      type="button"
                      className="nx-btn nx-btn-ghost nx-btn-icon"
                      onClick={() => setItems((current) => current.length > 1 ? current.filter((row) => row.id !== item.id) : current)}
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="nx-field">
              <label className="nx-label" htmlFor="create-delivery-method">Livraison</label>
              <select
                id="create-delivery-method"
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
            {deliveryMethod === 'livraison' ? (
              <div className="nx-field">
                <label className="nx-label" htmlFor="create-delivery-address">Adresse</label>
                <input
                  id="create-delivery-address"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  className="nx-input"
                  placeholder="Adresse de livraison"
                />
              </div>
            ) : null}
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
            <label className="nx-label" htmlFor="create-notes">Notes</label>
            <textarea
              id="create-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="nx-input nx-textarea"
              placeholder="Notes internes"
            />
          </section>
        </div>

        <div className="nx-modal-footer">
          <button type="button" className="nx-btn nx-btn-secondary" onClick={onClose} disabled={pending}>
            Fermer
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-primary"
            disabled={pending || !selectedContact}
            onClick={() =>
              void onCreate({
                contactId: selectedContact?.id ?? '',
                deliveryMethod,
                deliveryAddress,
                notes,
                paymentStatus,
                items: items.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice || 0),
                })),
              })
            }
          >
            Creer la commande
          </button>
        </div>
      </div>
    </div>
  )
}
