'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Stethoscope,
  GraduationCap,
  UtensilsCrossed,
  Store,
  Package,
  Home,
  Wrench,
  CalendarDays,
  Building2,
  Phone,
  Trash2,
  Plus,
  ChevronRight,
  Check,
  Smile,
  Briefcase,
  Zap,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CardSurface } from '@/components/ui/card-surface'
import { H2, Body, Caption } from '@/components/ui/typography'
import ProgressBar from '@/components/onboarding/ProgressBar'
import { cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────────────────────── */

type SectorKey =
  | 'beauty'
  | 'medical'
  | 'coaching'
  | 'restaurant'
  | 'boutique'
  | 'ecommerce'
  | 'real-estate'
  | 'garage'
  | 'events'
  | 'other'

type LangKey = 'darija' | 'french' | 'mix'
type PersonalityKey = 'warm' | 'professional' | 'direct'

interface ServiceItem {
  name: string
  price: string
}

interface ScheduleDay {
  open: boolean
  from: string
  to: string
}

interface FaqItem {
  question: string
  active: boolean
  answer: string
}

interface OnboardingData {
  name: string
  sector: SectorKey | ''
  city: string
  phone: string
  language: LangKey
  services: ServiceItem[]
  schedule: Record<string, ScheduleDay>
  faqs: FaqItem[]
  botPersonality: PersonalityKey
  botName: string
}

/* ── Constants ──────────────────────────────────────────────────────────── */

const SECTORS: { key: SectorKey; label: string; icon: React.ReactNode }[] = [
  { key: 'beauty', label: 'Beauté & Soins', icon: <Sparkles size={20} /> },
  { key: 'medical', label: 'Médical / Clinique', icon: <Stethoscope size={20} /> },
  { key: 'coaching', label: 'Éducation / Cours', icon: <GraduationCap size={20} /> },
  { key: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={20} /> },
  { key: 'boutique', label: 'Boutique / Magasin', icon: <Store size={20} /> },
  { key: 'ecommerce', label: 'E-commerce', icon: <Package size={20} /> },
  { key: 'real-estate', label: 'Immobilier', icon: <Home size={20} /> },
  { key: 'garage', label: 'Garage / Auto', icon: <Wrench size={20} /> },
  { key: 'events', label: 'Événementiel', icon: <CalendarDays size={20} /> },
  { key: 'other', label: 'Autre', icon: <Building2 size={20} /> },
]

const DEFAULT_SCHEDULE: Record<string, ScheduleDay> = {
  mon: { open: true, from: '09:00', to: '18:00' },
  tue: { open: true, from: '09:00', to: '18:00' },
  wed: { open: true, from: '09:00', to: '18:00' },
  thu: { open: true, from: '09:00', to: '18:00' },
  fri: { open: true, from: '09:00', to: '18:00' },
  sat: { open: true, from: '10:00', to: '17:00' },
  sun: { open: false, from: '09:00', to: '18:00' },
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Lundi',
  tue: 'Mardi',
  wed: 'Mercredi',
  thu: 'Jeudi',
  fri: 'Vendredi',
  sat: 'Samedi',
  sun: 'Dimanche',
}

const DEFAULT_FAQS: FaqItem[] = [
  { question: 'Comment prendre rendez-vous ?', active: true, answer: '' },
  { question: 'Quels sont vos tarifs ?', active: true, answer: '' },
  { question: 'Où êtes-vous situés ?', active: true, answer: '' },
  { question: 'Quels modes de paiement acceptez-vous ?', active: true, answer: '' },
  { question: 'Proposez-vous des forfaits ?', active: true, answer: '' },
  { question: 'Puis-je annuler ou reporter mon rendez-vous ?', active: true, answer: '' },
]

const FAQ_FALLBACK_ANSWERS: Record<string, string> = {
  'Comment prendre rendez-vous ?':
    "Vous pouvez prendre rendez-vous directement via ce chat en indiquant le jour et l'heure qui vous conviennent.",
  'Quels sont vos tarifs ?':
    'Nos tarifs varient selon le service. Je peux vous donner les prix précis, quel service vous intéresse ?',
  'Où êtes-vous situés ?':
    "Nous vous communiquerons l'adresse exacte lors de la confirmation de votre rendez-vous.",
  'Quels modes de paiement acceptez-vous ?':
    'Nous acceptons le paiement en espèces, par carte et par virement selon le service.',
  'Proposez-vous des forfaits ?':
    'Oui, nous avons des forfaits adaptés. Souhaitez-vous que je vous présente nos offres ?',
  'Puis-je annuler ou reporter mon rendez-vous ?':
    "Bien sûr, vous pouvez annuler ou reporter jusqu'à 24h avant le rendez-vous.",
}

const PERSONALITIES: {
  key: PersonalityKey
  icon: React.ReactNode
  title: string
  desc: string
}[] = [
  {
    key: 'warm',
    icon: <Smile size={20} />,
    title: 'Chaleureux & Proche',
    desc: 'Le bot parle comme un ami de confiance',
  },
  {
    key: 'professional',
    icon: <Briefcase size={20} />,
    title: 'Professionnel',
    desc: 'Ton formel et rassurant',
  },
  {
    key: 'direct',
    icon: <Zap size={20} />,
    title: 'Concis & Direct',
    desc: 'Réponses courtes et efficaces',
  },
]

function sectorDefaults(sector: SectorKey): ServiceItem[] {
  switch (sector) {
    case 'beauty':
      return [
        { name: 'Soin visage', price: '80' },
        { name: 'Manucure', price: '35' },
      ]
    case 'medical':
      return [
        { name: 'Consultation générale', price: '60' },
        { name: 'Bilan de santé', price: '120' },
      ]
    case 'coaching':
      return [
        { name: 'Séance de coaching', price: '150' },
        { name: 'Cours en ligne', price: '100' },
      ]
    case 'restaurant':
      return [
        { name: 'Menu du jour', price: '25' },
        { name: 'Formule dégustation', price: '55' },
      ]
    case 'boutique':
      return [
        { name: 'Article populaire', price: '45' },
        { name: 'Pack promo', price: '90' },
      ]
    case 'ecommerce':
      return [
        { name: 'Produit phare', price: '60' },
        { name: 'Pack découverte', price: '120' },
      ]
    case 'real-estate':
      return [
        { name: 'Visite appartement', price: '' },
        { name: 'Estimation', price: '' },
      ]
    case 'garage':
      return [
        { name: 'Réparation standard', price: '80' },
        { name: 'Diagnostic', price: '40' },
      ]
    case 'events':
      return [
        { name: 'Pack événement', price: '500' },
        { name: 'Prestation sur mesure', price: '' },
      ]
    default:
      return [
        { name: 'Offre standard', price: '50' },
        { name: 'Offre premium', price: '100' },
      ]
  }
}

/* ── Main Page ──────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [data, setData] = useState<OnboardingData>({
    name: '',
    sector: '',
    city: '',
    phone: '',
    language: 'french',
    services: [],
    schedule: { ...DEFAULT_SCHEDULE },
    faqs: DEFAULT_FAQS.map((f) => ({ ...f })),
    botPersonality: 'warm',
    botName: '',
  })

  const update = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Scroll focused inputs into view on mobile so they don't hide behind the footer
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 250)
      }
    }
    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [step])

  const validateStep = useCallback(
    (s: number): boolean => {
      const e: Record<string, string> = {}
      switch (s) {
        case 1:
          if (!data.name.trim()) e.name = "Le nom de l'entreprise est requis"
          if (!data.sector) e.sector = 'Choisissez un secteur'
          if (!data.city.trim()) e.city = 'La ville est requise'
          break
        case 2:
          if (data.services.length === 0) {
            e.services = 'Ajoutez au moins une offre'
          } else {
            const emptyName = data.services.some((sv) => !sv.name.trim())
            if (emptyName) e.services = 'Toutes les offres doivent avoir un nom'
          }
          break
        case 3:
          if (!Object.values(data.schedule).some((d) => d.open)) {
            e.schedule = 'Au moins un jour doit être ouvert'
          }
          break
      }
      setErrors(e)
      return Object.keys(e).length === 0
    },
    [data]
  )

  const handleSectorChange = (sector: SectorKey) => {
    update('sector', sector)
    update('services', sectorDefaults(sector))
  }

  const handleNext = async () => {
    if (!validateStep(step)) return
    if (step < 5) {
      setStep((s) => s + 1)
      setErrors({})
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: data.name.trim(),
        sector: data.sector,
        city: data.city.trim(),
        phone: data.phone.trim(),
        language: data.language,
        services: data.services.map((s) => ({
          name: s.name.trim(),
          price: parseFloat(s.price) || 0,
        })),
        schedule: data.schedule,
        faqs: data.faqs
          .filter((f) => f.active)
          .map((f) => ({
            question: f.question,
            answer:
              f.answer.trim() ||
              FAQ_FALLBACK_ANSWERS[f.question] ||
              'Notre équipe vous répondra sous peu.',
          })),
        botPersonality: data.botPersonality,
        botName: data.botName.trim() || data.name.trim(),
      }

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.success) {
        router.push('/dashboard/accueil')
      } else {
        alert(result.error || 'Une erreur est survenue.')
      }
    } catch {
      alert('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      setErrors({})
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('onboarding-dismissed', 'true')
    router.push('/dashboard/accueil')
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        aria-label="Fermer"
      >
        <X size={18} />
      </button>
      <ProgressBar currentStep={step} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-32 pt-5 sm:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-xl"
          >
            {step === 1 && (
              <Step1
                data={data}
                update={update}
                onSectorChange={handleSectorChange}
                errors={errors}
              />
            )}
            {step === 2 && <Step2 data={data} update={update} errors={errors} />}
            {step === 3 && <Step3 data={data} update={update} errors={errors} />}
            {step === 4 && <Step4 data={data} update={update} />}
            {step === 5 && <Step5 data={data} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom action bar */}
      <div className="shrink-0 border-t border-[var(--surface-border)] bg-[var(--surface-0)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(step === 1 && 'invisible')}
        >
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={saving}
          className="flex-1 bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 active:bg-[var(--brand-primary)]/80 max-w-[280px] ml-auto"
        >
          {saving ? (
            'Sauvegarde...'
          ) : step === 5 ? (
            <>
              Terminer <Check size={16} className="ml-1.5" />
            </>
          ) : (
            <>
              Suivant <ChevronRight size={16} className="ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/* ── Step 1: Identité ───────────────────────────────────────────────────── */

function Step1({
  data,
  update,
  onSectorChange,
  errors,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onSectorChange: (s: SectorKey) => void
  errors: Record<string, string>
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <H2 className="font-['Syne',sans-serif] text-xl sm:text-2xl">Votre entreprise</H2>
        <Body>Quelques infos pour personnaliser votre assistant</Body>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Nom de l'entreprise *" error={errors.name}>
          <Input
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: Salon Lumière"
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
          />
        </Field>

        <Field label="Secteur d'activité *" error={errors.sector}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {SECTORS.map((s) => {
              const active = data.sector === s.key
              return (
                <CardSurface
                  key={s.key}
                  interactive
                  onClick={() => onSectorChange(s.key)}
                  className={cn(
                    'flex items-center gap-2.5 p-3 transition-all',
                    active &&
                      'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      active
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                    )}
                  >
                    {s.icon}
                  </span>
                  <span
                    className={cn(
                      'text-sm leading-tight',
                      active
                        ? 'font-semibold text-[var(--brand-primary)]'
                        : 'text-[var(--text-primary)]'
                    )}
                  >
                    {s.label}
                  </span>
                </CardSurface>
              )
            })}
          </div>
        </Field>

        <Field label="Ville *" error={errors.city}>
          <Input
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Ex: Tunis"
          />
        </Field>

        <Field label="Téléphone">
          <div className="relative">
            <Phone
              size={16}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <Input
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+216 XX XXX XXX"
              className="pl-9"
            />
          </div>
        </Field>

        <Field label="Langue par défaut">
          <div className="flex gap-2.5">
            {(
              [
                { key: 'french' as LangKey, label: 'Français' },
                { key: 'darija' as LangKey, label: 'Darija' },
                { key: 'mix' as LangKey, label: 'Mixte' },
              ] as const
            ).map((l) => {
              const active = data.language === l.key
              return (
                <button
                  key={l.key}
                  onClick={() => update('language', l.key)}
                  className={cn(
                    'flex-1 rounded-[var(--radius-md)] border px-2 py-2.5 text-sm transition-all',
                    active
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] font-semibold text-[var(--brand-primary)]'
                      : 'border-[var(--surface-border)] bg-[var(--surface-0)] text-[var(--text-primary)]'
                  )}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </div>
  )
}

/* ── Step 2: Offres & Tarifs ────────────────────────────────────────────── */

function Step2({
  data,
  update,
  errors,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  errors: Record<string, string>
}) {
  const addService = () => {
    update('services', [...data.services, { name: '', price: '' }])
  }

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const next = data.services.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    update('services', next)
  }

  const removeService = (index: number) => {
    const next = data.services.filter((_, i) => i !== index)
    update('services', next)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <H2 className="font-['Syne',sans-serif] text-xl sm:text-2xl">Offres & Tarifs</H2>
        <Body>Ajoutez les produits ou services que vous proposez</Body>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.services.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-0)] p-2.5"
          >
            <Input
              value={s.name}
              onChange={(e) => updateService(i, 'name', e.target.value)}
              placeholder="Nom de l'offre"
              className="flex-1"
            />
            <div className="relative w-24 shrink-0">
              <Input
                type="number"
                value={s.price}
                onChange={(e) => updateService(i, 'price', e.target.value)}
                placeholder="0"
                className="pr-7"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                DT
              </span>
            </div>
            <button
              onClick={() => removeService(i)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--brand-danger)] transition-colors hover:bg-[var(--brand-danger)]/10"
              aria-label="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {errors.services && (
        <p className="text-xs text-[var(--brand-danger)]">{errors.services}</p>
      )}

      <button
        onClick={addService}
        className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--surface-border)] bg-transparent px-3 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:border-[var(--brand-primary)]"
      >
        <Plus size={16} />
        Ajouter une offre
      </button>

      {data.services.length === 0 && !errors.services && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          Ajoutez au moins une offre pour continuer
        </p>
      )}
    </div>
  )
}

