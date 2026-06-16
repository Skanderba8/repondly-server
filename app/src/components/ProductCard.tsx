'use client'

import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

type ProductCardProps = {
  product: Product
  onEdit: () => void
  onToggle: (isActive: boolean) => Promise<void>
}

function formatAmount(value: string) {
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
}

function getStockBadge(stock: number | null | undefined) {
  if (stock === null || stock === undefined) {
    return { className: 'nx-badge-neutral', label: 'Non suivi' }
  }

  if (stock === 0) {
    return { className: 'nx-badge-danger', label: 'Rupture' }
  }

  if (stock <= 3) {
    return { className: 'nx-badge-warning', label: `Stock faible (${stock})` }
  }

  return { className: 'nx-badge-success', label: `En stock (${stock})` }
}

export function ProductCard({ product, onEdit, onToggle }: ProductCardProps) {
  const stockBadge = getStockBadge(product.stock)
  const deliveryFee = Number(product.deliveryFee)

  return (
    <article className={cn('nx-card group relative p-4 transition-shadow hover:shadow-[var(--shadow-elevated)]', !product.isActive && 'opacity-70')}>
      <button
        type="button"
        className="nx-btn nx-btn-ghost nx-btn-icon absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onEdit}
        aria-label="Modifier le produit"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>

      <h2 className="line-clamp-2 pr-8 text-[14px] font-semibold leading-snug text-[color:var(--text-primary)]">{product.name}</h2>
      <p className="mt-2 text-[20px] font-bold tabular-nums text-[color:var(--text-primary)]">{formatAmount(product.price)}</p>
      {deliveryFee > 0 ? (
        <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">+ {formatAmount(product.deliveryFee)} livraison</p>
      ) : null}

      <div className="mt-4 flex min-h-6 items-center gap-2">
        <span className={cn('nx-badge', stockBadge.className)}>{stockBadge.label}</span>
        {product.fournisseur ? <span className="min-w-0 truncate text-[11px] text-[color:var(--text-muted)]">{product.fournisseur}</span> : null}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          role="switch"
          aria-checked={product.isActive}
          className={cn('nx-toggle', product.isActive && 'is-on')}
          onClick={() => void onToggle(!product.isActive)}
          aria-label={product.isActive ? 'Désactiver le produit' : 'Activer le produit'}
        >
          <span className="nx-toggle-thumb" />
        </button>
      </div>
    </article>
  )
}
