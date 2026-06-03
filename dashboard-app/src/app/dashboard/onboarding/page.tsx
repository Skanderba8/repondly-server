'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Trash2, Plus, Phone,
  Smile, Briefcase, Zap, ChevronRight,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import ProgressBar from '@/components/onboarding/ProgressBar'

/* ── Types ────────────────────────────────────────────────────────────────── */

type SectorKey =
  | 'beauty'
  | 'medical'
  | 'coaching'
  | 'restaurant'
  | 'real-estate'
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

/* ── Constants ────────────────────────────────────────────────────────────── */

const SECTORS: { key: SectorKey; label: string; icon: string }[] = [
  { key: 'beauty', label: 'Beauté & Soins', icon: '💅' },
  { key: 'medical', label: 'Médical / Clinique', icon: '🏥' },
  { key: 'coaching', label: 'Éducation / Cours', icon: '📚' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'real-estate', label: 'Immobilier', icon: '🏠' },
  { key: 'other', label: 'Autre', icon: '✨' },
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
  emoji: React.ReactNode
  title: string
  desc: string
}[] = [
  {
    key: 'warm',
    emoji: <Smile size={24} />,
    title: 'Chaleureux & Proche',
    desc: 'Le bot parle comme un ami de confiance',
  },
  {
    key: 'professional',
    emoji: <Briefcase size={24} />,
    title: 'Professionnel',
    desc: 'Ton formel et rassurant',
  },
  {
    key: 'direct',
    emoji: <Zap size={24} />,
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
    case 'real-estate':
      return [
        { name: 'Visite appartement', price: '0' },
        { name: 'Estimation', price: '0' },
      ]
    default:
      return [
        { name: 'Service standard', price: '50' },
        { name: 'Service premium', price: '100' },
      ]
  }
}

/* ── Main Page ────────────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
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

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return (
          data.name.trim().length > 0 &&
          data.sector !== '' &&
          data.city.trim().length > 0
        )
      case 2:
        return data.services.length > 0 && data.services.every((s) => s.name.trim() && s.price.trim())
      case 3:
        return Object.values(data.schedule).some((d) => d.open)
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSectorChange = (sector: SectorKey) => {
    update('sector', sector)
    update('services', sectorDefaults(sector))
  }

  const handleNext = async () => {
    if (step < 5) {
      setStep((s) => s + 1)
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
              f.answer.trim() || FAQ_FALLBACK_ANSWERS[f.question] || 'Notre équipe vous répondra sous peu.',
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
    if (step > 1) setStep((s) => s - 1)
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <ProgressBar currentStep={step} />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '20px',
          paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{ maxWidth: 520, margin: '0 auto' }}
          >
            {step === 1 && <Step1 data={data} update={update} onSectorChange={handleSectorChange} />}
            {step === 2 && <Step2 data={data} update={update} />}
            {step === 3 && <Step3 data={data} update={update} />}
            {step === 4 && <Step4 data={data} update={update} />}
            {step === 5 && <Step5 data={data} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--surface-border)',
          background: 'var(--surface-0)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
        >
          Retour
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed() || saving}
          style={{
            background: 'var(--brand-primary)',
            color: '#fff',
            flex: 1,
            maxWidth: 280,
          }}
        >
          {saving
            ? 'Sauvegarde...'
            : step === 5
              ? <>Terminer <Sparkles size={16} style={{ marginLeft: 6 }} /></>
              : <>Suivant <ChevronRight size={16} style={{ marginLeft: 6 }} /></>}
        </Button>
      </div>
    </div>
  )
}

/* ── Step 1: Identité ─────────────────────────────────────────────────────── */

