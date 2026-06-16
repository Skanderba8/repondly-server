'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

export type ProductFormPayload = {
  name: string
  description: string
  price: string
  deliveryFee: string
  stock: string
  fournisseur: string
  isActive: boolean
}

type ProductFormModalProps = {
  open: boolean
  product?: Product | null
  pending: boolean
  onClose: () => void
  onSave: (payload: ProductFormPayload) => Promise<void>
}

function createDraft(product?: Product | null): ProductFormPayload {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '0',
    deliveryFee: product?.deliveryFee ?? '0',
    stock: product?.stock === null || product?.stock === undefined ? '' : String(product.stock),
    fournisseur: product?.fournisseur ?? '',
    isActive: product?.isActive ?? true,
  }
}

export function ProductFormModal({ open, product, pending, onClose, onSave }: ProductFormModalProps) {
  const [draft, setDraft] = useState<ProductFormPayload>(() => createDraft(product))

  useEffect(() => {
    if (open) {
      setDraft(createDraft(product))
    }
  }, [open, product])

  if (!open) {
    return null
  }

  return (
    <div className="nx-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nx-modal-panel w-full max-w-[560px]">
        <div className="nx-modal-header">
          <div>
            <p className="nx-section-label">{product ? 'Produit' : 'Nouveau produit'}</p>
            <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--text-primary)]">{product ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
          </div>
          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="nx-modal-body">
          <div className="nx-field">
            <label className="nx-label" htmlFor="product-name">Nom</label>
            <input id="product-name" className="nx-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="product-description">Description</label>
            <textarea
              id="product-description"
              className="nx-input nx-textarea"
              rows={4}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="nx-field">
              <label className="nx-label" htmlFor="product-price">Prix (TND)</label>
              <input
                id="product-price"
                className="nx-input"
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              />
            </div>
            <div className="nx-field">
              <label className="nx-label" htmlFor="product-delivery">Frais de livraison (TND)</label>
              <input
                id="product-delivery"
                className="nx-input"
                type="number"
                min={0}
                step="0.01"
                value={draft.deliveryFee}
                onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="nx-field">
              <label className="nx-label" htmlFor="product-stock">Stock</label>
              <input
                id="product-stock"
                className="nx-input"
                type="number"
                min={0}
                value={draft.stock}
                onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
                placeholder="Optionnel"
              />
            </div>
            <div className="nx-field">
              <label className="nx-label" htmlFor="product-fournisseur">Fournisseur</label>
              <input
                id="product-fournisseur"
                className="nx-input"
                value={draft.fournisseur}
                onChange={(event) => setDraft({ ...draft, fournisseur: event.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            <span className="text-[13px] font-medium text-[color:var(--text-primary)]">Actif</span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.isActive}
              className={cn('nx-toggle', draft.isActive && 'is-on')}
              onClick={() => setDraft({ ...draft, isActive: !draft.isActive })}
            >
              <span className="nx-toggle-thumb" />
            </button>
          </div>
        </div>

        <div className="nx-modal-footer">
          <button type="button" className="nx-btn nx-btn-secondary" onClick={onClose} disabled={pending}>
            Annuler
          </button>
          <button
            type="button"
            className="nx-btn nx-btn-primary"
            disabled={pending || !draft.name.trim()}
            onClick={() => void onSave(draft)}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
