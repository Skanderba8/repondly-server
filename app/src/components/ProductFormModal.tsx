'use client'

import { useEffect, useState } from 'react'
import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product, ProductImage, ProductType, ProductVariant } from '@/types'

export type ProductFormPayload = {
  type: ProductType
  name: string
  description: string
  price: string
  deliveryFee: string
  stock: string
  fournisseur: string
  variants: ProductVariant[]
  images: ProductImage[]
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
    type: product?.type ?? 'PRODUCT',
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? '0',
    deliveryFee: product?.deliveryFee ?? '0',
    stock: product?.stock === null || product?.stock === undefined ? '' : String(product.stock),
    fournisseur: product?.fournisseur ?? '',
    variants: product?.variants ?? [],
    images: product?.images ?? [],
    isActive: product?.isActive ?? true,
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('IMAGE_READ_FAILED'))
    }
    reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
    image.src = dataUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('IMAGE_COMPRESS_FAILED'))
    }, type, quality)
  })
}

async function compressImage(file: File, position: number): Promise<ProductImage> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)
  const mimeType = 'image/webp'
  const attempts = [
    { maxSide: 1280, quality: 0.82 },
    { maxSide: 1120, quality: 0.78 },
    { maxSide: 960, quality: 0.74 },
    { maxSide: 820, quality: 0.7 },
  ]
  let blob: Blob | null = null

  for (const attempt of attempts) {
    const ratio = Math.min(1, attempt.maxSide / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * ratio))
    const height = Math.max(1, Math.round(image.height * ratio))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('IMAGE_CONTEXT_FAILED')
    }

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)
    blob = await canvasToBlob(canvas, mimeType, attempt.quality)

    if (blob.size <= 700_000) {
      break
    }
  }

  if (!blob || blob.size > 700_000) {
    throw new Error('IMAGE_COMPRESS_FAILED')
  }

  const compressedDataUrl = await readFileAsDataUrl(new File([blob], 'catalog.webp', { type: mimeType }))

  return {
    dataUrl: compressedDataUrl,
    mimeType,
    sizeBytes: blob.size,
    position,
  }
}

export function ProductFormModal({ open, product, pending, onClose, onSave }: ProductFormModalProps) {
  const [draft, setDraft] = useState<ProductFormPayload>(() => createDraft(product))
  const [imagePending, setImagePending] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(createDraft(product))
    }
  }, [open, product])

  if (!open) {
    return null
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    setImagePending(true)

    try {
      const availableSlots = Math.max(0, 3 - draft.images.length)
      const selectedFiles = Array.from(files)
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, availableSlots)
      const compressedImages = await Promise.all(selectedFiles.map((file, index) => compressImage(file, draft.images.length + index)))

      setDraft((current) => ({
        ...current,
        images: [...current.images, ...compressedImages].slice(0, 3).map((image, index) => ({ ...image, position: index })),
      }))
    } finally {
      setImagePending(false)
    }
  }

  function removeImage(position: number) {
    setDraft((current) => ({
      ...current,
      images: current.images.filter((image) => image.position !== position).map((image, index) => ({ ...image, position: index })),
    }))
  }

  function updateVariant(index: number, field: keyof ProductVariant, value: string) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return variant
        }

        return field === 'name'
          ? { ...variant, name: value }
          : { ...variant, values: value.split(',').map((item) => item.trim()).filter(Boolean) }
      }),
    }))
  }

  function addVariant() {
    setDraft((current) => ({
      ...current,
      variants: [...current.variants, { name: '', values: [] }],
    }))
  }

  function removeVariant(index: number) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
  }

  return (
    <div className="nx-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nx-modal-panel w-full max-w-[560px]">
        <div className="nx-modal-header">
          <div>
            <p className="nx-section-label">{product ? 'Catalogue' : 'Nouvel élément'}</p>
            <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--text-primary)]">{product ? 'Modifier' : 'Ajouter un produit ou service'}</h2>
          </div>
          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="nx-modal-body">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['PRODUCT', 'Produit'],
              ['SERVICE', 'Service'],
            ].map(([type, label]) => (
              <button
                key={type}
                type="button"
                className={draft.type === type ? 'nx-filter-chip is-active justify-center' : 'nx-filter-chip justify-center'}
                onClick={() => setDraft({ ...draft, type: type as ProductType, stock: type === 'SERVICE' ? '' : draft.stock, deliveryFee: type === 'SERVICE' ? '0' : draft.deliveryFee })}
              >
                {label}
              </button>
            ))}
          </div>

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

          <div className={draft.type === 'PRODUCT' ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
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
            {draft.type === 'PRODUCT' ? (
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
            ) : null}
          </div>

          <div className={draft.type === 'PRODUCT' ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'}>
            {draft.type === 'PRODUCT' ? (
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
            ) : null}
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

          <div className="rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">Variantes</p>
                <p className="mt-0.5 text-[12px] text-[color:var(--text-muted)]">Tailles, couleurs, pointures ou autres options.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.variants.length > 0}
                className={cn('nx-toggle', draft.variants.length > 0 && 'is-on')}
                onClick={() => setDraft({ ...draft, variants: draft.variants.length > 0 ? [] : [{ name: 'Taille', values: [] }] })}
              >
                <span className="nx-toggle-thumb" />
              </button>
            </div>

            {draft.variants.length > 0 ? (
              <div className="mt-3 space-y-2">
                {draft.variants.map((variant, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[140px_1fr_40px]">
                    <input
                      className="nx-input"
                      value={variant.name}
                      onChange={(event) => updateVariant(index, 'name', event.target.value)}
                      placeholder="Nom, ex: Taille"
                    />
                    <input
                      className="nx-input"
                      value={variant.values.join(', ')}
                      onChange={(event) => updateVariant(index, 'values', event.target.value)}
                      placeholder="Options, ex: S, M, L"
                    />
                    <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon-md" onClick={() => removeVariant(index)} aria-label="Supprimer la variante">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button type="button" className="nx-btn nx-btn-secondary nx-btn-sm" onClick={addVariant}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Ajouter une variante
                </button>
              </div>
            ) : null}
          </div>

          <div className="nx-field">
            <div className="flex items-center justify-between gap-3">
              <label className="nx-label" htmlFor="product-images">Photos</label>
              <span className="text-[11px] font-medium text-[color:var(--text-muted)]">{draft.images.length}/3</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {draft.images.map((image) => (
                <div key={`${image.position}-${image.sizeBytes}`} className="relative aspect-square overflow-hidden rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)]">
                  <img src={image.dataUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="nx-btn nx-btn-ghost nx-btn-icon absolute right-1 top-1 bg-white/90"
                    onClick={() => removeImage(image.position)}
                    aria-label="Retirer la photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {draft.images.length < 3 ? (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-dashed border-[color:var(--border)] bg-[color:var(--bg-page)] text-[12px] font-semibold text-[color:var(--text-secondary)]">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  {imagePending ? 'Compression...' : 'Ajouter'}
                  <input
                    id="product-images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={imagePending}
                    onChange={(event) => {
                      void handleImageFiles(event.target.files)
                      event.target.value = ''
                    }}
                  />
                </label>
              ) : null}
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
            disabled={pending || imagePending || !draft.name.trim()}
            onClick={() => void onSave(draft)}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
