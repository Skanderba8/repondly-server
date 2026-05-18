'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Bot, Package, Calendar, HelpCircle, Settings, Sparkles, ArrowRight, Plus } from 'lucide-react'

const C = {
  primary: '#1A56DB',
  accentGreen: '#0EA472',
  accentPurple: '#7C3AED',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  pageBg: '#F2F2F7',
  cardBg: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  borderMid: '#CBD5E1',
  success: '#0EA472',
  error: '#EF4444',
  warning: '#F59E0B',
  depth1: 'rgba(255, 255, 255, 0.92)',
  depth2: 'rgba(255, 255, 255, 0.85)',
  depth3: 'rgba(255, 255, 255, 0.75)',
  glassSuperBlur: 'blur(48px)',
  radiusCard: 16,
  radiusInput: 12,
  radiusPill: 999,
  shadowGlossy: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 32px rgba(30,27,75,0.12), 0 0 0 1px rgba(255,255,255,0.4)',
  glossyGradient: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  borderGlossy: '1px solid rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
  glowPrimary: '0 0 24px rgba(26,86,219,0.3)',
}

type Step = 'basics' | 'faqs' | 'products' | 'services' | 'appointments' | 'persona' | 'review'

interface OnboardingData {
  name: string
  description: string
  businessType: string
  botMode: string
  languages: string[]
  botName: string
  faqs: { question: string; answer: string }[]
  products: { name: string; description: string; price: number; available: boolean }[]
  services: { name: string; description: string; durationMinutes: number; price: number; available: boolean }[]
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }[]
  tone: string
  greetingMessage: string
}

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'basics', label: 'Business Basics', icon: Settings },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'persona', label: 'Bot Persona', icon: Bot },
  { id: 'review', label: 'Review', icon: Check },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    description: '',
    businessType: '',
    botMode: '',
    languages: [],
    botName: '',
    faqs: [{ question: '', answer: '' }],
    products: [],
    services: [],
    schedules: DAY_NAMES.map((_, i) => ({ dayOfWeek: i, openTime: '09:00', closeTime: '18:00', closed: false })),
    tone: '',
    greetingMessage: '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/settings')
      const result = await res.json()
      if (result.success && result.data) {
        setData(prev => ({
          ...prev,
          name: result.data.name || '',
          description: result.data.description || '',
          businessType: result.data.businessType || '',
          botMode: result.data.botMode || '',
          languages: result.data.languages || [],
          botName: result.data.botName || result.data.name || '',
          tone: result.data.tone || '',
          greetingMessage: result.data.greetingMessage || '',
        }))
      }

      // Fetch FAQs
      const faqsRes = await fetch('/api/faqs')
      const faqsResult = await faqsRes.json()
      if (faqsResult.success && faqsResult.data.length > 0) {
        setData(prev => ({ ...prev, faqs: faqsResult.data }))
      }

      // Fetch products
      const productsRes = await fetch('/api/products')
      const productsResult = await productsRes.json()
      if (productsResult.success && productsResult.data.length > 0) {
        setData(prev => ({ ...prev, products: productsResult.data }))
      }

      // Fetch services
      const servicesRes = await fetch('/api/services')
      const servicesResult = await servicesRes.json()
      if (servicesResult.success && servicesResult.data.length > 0) {
        setData(prev => ({ ...prev, services: servicesResult.data }))
      }

      // Fetch schedules
      const schedulesRes = await fetch('/api/schedules')
      const schedulesResult = await schedulesRes.json()
      if (schedulesResult.success && schedulesResult.data.length > 0) {
        setData(prev => ({ ...prev, schedules: schedulesResult.data }))
      }
    } catch (err) {
      setError('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id)
    }
  }

  const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Save business settings
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          businessType: data.businessType,
          botMode: data.botMode,
          languages: data.languages,
          botName: data.botName,
          tone: data.tone,
          greetingMessage: data.greetingMessage,
        }),
      })

      // Save FAQs
      for (const faq of data.faqs) {
        if (faq.question && faq.answer) {
          await fetch('/api/faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(faq),
          })
        }
      }

      // Save products
      for (const product of data.products) {
        if (product.name) {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
          })
        }
      }

      // Save services
      for (const service of data.services) {
        if (service.name) {
          await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service),
          })
        }
      }

      // Save schedules
      for (const schedule of data.schedules) {
        await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedule),
        })
      }

      // Mark onboarding as complete
      await fetch('/api/onboarding/complete', { method: 'POST' })

      // Redirect to settings
      window.location.href = '/dashboard/bot-config'
    } catch (err) {
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return data.name && data.businessType && data.botMode && data.languages.length > 0
      case 'faqs':
        return data.faqs.some(f => f.question && f.answer)
      case 'products':
        if (data.botMode === 'ORDERS' || data.botMode === 'BOTH') {
          return data.products.some(p => p.name)
        }
        return true
      case 'services':
        if (data.botMode === 'APPOINTMENTS' || data.botMode === 'BOTH') {
          return data.services.some(s => s.name)
        }
        return true
      case 'appointments':
        if (data.botMode === 'APPOINTMENTS' || data.botMode === 'BOTH') {
          return data.schedules.some(s => !s.closed)
        }
        return true
      case 'persona':
        return data.tone
      case 'review':
        return true
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Bot size={48} style={{ color: C.primary, marginBottom: 16 }} />
          <p style={{ color: C.textSecondary }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, padding: '28px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: C.glowPrimary, marginBottom: 20,
          }}>
            <Bot size={32} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>
            Configure Your AI Bot
          </h1>
          <p style={{ fontSize: 14, color: C.textSecondary }}>
            Complete these steps to set up your intelligent assistant
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index
            const StepIcon = step.icon

            return (
              <motion.div
                key={step.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCurrentStep(step.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: C.radiusPill,
                  background: isActive ? C.depth2 : C.depth3,
                  backdropFilter: C.glassSuperBlur,
                  color: isActive ? C.primary : C.textSecondary,
                  border: isActive ? C.borderGlossy : '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: 13, fontWeight: isActive ? 600 : 500, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? C.shadowGlossy : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: C.glossyGradient, pointerEvents: 'none', zIndex: 0, borderRadius: C.radiusPill,
                  }} />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isCompleted ? <Check size={14} color={C.success} /> : <StepIcon size={14} />}
                  {step.label}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div style={{
            background: C.depth1,
            backdropFilter: C.glassSuperBlur,
            borderRadius: C.radiusCard,
            padding: '32px',
            border: C.borderGlossy,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 400,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: C.glossyGradient, pointerEvents: 'none', zIndex: 0,
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <AnimatePresence mode="wait">
                {currentStep === 'basics' && <BasicsStep data={data} setData={setData} />}
                {currentStep === 'faqs' && <FAQsStep data={data} setData={setData} />}
                {currentStep === 'products' && <ProductsStep data={data} setData={setData} botMode={data.botMode} setCurrentStep={setCurrentStep} />}
                {currentStep === 'services' && <ServicesStep data={data} setData={setData} botMode={data.botMode} setCurrentStep={setCurrentStep} />}
                {currentStep === 'appointments' && <AppointmentsStep data={data} setData={setData} botMode={data.botMode} setCurrentStep={setCurrentStep} />}
                {currentStep === 'persona' && <PersonaStep data={data} setData={setData} />}
                {currentStep === 'review' && <ReviewStep data={data} />}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, alignItems: 'center' }}>
          <button
            onClick={handleBack}
            disabled={currentStep === 'basics'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: C.radiusPill,
              background: 'transparent', color: C.textSecondary,
              border: `1px solid ${C.borderMid}`, fontSize: 14, fontWeight: 500,
              cursor: currentStep === 'basics' ? 'not-allowed' : 'pointer',
              opacity: currentStep === 'basics' ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {error && (
            <div style={{ color: C.error, fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {currentStep === 'review' ? (
            <button
              onClick={handleSave}
              disabled={saving || !canProceed()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 32px', borderRadius: C.radiusPill,
                background: C.primary, color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving || !canProceed() ? 0.7 : 1,
                boxShadow: C.glowPrimary, transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Saving...' : 'Complete Setup'}
              <Check size={16} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: C.radiusPill,
                background: C.primary, color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 600, cursor: !canProceed() ? 'not-allowed' : 'pointer',
                opacity: !canProceed() ? 0.7 : 1,
                boxShadow: C.glowPrimary, transition: 'all 0.2s ease',
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BasicsStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Business Basics</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Business Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
            placeholder="Your business name"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={data.description}
            onChange={e => setData({ ...data, description: e.target.value })}
            placeholder="Describe your business..."
            rows={3}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1, resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Business Type *
          </label>
          <select
            value={data.businessType}
            onChange={e => setData({ ...data, businessType: e.target.value })}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1, cursor: 'pointer',
            }}
          >
            <option value="">Select...</option>
            <option value="SALON">Salon</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="BOUTIQUE">Boutique</option>
            <option value="CLINIC">Clinic</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Bot Mode *
          </label>
          <select
            value={data.botMode}
            onChange={e => setData({ ...data, botMode: e.target.value })}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1, cursor: 'pointer',
            }}
          >
            <option value="">Select...</option>
            <option value="INFO_ONLY">Information Only</option>
            <option value="ORDERS">Orders</option>
            <option value="APPOINTMENTS">Appointments</option>
            <option value="BOTH">Orders & Appointments</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Languages * (comma separated)
          </label>
          <input
            type="text"
            value={data.languages.join(', ')}
            onChange={e => setData({ ...data, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="e.g., English, French, Arabic"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Bot Name (optional)
          </label>
          <input
            type="text"
            value={data.botName}
            onChange={e => setData({ ...data, botName: e.target.value })}
            placeholder={data.name || 'Your bot name'}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function FAQsStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const addFAQ = () => {
    setData({ ...data, faqs: [...data.faqs, { question: '', answer: '' }] })
  }

  const removeFAQ = (index: number) => {
    setData({ ...data, faqs: data.faqs.filter((_, i) => i !== index) })
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const newFAQs = [...data.faqs]
    newFAQs[index][field] = value
    setData({ ...data, faqs: newFAQs })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>FAQ Entries</h2>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>
        Add frequently asked questions and their answers. Add at least one.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.faqs.map((faq, index) => (
          <div key={index} style={{
            background: C.depth2, borderRadius: C.radiusInput,
            padding: 16, border: C.borderGlossy, position: 'relative',
          }}>
            {data.faqs.length > 1 && (
              <button
                onClick={() => removeFAQ(index)}
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.error, padding: 4,
                }}
              >
                ×
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={faq.question}
                onChange={e => updateFAQ(index, 'question', e.target.value)}
                placeholder="Question"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <textarea
                value={faq.answer}
                onChange={e => updateFAQ(index, 'answer', e.target.value)}
                placeholder="Answer"
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1, resize: 'vertical',
                }}
              />
            </div>
          </div>
        ))}
        <button
          onClick={addFAQ}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: C.radiusInput,
            background: C.depth2, border: `1px dashed ${C.borderMid}`,
            color: C.primary, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>
    </div>
  )
}

function ProductsStep({ data, setData, botMode, setCurrentStep }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; setCurrentStep: (s: Step) => void }) {
  if (botMode !== 'ORDERS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Package size={48} style={{ color: C.textTertiary, marginBottom: 16 }} />
        <p style={{ color: C.textSecondary }}>Products are not needed for your selected bot mode.</p>
        <button
          onClick={() => setCurrentStep('services')}
          style={{
            marginTop: 16, padding: '12px 24px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Skip to Services
        </button>
      </div>
    )
  }

  const addProduct = () => {
    setData({ ...data, products: [...data.products, { name: '', description: '', price: 0, available: true }] })
  }

  const removeProduct = (index: number) => {
    setData({ ...data, products: data.products.filter((_, i) => i !== index) })
  }

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...data.products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setData({ ...data, products: newProducts })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Products</h2>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>
        Add your products with prices. Add at least one.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.products.map((product, index) => (
          <div key={index} style={{
            background: C.depth2, borderRadius: C.radiusInput,
            padding: 16, border: C.borderGlossy, position: 'relative',
          }}>
            <button
              onClick={() => removeProduct(index)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.error, padding: 4,
              }}
            >
              ×
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={product.name}
                onChange={e => updateProduct(index, 'name', e.target.value)}
                placeholder="Product name"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <input
                type="text"
                value={product.description || ''}
                onChange={e => updateProduct(index, 'description', e.target.value)}
                placeholder="Description"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <input
                type="number"
                step="0.01"
                value={product.price}
                onChange={e => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                placeholder="Price (DT)"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary }}>
                <input
                  type="checkbox"
                  checked={product.available}
                  onChange={e => updateProduct(index, 'available', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Available
              </label>
            </div>
          </div>
        ))}
        <button
          onClick={addProduct}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: C.radiusInput,
            background: C.depth2, border: `1px dashed ${C.borderMid}`,
            color: C.primary, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>
    </div>
  )
}

function ServicesStep({ data, setData, botMode, setCurrentStep }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; setCurrentStep: (s: Step) => void }) {
  if (botMode !== 'APPOINTMENTS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Sparkles size={48} style={{ color: C.textTertiary, marginBottom: 16 }} />
        <p style={{ color: C.textSecondary }}>Services are not needed for your selected bot mode.</p>
        <button
          onClick={() => setCurrentStep('persona')}
          style={{
            marginTop: 16, padding: '12px 24px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Skip to Bot Persona
        </button>
      </div>
    )
  }

  const addService = () => {
    setData({ ...data, services: [...data.services, { name: '', description: '', durationMinutes: 30, price: 0, available: true }] })
  }

  const removeService = (index: number) => {
    setData({ ...data, services: data.services.filter((_, i) => i !== index) })
  }

  const updateService = (index: number, field: string, value: any) => {
    const newServices = [...data.services]
    newServices[index] = { ...newServices[index], [field]: value }
    setData({ ...data, services: newServices })
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Services</h2>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>
        Add your services with duration and pricing. Add at least one.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.services.map((service, index) => (
          <div key={index} style={{
            background: C.depth2, borderRadius: C.radiusInput,
            padding: 16, border: C.borderGlossy, position: 'relative',
          }}>
            <button
              onClick={() => removeService(index)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.error, padding: 4,
              }}
            >
              ×
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={service.name}
                onChange={e => updateService(index, 'name', e.target.value)}
                placeholder="Service name"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <input
                type="text"
                value={service.description || ''}
                onChange={e => updateService(index, 'description', e.target.value)}
                placeholder="Description"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                  background: C.depth1,
                }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="number"
                  value={service.durationMinutes}
                  onChange={e => updateService(index, 'durationMinutes', parseInt(e.target.value) || 30)}
                  placeholder="Duration (min)"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: C.radiusInput,
                    border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                    background: C.depth1,
                  }}
                />
                <input
                  type="number"
                  step="0.01"
                  value={service.price}
                  onChange={e => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="Price (DT)"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: C.radiusInput,
                    border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                    background: C.depth1,
                  }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary }}>
                <input
                  type="checkbox"
                  checked={service.available}
                  onChange={e => updateService(index, 'available', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Available
              </label>
            </div>
          </div>
        ))}
        <button
          onClick={addService}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: C.radiusInput,
            background: C.depth2, border: `1px dashed ${C.borderMid}`,
            color: C.primary, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>
    </div>
  )
}

