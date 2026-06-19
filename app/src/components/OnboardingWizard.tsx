'use client'

import { useMemo, useState } from 'react'
import { Bot, Camera, Check, ChevronLeft, ChevronRight, ImagePlus, MessageCircle, Plus, Store, Trash2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusinessImage, Plan, ProductImage, ProductType, ProductVariant } from '@/types'

type OnboardingWizardProps = {
  initialBusiness: {
    name: string
    email: string
    businessType: string
    tone: string
    plan: Plan
  }
}

type ProductDraft = {
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

type ChannelKey = 'WHATSAPP' | 'MESSENGER' | 'INSTAGRAM'

type ChannelDraft = {
  channel: ChannelKey
  label: string
  selected: boolean
}

type BotDraft = {
  botEnabled: boolean
  botName: string
  botMode: string
  botWorkingHoursStart: string
  botWorkingHoursEnd: string
  botHandoffKeywords: string
  availability: 'always' | 'scheduled'
  deliveryEnabled: boolean
  deliveryDelay: string
  boutiqueAddress: string
  paymentMethods: {
    cashDelivery: boolean
    onSite: boolean
    card: boolean
  }
  orderCaptureEnabled: boolean
  notes: string
}

type SaveResponse = {
  success: boolean
  error?: string
}

const steps = [
  'Plan',
  'Entreprise',
  'Images',
  'Catalogue',
  'Bot',
  'Canaux',
  'Validation',
] as const

const plans: Array<{
  key: Plan
  name: string
  label: string
  price: string
  bestFor: string
  features: string[]
}> = [
  {
    key: 'ESSENTIEL',
    name: 'Essentiel',
    label: 'Pour commencer',
    price: '29 TND/mois',
    bestFor: 'Petites entreprises avec un canal',
    features: ['1 canal connecte', 'Assistant IA 24/7', 'Base de connaissances simple', '1 utilisateur'],
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    label: 'Le plus accessible',
    price: '69 TND/mois',
    bestFor: 'Deux canaux principaux',
    features: ['2 canaux connectes', 'Collecte commandes a confirmer', 'Inbox centralisee', '2 utilisateurs'],
  },
  {
    key: 'BUSINESS_PLUS',
    name: 'Business Plus',
    label: 'Le plus populaire',
    price: '99 TND/mois',
    bestFor: 'WhatsApp, Messenger et Instagram',
    features: ['3 canaux connectes', 'Gestion commandes', 'Relances clients', 'Statistiques simples'],
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    label: 'Pour les equipes',
    price: '149 TND/mois',
    bestFor: 'Volume eleve et petites equipes',
    features: ['5 canaux connectes', 'Gestion equipe', 'Relances avancees', 'Support prioritaire'],
  },
]

const activityOptions = [
  { value: 'clothing', label: 'Vetements' },
  { value: 'food', label: 'Restaurant ou food business' },
  { value: 'beauty', label: 'Beaute et cosmetiques' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Services professionnels' },
  { value: 'home_services', label: 'Services a domicile' },
  { value: 'education', label: 'Formation' },
  { value: 'health', label: 'Sante et bien-etre' },
  { value: 'other', label: 'Autre activite' },
]

const imageCategories = [
  { key: 'logo', label: 'Logo' },
  { key: 'storefront', label: 'Boutique' },
  { key: 'menu', label: 'Menu ou tarifs' },
  { key: 'catalog', label: 'Catalogue' },
  { key: 'reference', label: 'Reference' },
]

const channelOptions: Array<{ channel: ChannelKey; title: string; description: string }> = [
  { channel: 'WHATSAPP', title: 'WhatsApp', description: 'Placeholder pour connecter le numero WhatsApp Business plus tard.' },
  { channel: 'MESSENGER', title: 'Facebook Messenger', description: 'Placeholder pour connecter la page Facebook plus tard.' },
  { channel: 'INSTAGRAM', title: 'Instagram', description: 'Placeholder pour connecter le compte Instagram plus tard.' },
]

function createProductDraft(): ProductDraft {
  return {
    type: 'PRODUCT',
    name: '',
    description: '',
    price: '',
    deliveryFee: '',
    stock: '',
    fournisseur: '',
    variants: [],
    images: [],
    isActive: true,
  }
}

function createBotDraft(businessName: string): BotDraft {
  return {
    botEnabled: true,
    botName: businessName ? `Assistant ${businessName}` : 'Assistant Repondly',
    botMode: 'professionnel',
    botWorkingHoursStart: '09:00',
    botWorkingHoursEnd: '18:00',
    botHandoffKeywords: 'humain, agent, responsable, reclamation',
    availability: 'always',
    deliveryEnabled: true,
    deliveryDelay: '24h a 48h',
    boutiqueAddress: '',
    paymentMethods: {
      cashDelivery: true,
      onSite: false,
      card: false,
    },
    orderCaptureEnabled: true,
    notes: '',
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

  const compressedDataUrl = await readFileAsDataUrl(new File([blob], 'onboarding.webp', { type: mimeType }))

  return {
    dataUrl: compressedDataUrl,
    mimeType,
    sizeBytes: blob.size,
    position,
  }
}

function buildKnowledge(bot: BotDraft) {
  return JSON.stringify({
    version: 2,
    businessHours: [
      { key: 'monday', label: 'Lundi', open: true, from: '09:00', to: '18:00' },
      { key: 'tuesday', label: 'Mardi', open: true, from: '09:00', to: '18:00' },
      { key: 'wednesday', label: 'Mercredi', open: true, from: '09:00', to: '18:00' },
      { key: 'thursday', label: 'Jeudi', open: true, from: '09:00', to: '18:00' },
      { key: 'friday', label: 'Vendredi', open: true, from: '09:00', to: '18:00' },
      { key: 'saturday', label: 'Samedi', open: false, from: '09:00', to: '14:00' },
      { key: 'sunday', label: 'Dimanche', open: false, from: '09:00', to: '14:00' },
    ],
    delivery: {
      enabled: bot.deliveryEnabled,
      zones: bot.deliveryEnabled ? [{ location: 'Tunisie', enabled: true, price: '', condition: bot.deliveryDelay }] : [],
    },
    paymentMethods: bot.paymentMethods,
    boutiqueAddress: bot.boutiqueAddress,
    deliveryDelay: bot.deliveryDelay,
    policies: {
      cancellation: true,
      cancellationCondition: '',
      modification: true,
      modificationCondition: '',
      return: false,
      returnCondition: '',
    },
    handoffEnabled: true,
    botScheduleWeekend: true,
    orderCapture: {
      enabled: bot.orderCaptureEnabled,
      requiredFields: ['productOrService', 'name', 'phone'],
      optionalFields: ['email', 'deliveryAddress', 'preferredDate', 'notes'],
      customFields: [],
    },
    extraFaq: bot.notes.trim() ? [{ question: 'Informations importantes', answer: bot.notes.trim() }] : [],
  })
}

function getChannelIcon(channel: ChannelKey) {
  if (channel === 'INSTAGRAM') return <Camera className="h-5 w-5" aria-hidden="true" />
  if (channel === 'MESSENGER') return <MessageCircle className="h-5 w-5" aria-hidden="true" />
  return <MessageCircle className="h-5 w-5" aria-hidden="true" />
}

export function OnboardingWizard({ initialBusiness }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<Plan>(initialBusiness.plan)
  const [business, setBusiness] = useState({
    name: initialBusiness.name,
    email: initialBusiness.email,
    businessType: initialBusiness.businessType || 'ecommerce',
    customBusinessType: '',
    tone: initialBusiness.tone || 'friendly',
  })
  const [businessImages, setBusinessImages] = useState<BusinessImage[]>([])
  const [productDraft, setProductDraft] = useState<ProductDraft>(createProductDraft)
  const [products, setProducts] = useState<ProductDraft[]>([])
  const [bot, setBot] = useState<BotDraft>(() => createBotDraft(initialBusiness.name))
  const [channels, setChannels] = useState<Record<ChannelKey, ChannelDraft>>({
    WHATSAPP: { channel: 'WHATSAPP', label: 'WhatsApp principal', selected: false },
    MESSENGER: { channel: 'MESSENGER', label: 'Page Facebook', selected: false },
    INSTAGRAM: { channel: 'INSTAGRAM', label: 'Instagram principal', selected: false },
  })
  const [activeChannelModal, setActiveChannelModal] = useState<ChannelKey | null>(null)
  const [imagePending, setImagePending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentPlan = useMemo(() => plans.find((item) => item.key === plan) ?? plans[0], [plan])
  const selectedChannels = Object.values(channels).filter((channel) => channel.selected)
  const canContinue = step !== 1 || Boolean(business.name.trim() && business.email.trim())

  function nextStep() {
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
    }
  }

  function previousStep() {
    if (step > 0) {
      setStep((current) => current - 1)
    }
  }

  async function handleBusinessImages(files: FileList | null, category: string) {
    if (!files || files.length === 0) {
      return
    }

    setImagePending(true)

    try {
      const availableSlots = Math.max(0, 12 - businessImages.length)
      const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, availableSlots)
      const compressedImages = await Promise.all(selectedFiles.map((file, index) => compressImage(file, businessImages.length + index)))

      setBusinessImages((current) => [
        ...current,
        ...compressedImages.map((image, index) => ({
          ...image,
          category,
          position: current.length + index,
        })),
      ].slice(0, 12).map((image, index) => ({ ...image, position: index })))
    } finally {
      setImagePending(false)
    }
  }

  async function handleProductImages(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    setImagePending(true)

    try {
      const availableSlots = Math.max(0, 3 - productDraft.images.length)
      const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, availableSlots)
      const compressedImages = await Promise.all(selectedFiles.map((file, index) => compressImage(file, productDraft.images.length + index)))

      setProductDraft((current) => ({
        ...current,
        images: [...current.images, ...compressedImages].slice(0, 3).map((image, index) => ({ ...image, position: index })),
      }))
    } finally {
      setImagePending(false)
    }
  }

  function addProduct() {
    if (!productDraft.name.trim()) {
      return
    }

    setProducts((current) => [...current, productDraft])
    setProductDraft(createProductDraft())
  }

  function removeBusinessImage(position: number) {
    setBusinessImages((current) => current.filter((image) => image.position !== position).map((image, index) => ({ ...image, position: index })))
  }

  function removeProductImage(position: number) {
    setProductDraft((current) => ({
      ...current,
      images: current.images.filter((image) => image.position !== position).map((image, index) => ({ ...image, position: index })),
    }))
  }

  async function finishOnboarding() {
    setSaving(true)
    setError('')

    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        business: {
          name: business.name,
          email: business.email,
          businessType: business.businessType === 'other' ? business.customBusinessType : business.businessType,
          tone: business.tone,
        },
        images: businessImages,
        products,
        bot: {
          botEnabled: bot.botEnabled,
          botName: bot.botName,
          botMode: bot.botMode,
          botWorkingHoursStart: bot.availability === 'always' ? '' : bot.botWorkingHoursStart,
          botWorkingHoursEnd: bot.availability === 'always' ? '' : bot.botWorkingHoursEnd,
          botKnowledge: buildKnowledge(bot),
          botHandoffKeywords: bot.botHandoffKeywords,
        },
        channels: Object.values(channels),
      }),
    })

    const result = await response.json() as SaveResponse

    if (!result.success) {
      setSaving(false)
      setError(result.error ?? 'Impossible de finaliser la configuration.')
      return
    }

    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[color:var(--bg-page)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 md:px-8">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]">
              <Store className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-tight text-[color:var(--text-primary)]">Configuration Repondly</h1>
              <p className="text-[13px] text-[color:var(--text-secondary)]">Tout preparer maintenant pour demarrer sans friction.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {steps.map((item, index) => (
              <button
                key={item}
                type="button"
                className={cn('h-8 rounded-[var(--radius-btn)] border px-3 text-[12px] font-semibold', index === step ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]' : 'border-[color:var(--border)] bg-[color:var(--bg-card)] text-[color:var(--text-secondary)]')}
                onClick={() => setStep(index)}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>
        </header>

        <main className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="nx-card min-h-[620px] p-4 md:p-6">
            {step === 0 ? (
              <div>
                <div className="mb-5">
                  <p className="nx-section-label">Launch Pricing Plans</p>
                  <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Choisissez le plan de depart</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {plans.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={cn('flex min-h-[310px] flex-col rounded-[var(--radius-card)] border bg-[color:var(--bg-card)] p-4 text-left transition', plan === item.key ? 'border-[color:var(--brand)] shadow-[var(--shadow-elevated)]' : 'border-[color:var(--border)] hover:border-[color:var(--brand-border)]')}
                      onClick={() => setPlan(item.key)}
                    >
                      <span className="w-fit rounded-[var(--radius-btn)] bg-[color:var(--brand-soft)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--brand)]">{item.label}</span>
                      <span className="mt-4 text-[18px] font-bold text-[color:var(--text-primary)]">{item.name}</span>
                      <span className="mt-1 text-[15px] font-semibold text-[color:var(--brand)]">{item.price}</span>
                      <span className="mt-2 text-[12.5px] leading-5 text-[color:var(--text-secondary)]">{item.bestFor}</span>
                      <span className="mt-4 grid gap-2">
                        {item.features.map((feature) => (
                          <span key={feature} className="flex items-center gap-2 text-[12.5px] text-[color:var(--text-secondary)]">
                            <Check className="h-3.5 w-3.5 text-[color:var(--success)]" aria-hidden="true" />
                            {feature}
                          </span>
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4 md:grid-cols-2">
                  <p className="text-[13px] text-[color:var(--text-secondary)]">Canal supplementaire: <strong className="text-[color:var(--text-primary)]">+30 TND/mois</strong></p>
                  <p className="text-[13px] text-[color:var(--text-secondary)]">Canal supplementaire Growth: <strong className="text-[color:var(--text-primary)]">+25 TND/mois</strong></p>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="max-w-3xl">
                <p className="nx-section-label">Entreprise</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Les informations de base</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="nx-field">
                    <span className="nx-label">Nom de l&apos;entreprise</span>
                    <input className="nx-input" value={business.name} onChange={(event) => setBusiness((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Email</span>
                    <input className="nx-input" type="email" value={business.email} onChange={(event) => setBusiness((current) => ({ ...current, email: event.target.value }))} />
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Type d&apos;activite</span>
                    <select className="nx-input" value={business.businessType} onChange={(event) => setBusiness((current) => ({ ...current, businessType: event.target.value }))}>
                      {activityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Ton du bot</span>
                    <select className="nx-input" value={business.tone} onChange={(event) => setBusiness((current) => ({ ...current, tone: event.target.value }))}>
                      <option value="friendly">Amical</option>
                      <option value="professional">Professionnel</option>
                      <option value="formal">Formel</option>
                    </select>
                  </label>
                  {business.businessType === 'other' ? (
                    <label className="nx-field md:col-span-2">
                      <span className="nx-label">Activite personnalisee</span>
                      <input className="nx-input" value={business.customBusinessType} onChange={(event) => setBusiness((current) => ({ ...current, customBusinessType: event.target.value }))} placeholder="Ex: boutique meubles, agence voyage..." />
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <p className="nx-section-label">Images</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Ajoutez les images utiles au bot</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {imageCategories.map((category) => (
                    <label key={category.key} className="flex min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[color:var(--border)] bg-[color:var(--bg-page)] p-4 text-center text-[12px] font-semibold text-[color:var(--text-secondary)]">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                      {category.label}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={imagePending}
                        onChange={(event) => {
                          void handleBusinessImages(event.target.files, category.key)
                          event.target.value = ''
                        }}
                      />
                    </label>
                  ))}
                </div>
                {businessImages.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {businessImages.map((image) => (
                      <div key={`${image.position}-${image.sizeBytes}`} className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--border)]">
                        <img src={image.dataUrl} alt="" className="h-full w-full object-cover" />
                        <span className="absolute bottom-2 left-2 rounded-[var(--radius-btn)] bg-[color:var(--bg-card)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-secondary)]">{image.category}</span>
                        <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon absolute right-2 top-2 bg-[color:var(--bg-card)]" onClick={() => removeBusinessImage(image.position)} aria-label="Retirer l&apos;image">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <p className="nx-section-label">Produits et services</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Construisez le catalogue de depart</h2>
                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(['PRODUCT', 'SERVICE'] as ProductType[]).map((type) => (
                        <button key={type} type="button" className={cn('nx-filter-chip justify-center', productDraft.type === type && 'is-active')} onClick={() => setProductDraft((current) => ({ ...current, type, deliveryFee: type === 'SERVICE' ? '0' : current.deliveryFee, stock: type === 'SERVICE' ? '' : current.stock }))}>
                          {type === 'PRODUCT' ? 'Produit' : 'Service'}
                        </button>
                      ))}
                    </div>
                    <input className="nx-input" value={productDraft.name} onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nom" />
                    <textarea className="nx-input nx-textarea" value={productDraft.description} onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description courte" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="nx-input" type="number" min={0} value={productDraft.price} onChange={(event) => setProductDraft((current) => ({ ...current, price: event.target.value }))} placeholder="Prix TND" />
                      {productDraft.type === 'PRODUCT' ? <input className="nx-input" type="number" min={0} value={productDraft.deliveryFee} onChange={(event) => setProductDraft((current) => ({ ...current, deliveryFee: event.target.value }))} placeholder="Livraison TND" /> : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {productDraft.type === 'PRODUCT' ? <input className="nx-input" type="number" min={0} value={productDraft.stock} onChange={(event) => setProductDraft((current) => ({ ...current, stock: event.target.value }))} placeholder="Stock optionnel" /> : null}
                      <input className="nx-input" value={productDraft.fournisseur} onChange={(event) => setProductDraft((current) => ({ ...current, fournisseur: event.target.value }))} placeholder="Fournisseur optionnel" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {productDraft.images.map((image) => (
                        <div key={`${image.position}-${image.sizeBytes}`} className="relative aspect-square overflow-hidden rounded-[var(--radius-btn)] border border-[color:var(--border)]">
                          <img src={image.dataUrl} alt="" className="h-full w-full object-cover" />
                          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon absolute right-1 top-1 bg-[color:var(--bg-card)]" onClick={() => removeProductImage(image.position)} aria-label="Retirer la photo">
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                      {productDraft.images.length < 3 ? (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-dashed border-[color:var(--border)] bg-[color:var(--bg-page)] text-[12px] font-semibold text-[color:var(--text-secondary)]">
                          <ImagePlus className="h-5 w-5" aria-hidden="true" />
                          Photo
                          <input type="file" accept="image/*" multiple className="sr-only" disabled={imagePending} onChange={(event) => {
                            void handleProductImages(event.target.files)
                            event.target.value = ''
                          }} />
                        </label>
                      ) : null}
                    </div>
                    <button type="button" className="nx-btn nx-btn-primary w-fit" disabled={!productDraft.name.trim()} onClick={addProduct}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Ajouter au catalogue
                    </button>
                  </div>
                  <div className="grid content-start gap-2">
                    {products.length > 0 ? products.map((product, index) => (
                      <div key={`${product.name}-${index}`} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">{product.name}</p>
                            <p className="mt-1 text-[12px] text-[color:var(--text-secondary)]">{product.type === 'PRODUCT' ? 'Produit' : 'Service'} - {product.price || '0'} TND</p>
                          </div>
                          <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={() => setProducts((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4 text-[13px] text-[color:var(--text-secondary)]">Vous pouvez aussi passer cette etape et ajouter le catalogue plus tard.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="max-w-4xl">
                <p className="nx-section-label">Bot IA</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Configurez les reponses automatiques</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <div>
                      <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">Bot automatique</p>
                      <p className="text-[12px] text-[color:var(--text-secondary)]">Repond aux questions repetitives.</p>
                    </div>
                    <button type="button" role="switch" aria-checked={bot.botEnabled} className={cn('nx-toggle', bot.botEnabled && 'is-on')} onClick={() => setBot((current) => ({ ...current, botEnabled: !current.botEnabled }))}>
                      <span className="nx-toggle-thumb" />
                    </button>
                  </div>
                  <label className="nx-field">
                    <span className="nx-label">Nom du bot</span>
                    <input className="nx-input" value={bot.botName} onChange={(event) => setBot((current) => ({ ...current, botName: event.target.value }))} />
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Style</span>
                    <select className="nx-input" value={bot.botMode} onChange={(event) => setBot((current) => ({ ...current, botMode: event.target.value }))}>
                      <option value="professionnel">Professionnel</option>
                      <option value="amical">Amical</option>
                      <option value="direct">Direct</option>
                    </select>
                  </label>
                  <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                    <button type="button" className={cn('nx-btn justify-center', bot.availability === 'always' ? 'nx-btn-primary' : 'nx-btn-secondary')} onClick={() => setBot((current) => ({ ...current, availability: 'always' }))}>Actif 24/7</button>
                    <button type="button" className={cn('nx-btn justify-center', bot.availability === 'scheduled' ? 'nx-btn-primary' : 'nx-btn-secondary')} onClick={() => setBot((current) => ({ ...current, availability: 'scheduled' }))}>Horaires specifique</button>
                  </div>
                  {bot.availability === 'scheduled' ? (
                    <>
                      <label className="nx-field">
                        <span className="nx-label">Debut</span>
                        <input className="nx-input" type="time" value={bot.botWorkingHoursStart} onChange={(event) => setBot((current) => ({ ...current, botWorkingHoursStart: event.target.value }))} />
                      </label>
                      <label className="nx-field">
                        <span className="nx-label">Fin</span>
                        <input className="nx-input" type="time" value={bot.botWorkingHoursEnd} onChange={(event) => setBot((current) => ({ ...current, botWorkingHoursEnd: event.target.value }))} />
                      </label>
                    </>
                  ) : null}
                  <label className="nx-field">
                    <span className="nx-label">Livraison</span>
                    <select className="nx-input" value={bot.deliveryEnabled ? 'yes' : 'no'} onChange={(event) => setBot((current) => ({ ...current, deliveryEnabled: event.target.value === 'yes' }))}>
                      <option value="yes">Oui</option>
                      <option value="no">Non</option>
                    </select>
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Delai de livraison</span>
                    <input className="nx-input" value={bot.deliveryDelay} onChange={(event) => setBot((current) => ({ ...current, deliveryDelay: event.target.value }))} />
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Adresse boutique</span>
                    <input className="nx-input" value={bot.boutiqueAddress} onChange={(event) => setBot((current) => ({ ...current, boutiqueAddress: event.target.value }))} />
                  </label>
                  <label className="nx-field">
                    <span className="nx-label">Mots cles handoff</span>
                    <input className="nx-input" value={bot.botHandoffKeywords} onChange={(event) => setBot((current) => ({ ...current, botHandoffKeywords: event.target.value }))} />
                  </label>
                  <div className="md:col-span-2">
                    <p className="nx-label mb-2">Paiement accepte</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      {[
                        ['cashDelivery', 'Cash a la livraison'],
                        ['onSite', 'Sur place'],
                        ['card', 'Carte'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3 text-[13px] text-[color:var(--text-secondary)]">
                          <input type="checkbox" checked={bot.paymentMethods[key as keyof BotDraft['paymentMethods']]} onChange={(event) => setBot((current) => ({ ...current, paymentMethods: { ...current.paymentMethods, [key]: event.target.checked } }))} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="nx-field md:col-span-2">
                    <span className="nx-label">Informations supplementaires pour le bot</span>
                    <textarea className="nx-input nx-textarea min-h-[110px]" value={bot.notes} onChange={(event) => setBot((current) => ({ ...current, notes: event.target.value }))} placeholder="Promos, conditions, questions frequentes, disponibilites..." />
                  </label>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <p className="nx-section-label">Canaux</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Preparez les connexions</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {channelOptions.map((item) => {
                    const channel = channels[item.channel]

                    return (
                      <article key={item.channel} className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-card)] p-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-btn)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]">{getChannelIcon(item.channel)}</div>
                        <h3 className="mt-4 text-[15px] font-bold text-[color:var(--text-primary)]">{item.title}</h3>
                        <p className="mt-2 text-[12.5px] leading-5 text-[color:var(--text-secondary)]">{item.description}</p>
                        <input className="nx-input mt-4" value={channel.label} onChange={(event) => setChannels((current) => ({ ...current, [item.channel]: { ...current[item.channel], label: event.target.value } }))} />
                        <div className="mt-4 flex gap-2">
                          <button type="button" className={cn('nx-btn flex-1', channel.selected ? 'nx-btn-primary' : 'nx-btn-secondary')} onClick={() => setActiveChannelModal(item.channel)}>
                            {channel.selected ? 'Selectionne' : 'Connecter'}
                          </button>
                          <button type="button" className="nx-btn nx-btn-ghost" onClick={() => setChannels((current) => ({ ...current, [item.channel]: { ...current[item.channel], selected: false } }))}>Passer</button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div>
                <p className="nx-section-label">Validation</p>
                <h2 className="mt-1 text-[20px] font-bold text-[color:var(--text-primary)]">Pret a lancer Repondly</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <p className="text-[12px] font-bold uppercase text-[color:var(--text-muted)]">Plan</p>
                    <p className="mt-2 text-[16px] font-bold text-[color:var(--text-primary)]">{currentPlan.name} - {currentPlan.price}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <p className="text-[12px] font-bold uppercase text-[color:var(--text-muted)]">Entreprise</p>
                    <p className="mt-2 text-[16px] font-bold text-[color:var(--text-primary)]">{business.name || 'Nom manquant'}</p>
                    <p className="text-[13px] text-[color:var(--text-secondary)]">{business.email || 'Email manquant'}</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <p className="text-[12px] font-bold uppercase text-[color:var(--text-muted)]">Catalogue</p>
                    <p className="mt-2 text-[16px] font-bold text-[color:var(--text-primary)]">{products.length} element(s)</p>
                  </div>
                  <div className="rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-4">
                    <p className="text-[12px] font-bold uppercase text-[color:var(--text-muted)]">Canaux</p>
                    <p className="mt-2 text-[16px] font-bold text-[color:var(--text-primary)]">{selectedChannels.length} prepare(s)</p>
                  </div>
                </div>
                {error ? <p className="mt-4 rounded-[var(--radius-card)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] p-3 text-[13px] font-semibold text-[color:var(--danger)]">{error}</p> : null}
              </div>
            ) : null}
          </section>

          <aside className="nx-card h-fit p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[color:var(--text-primary)]">Resume</p>
                <p className="text-[12px] text-[color:var(--text-secondary)]">{steps[step]}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-[13px] text-[color:var(--text-secondary)]">
              <p><strong className="text-[color:var(--text-primary)]">Plan:</strong> {currentPlan.name}</p>
              <p><strong className="text-[color:var(--text-primary)]">Images:</strong> {businessImages.length}</p>
              <p><strong className="text-[color:var(--text-primary)]">Catalogue:</strong> {products.length}</p>
              <p><strong className="text-[color:var(--text-primary)]">Canaux:</strong> {selectedChannels.length}</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" className="nx-btn nx-btn-secondary flex-1" onClick={previousStep} disabled={step === 0 || saving}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Retour
              </button>
              {step === steps.length - 1 ? (
                <button type="button" className="nx-btn nx-btn-primary flex-1" onClick={() => void finishOnboarding()} disabled={saving || !business.name.trim() || !business.email.trim()}>
                  {saving ? 'Enregistrement...' : 'Terminer'}
                </button>
              ) : (
                <button type="button" className="nx-btn nx-btn-primary flex-1" onClick={nextStep} disabled={!canContinue || saving}>
                  {step === 0 ? "Continuer l'essai gratuit" : 'Continuer'}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </aside>
        </main>
      </div>

      {activeChannelModal ? (
        <div className="nx-modal-backdrop z-[90]">
          <div className="nx-card w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="nx-section-label">Connexion bientot disponible</p>
                <h2 className="mt-1 text-[17px] font-bold text-[color:var(--text-primary)]">{channelOptions.find((item) => item.channel === activeChannelModal)?.title}</h2>
              </div>
              <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={() => setActiveChannelModal(null)} aria-label="Fermer">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-[color:var(--text-secondary)]">La connexion automatique sera activee plus tard. Pour l&apos;instant, Repondly va seulement enregistrer ce canal comme a preparer.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="nx-btn nx-btn-secondary flex-1" onClick={() => setActiveChannelModal(null)}>Passer</button>
              <button
                type="button"
                className="nx-btn nx-btn-primary flex-1"
                onClick={() => {
                  setChannels((current) => ({
                    ...current,
                    [activeChannelModal]: {
                      ...current[activeChannelModal],
                      selected: true,
                    },
                  }))
                  setActiveChannelModal(null)
                }}
              >
                Enregistrer le canal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