function Step1({
  data,
  update,
  onSectorChange,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
  onSectorChange: (s: SectorKey) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Votre entreprise
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Quelques infos pour personnaliser votre assistant
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nom de l'entreprise *">
          <Input
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex: Salon Lumière"
          />
        </Field>

        <Field label="Secteur d'activité *">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {SECTORS.map((s) => {
              const active = data.sector === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => onSectorChange(s.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--brand-primary-soft)' : 'var(--surface-0)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Ville *">
          <Input
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder="Ex: Tunis"
          />
        </Field>

        <Field label="Téléphone">
          <div style={{ position: 'relative' }}>
            <Phone
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <Input
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+216 XX XXX XXX"
              style={{ paddingLeft: 34 }}
            />
          </div>
        </Field>

        <Field label="Langue par défaut">
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { key: 'french' as LangKey, label: 'Français' },
              { key: 'darija' as LangKey, label: 'Darija' },
              { key: 'mix' as LangKey, label: 'Mixte' },
            ].map((l) => {
              const active = data.language === l.key
              return (
                <button
                  key={l.key}
                  onClick={() => update('language', l.key)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--surface-border)'}`,
                    background: active ? 'var(--brand-primary-soft)' : 'var(--surface-0)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
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

/* ── Step 2: Services ─────────────────────────────────────────────────────── */

function Step2({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
}) {
  const addService = () => {
    update('services', [...data.services, { name: '', price: '' }])
  }

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    const next = data.services.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    update('services', next)
  }

  const removeService = (index: number) => {
    const next = data.services.filter((_, i) => i !== index)
    update('services', next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Services & Tarifs
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Ajoutez les services que vous proposez
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.services.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-0)',
            }}
          >
            <Input
              value={s.name}
              onChange={(e) => updateService(i, 'name', e.target.value)}
              placeholder="Nom du service"
              style={{ flex: 1 }}
            />
            <div style={{ position: 'relative', width: 100 }}>
              <Input
                type="number"
                value={s.price}
                onChange={(e) => updateService(i, 'price', e.target.value)}
                placeholder="0"
                style={{ paddingRight: 28 }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                DT
              </span>
            </div>
            <button
              onClick={() => removeService(i)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-danger)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addService}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--surface-border)',
          background: 'transparent',
          color: 'var(--brand-primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
      >
        <Plus size={16} />
        Ajouter un service
      </button>

      {data.services.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Ajoutez au moins un service pour continuer
        </p>
      )}
    </div>
  )
}

/* ── Step 3: Horaires ─────────────────────────────────────────────────────── */

function Step3({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Horaires d'ouverture
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Activez les jours où vous êtes ouverts
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.entries(DAY_LABELS).map(([key, label]) => {
          const day = data.schedule[key]
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-0)',
              }}
            >
              <span
                style={{
                  width: 80,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  flexShrink: 0,
                }}
              >
                {label}
              </span>

              <Switch checked={day.open} onCheckedChange={() => toggleDay(key)} />

              {day.open ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input
                    type="time"
                    value={day.from}
                    onChange={(e) => updateTime(key, 'from', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-1)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>à</span>
                  <input
                    type="time"
                    value={day.to}
                    onChange={(e) => updateTime(key, 'to', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-1)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    flex: 1,
                  }}
                >
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

/* ── Step 4: FAQs ─────────────────────────────────────────────────────────── */

function Step4({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
}) {
  const toggleFaq = (index: number) => {
    const next = data.faqs.map((f, i) => (i === index ? { ...f, active: !f.active } : f))
    update('faqs', next)
  }

  const updateFaqAnswer = (index: number, value: string) => {
    const next = data.faqs.map((f, i) => (i === index ? { ...f, answer: value } : f))
    update('faqs', next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Questions fréquentes
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Activez celles que le bot peut répondre. Personnalisez la réponse si vous le souhaitez.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${faq.active ? 'var(--brand-primary-soft)' : 'var(--surface-border)'}`,
              background: faq.active ? 'var(--surface-0)' : 'var(--surface-1)',
              overflow: 'hidden',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
              onClick={() => toggleFaq(i)}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                {faq.question}
              </span>
              <Switch checked={faq.active} onCheckedChange={() => toggleFaq(i)} />
            </div>
            {faq.active && (
              <div style={{ padding: '0 14px 12px' }}>
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaqAnswer(i, e.target.value)}
                  placeholder={FAQ_FALLBACK_ANSWERS[faq.question] || 'Réponse par défaut...'}
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--surface-border)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Laissez vide pour utiliser la réponse suggérée ci-dessus.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Step 5: Personnalité ─────────────────────────────────────────────────── */

function Step5({
  data,
  update,
}: {
  data: OnboardingData
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px',
            letterSpacing: '-0.02em',
          }}
        >
          Personnalité du bot
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Choisissez le ton que votre assistant adoptera
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PERSONALITIES.map((p) => {
          const active = data.botPersonality === p.key
          return (
            <button
              key={p.key}
              onClick={() => update('botPersonality', p.key)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--surface-border)'}`,
                background: active ? 'var(--brand-primary-soft)' : 'var(--surface-0)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: active ? 'var(--brand-primary)' : 'var(--surface-2)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {p.emoji}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {p.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</div>
              </div>
            </button>
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

/* ── Shared Field wrapper ─────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