function AppointmentsStep({ data, setData, botMode, setCurrentStep }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; setCurrentStep: (s: Step) => void }) {
  if (botMode !== 'APPOINTMENTS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Calendar size={48} style={{ color: C.textTertiary, marginBottom: 16 }} />
        <p style={{ color: C.textSecondary }}>Appointment scheduling is not needed for your selected bot mode.</p>
        <button
          onClick={() => setCurrentStep('persona')}
          style={{
            marginTop: 16, padding: '12px 24px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Skip to Bot Persona
        </button>
      </div>
    )
  }

  const updateSchedule = (dayOfWeek: number, field: string, value: any) => {
    const newSchedules = [...data.schedules]
    const index = newSchedules.findIndex(s => s.dayOfWeek === dayOfWeek)
    if (index >= 0) {
      newSchedules[index] = { ...newSchedules[index], [field]: value }
      setData({ ...data, schedules: newSchedules })
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Working Hours</h2>
      <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>
        Configure your business hours for each day.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DAY_NAMES.map((day, index) => {
          const schedule = data.schedules.find(s => s.dayOfWeek === index) || { dayOfWeek: index, openTime: '09:00', closeTime: '18:00', closed: false }
          return (
            <div key={index} style={{
              background: C.depth2, borderRadius: C.radiusInput,
              padding: 12, border: C.borderGlossy,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary, minWidth: 100 }}>
                <input
                  type="checkbox"
                  checked={!schedule.closed}
                  onChange={e => updateSchedule(index, 'closed', !e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                {day}
              </label>
              {!schedule.closed && (
                <>
                  <input
                    type="time"
                    value={schedule.openTime}
                    onChange={e => updateSchedule(index, 'openTime', e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: C.radiusInput,
                      border: `1px solid ${C.borderMid}`, fontSize: 13, color: C.textPrimary,
                      background: C.depth1,
                    }}
                  />
                  <span style={{ color: C.textSecondary }}>to</span>
                  <input
                    type="time"
                    value={schedule.closeTime}
                    onChange={e => updateSchedule(index, 'closeTime', e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: C.radiusInput,
                      border: `1px solid ${C.borderMid}`, fontSize: 13, color: C.textPrimary,
                      background: C.depth1,
                    }}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PersonaStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Bot Persona</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Bot Name
          </label>
          <input
            type="text"
            value={data.botName}
            onChange={e => setData({ ...data, botName: e.target.value })}
            placeholder={data.name || 'Your bot name'}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Tone *
          </label>
          <input
            type="text"
            value={data.tone}
            onChange={e => setData({ ...data, tone: e.target.value })}
            placeholder="e.g., Professional, Friendly, Formal"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
            Greeting Message (optional)
          </label>
          <textarea
            value={data.greetingMessage}
            onChange={e => setData({ ...data, greetingMessage: e.target.value })}
            placeholder="e.g., Hello! How can I help you today?"
            rows={3}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: C.radiusInput,
              border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
              background: C.depth1, resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ data }: { data: OnboardingData }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: C.textPrimary, marginBottom: 24 }}>Review Configuration</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Business</h3>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Name:</strong> {data.name}</p>
          {data.description && <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Description:</strong> {data.description}</p>}
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Type:</strong> {data.businessType}</p>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Mode:</strong> {data.botMode}</p>
          <p style={{ fontSize: 13, color: C.textSecondary }}><strong>Languages:</strong> {data.languages.join(', ')}</p>
        </div>

        <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>FAQs</h3>
          {data.faqs.filter(f => f.question && f.answer).length > 0 ? (
            data.faqs.filter(f => f.question && f.answer).map((faq, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}><strong>Q:</strong> {faq.question}</p>
                <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}><strong>A:</strong> {faq.answer}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: C.textTertiary }}>No FAQs configured</p>
          )}
        </div>

        {(data.botMode === 'ORDERS' || data.botMode === 'BOTH') && (
          <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Products</h3>
            {data.products.length > 0 ? (
              data.products.map((p, i) => (
                <p key={i} style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 4px 0' }}>
                  {p.name} - {p.price} DT {p.available ? '' : '(unavailable)'}
                </p>
              ))
            ) : (
              <p style={{ fontSize: 13, color: C.textTertiary }}>No products configured</p>
            )}
          </div>
        )}

        {(data.botMode === 'APPOINTMENTS' || data.botMode === 'BOTH') && (
          <>
            <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Services</h3>
              {data.services.length > 0 ? (
                data.services.map((s, i) => (
                  <p key={i} style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 4px 0' }}>
                    {s.name} - {s.durationMinutes}min - {s.price} DT
                  </p>
                ))
              ) : (
                <p style={{ fontSize: 13, color: C.textTertiary }}>No services configured</p>
              )}
            </div>
            <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Working Hours</h3>
              {data.schedules.filter(s => !s.closed).map((s, i) => (
                <p key={i} style={{ fontSize: 13, color: C.textSecondary, margin: '0 0 4px 0' }}>
                  {DAY_NAMES[s.dayOfWeek]}: {s.openTime} - {s.closeTime}
                </p>
              ))}
            </div>
          </>
        )}

        <div style={{ background: C.depth2, borderRadius: C.radiusInput, padding: 16, border: C.borderGlossy }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8 }}>Bot Persona</h3>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Name:</strong> {data.botName || data.name}</p>
          <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}><strong>Tone:</strong> {data.tone}</p>
          {data.greetingMessage && <p style={{ fontSize: 13, color: C.textSecondary }}><strong>Greeting:</strong> {data.greetingMessage}</p>}
        </div>
      </div>
    </div>
  )
}
