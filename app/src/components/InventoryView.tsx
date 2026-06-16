'use client'

import { startTransition, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { ProductFormModal, type ProductFormPayload } from '@/components/ProductFormModal'
import type { Product } from '@/types'

type InventoryViewProps = {
  products: Product[]
}

type ProductResponse = {
  success: boolean
  data?: Product
  error?: string
}

function buildPayload(payload: ProductFormPayload) {
  return {
    name: payload.name,
    description: payload.description,
    price: payload.price || '0',
    deliveryFee: payload.deliveryFee || '0',
    stock: payload.stock.trim() ? Number(payload.stock) : null,
    fournisseur: payload.fournisseur,
    isActive: payload.isActive,
  }
}

export function InventoryView({ products }: InventoryViewProps) {
  const [items, setItems] = useState(products)
  const [query, setQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((product) => {
      const matchesActive = activeOnly ? product.isActive : true
      const matchesQuery = normalizedQuery
        ? [product.name, product.description ?? '', product.fournisseur ?? ''].some((value) => value.toLowerCase().includes(normalizedQuery))
        : true

      return matchesActive && matchesQuery
    })
  }, [activeOnly, items, query])

  async function saveProduct(payload: ProductFormPayload) {
    setPending(true)

    try {
      const response = await fetch(selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products', {
        method: selectedProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(payload)),
      })

      if (!response.ok) {
        throw new Error('PRODUCT_SAVE_FAILED')
      }

      const result = (await response.json()) as ProductResponse
      if (!result.data) {
        throw new Error('PRODUCT_SAVE_EMPTY')
      }

      startTransition(() => {
        setItems((current) => {
          if (selectedProduct) {
            return current.map((product) => (product.id === result.data?.id ? result.data : product))
          }

          return [result.data as Product, ...current]
        })
        setModalOpen(false)
        setSelectedProduct(null)
      })
    } finally {
      setPending(false)
    }
  }

  async function toggleProduct(product: Product, isActive: boolean) {
    setItems((current) => current.map((item) => (item.id === product.id ? { ...item, isActive } : item)))

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        throw new Error('PRODUCT_TOGGLE_FAILED')
      }

      const result = (await response.json()) as ProductResponse
      if (result.data) {
        setItems((current) => current.map((item) => (item.id === result.data?.id ? result.data : item)))
      }
    } catch {
      setItems((current) => current.map((item) => (item.id === product.id ? product : item)))
    }
  }

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <div>
          <p className="nx-section-label">Catalogue</p>
          <h1 className="nx-page-title">Inventaire</h1>
          <p className="nx-page-sub">Gerez les produits, prix, frais de livraison et stocks visibles par votre equipe.</p>
        </div>
        <button
          type="button"
          className="nx-btn nx-btn-primary"
          onClick={() => {
            setSelectedProduct(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un produit
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="nx-input flex max-w-[360px] items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] outline-none"
            placeholder="Rechercher un produit"
            aria-label="Rechercher un produit"
          />
        </label>
        <button
          type="button"
          className={activeOnly ? 'nx-filter-chip is-active w-fit' : 'nx-filter-chip w-fit'}
          onClick={() => setActiveOnly((current) => !current)}
        >
          Actifs seulement
        </button>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => {
                setSelectedProduct(product)
                setModalOpen(true)
              }}
              onToggle={(isActive) => toggleProduct(product, isActive)}
            />
          ))}
        </div>
      ) : (
        <section className="nx-card p-6 text-center">
          <p className="text-[14px] font-semibold text-[color:var(--text-primary)]">Aucun produit</p>
          <p className="mt-1 text-[13px] text-[color:var(--text-secondary)]">Ajoutez votre premier produit pour construire le catalogue.</p>
        </section>
      )}

      <ProductFormModal
        open={modalOpen}
        product={selectedProduct}
        pending={pending}
        onClose={() => {
          setModalOpen(false)
          setSelectedProduct(null)
        }}
        onSave={saveProduct}
      />
    </div>
  )
}