/* ── Step 3: Horaires ───────────────────────────────────────────────────── */

function Step3({
  data,
  update,
  errors,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  errors: Record<string, string>
}) {
  const toggleDay = (day: string) => {
    const next = {
      ...data.schedule,
      [day]: { ...data.schedule[day], open: !data.schedule[day].open },
    }
    update('schedule', next)
  }

  const updateTime = (day: string, field: 'from' | 'to', value: string) => {
    const next = {
      ...data.schedule,
      [day]: { ...data.schedule[day], [field]: value },
    }
    update('schedule', next)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <H2 className="font-['Syne',sans-serif] text-xl sm:text-2xl">Horaires d'ouverture</H2>
        <Body>Activez les jours où vous êtes ouverts</Body>
      </div>

      {errors.schedule && (
        <p className="text-xs text-[var(--brand-danger)]">{errors.schedule}</p>
      )}

      <div className="flex flex-col gap-2">
        {Object.entries(DAY_LABELS).map(([key, label]) => {
          const day = data.schedule[key]
          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-0)] px-3 py-2.5"
            >
              <span className="w-20 shrink-0 text-sm font-medium text-[var(--text-primary)]">
                {label}
              </span>

              <Switch checked={day.open} onCheckedChange={() => toggleDay(key)} />

              {day.open ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={day.from}
                    onChange={(e) => updateTime(key, 'from', e.target.value)}
                    className="flex-1 rounded-[var(--radius-sm)] border border-[var(--surface-border)] bg-[var(--surface-1)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)]">à</span>
                  <input
                    type="time"
                    value={day.to}
                    onChange={(e) => updateTime(key, 'to', e.target.value)}
                    className="flex-1 rounded-[var(--radius-sm)] border border-[var(--surface-border)] bg-[var(--surface-1)] px-2 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              ) : (
                <span className="flex-1 text-xs italic text-[var(--text-muted)]">
                  Fermé
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 4: FAQs ───────────────────────────────────────────────────────── */

function Step4({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
}) {
  const toggleFaq = (index: number) => {
    const next = data.faqs.map((f, i) =>
      i === index ? { ...f, active: !f.active } : f
    )
    update('faqs', next)
  }

  const updateFaqAnswer = (index: number, value: string) => {
    const next = data.faqs.map((f, i) =>
      i === index ? { ...f, answer: value } : f
    )
    update('faqs', next)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <H2 className="font-['Syne',sans-serif] text-xl sm:text-2xl">Questions fréquentes</H2>
        <Body>
          Activez celles que le bot peut répondre. Personnalisez la réponse si vous le souhaitez.
        </Body>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.faqs.map((faq, i) => (
          <div
            key={i}
            className={cn(
              'rounded-[var(--radius-md)] border transition-colors overflow-hidden',
              faq.active
                ? 'border-[var(--brand-primary-soft)] bg-[var(--surface-0)]'
                : 'border-[var(--surface-border)] bg-[var(--surface-1)]'
            )}
          >
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {faq.question}
              </span>
              <Switch
                checked={faq.active}
                onCheckedChange={() => toggleFaq(i)}
              />
            </div>
            {faq.active && (
              <div className="px-3.5 pb-3">
                <Textarea
                  value={faq.answer}
                  onChange={(e) => updateFaqAnswer(i, e.target.value)}
                  placeholder={
                    FAQ_FALLBACK_ANSWERS[faq.question] || 'Réponse par défaut...'
                  }
                  className="min-h-[60px] resize-y text-sm"
                />
                <Caption className="mt-1 block">
                  Laissez vide pour utiliser la réponse suggérée ci-dessus.
                </Caption>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 5: Personnalité ───────────────────────────────────────────────── */

function Step5({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <H2 className="font-['Syne',sans-serif] text-xl sm:text-2xl">Personnalité du bot</H2>
        <Body>Choisissez le ton que votre assistant adoptera</Body>
      </div>

      <div className="flex flex-col gap-2.5">
        {PERSONALITIES.map((p) => {
          const active = data.botPersonality === p.key
          return (
            <CardSurface
              key={p.key}
              interactive
              onClick={() => update('botPersonality', p.key)}
              className={cn(
                'flex items-start gap-3.5 p-4 transition-all text-left',
                active && 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                  active
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                )}
              >
                {p.icon}
              </div>
              <div>
                <div
                  className={cn(
                    'text-sm font-semibold',
                    active
                      ? 'text-[var(--brand-primary)]'
                      : 'text-[var(--text-primary)]'
                  )}
                >
                  {p.title}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{p.desc}</div>
              </div>
            </CardSurface>
          )
        })}
      </div>

      <Field label="Comment s'appelle votre assistant ?">
        <Input
          value={data.botName}
          onChange={(e) => update('botName', e.target.value)}
          placeholder={data.name || 'Ex: Assistant Répondly'}
        />
      </Field>
    </div>
  )
}

/* ── Shared Field wrapper ───────────────────────────────────────────────── */

function Field({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-xs text-[var(--brand-danger)]">{error}</span>
      )}
    </div>
  )
}
