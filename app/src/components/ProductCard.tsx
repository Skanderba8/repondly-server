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
  const coverImage = product.images[0]
  const typeLabel = product.type === 'SERVICE' ? 'Service' : 'Produit'

  return (
    <article className={cn('nx-card group relative overflow-hidden transition-shadow hover:shadow-[var(--shadow-elevated)]', !product.isActive && 'opacity-70')}>
      {coverImage ? (
        <div className="aspect-[4/3] bg-[color:var(--bg-page)]">
          <img src={coverImage.dataUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[color:var(--bg-page)] text-[12px] font-semibold text-[color:var(--text-muted)]">
          {typeLabel}
        </div>
      )}

      <button
        type="button"
        className="nx-btn nx-btn-ghost nx-btn-icon absolute right-2 top-2 bg-white/90 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onEdit}
        aria-label="Modifier"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="nx-badge nx-badge-neutral">{typeLabel}</span>
          {product.images.length > 1 ? <span className="text-[11px] font-medium text-[color:var(--text-muted)]">{product.images.length} photos</span> : null}
        </div>

        <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[color:var(--text-primary)]">{product.name}</h2>
        <p className="mt-2 text-[20px] font-bold tabular-nums text-[color:var(--text-primary)]">{formatAmount(product.price)}</p>
        {product.type === 'PRODUCT' && deliveryFee > 0 ? (
          <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">+ {formatAmount(product.deliveryFee)} livraison</p>
        ) : null}

        <div className="mt-4 flex min-h-6 items-center gap-2">
          {product.type === 'PRODUCT' ? <span className={cn('nx-badge', stockBadge.className)}>{stockBadge.label}</span> : null}
          {product.fournisseur ? <span className="min-w-0 truncate text-[11px] text-[color:var(--text-muted)]">{product.fournisseur}</span> : null}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={product.isActive}
            className={cn('nx-toggle', product.isActive && 'is-on')}
            onClick={() => void onToggle(!product.isActive)}
            aria-label={product.isActive ? 'Désactiver' : 'Activer'}
          >
            <span className="nx-toggle-thumb" />
          </button>
        </div>
      </div>
    </article>
  )
}
