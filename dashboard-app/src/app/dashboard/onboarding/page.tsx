'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronRight, ChevronLeft, Check, Bot, Package, Calendar, HelpCircle, Settings, Sparkles, ArrowRight, Plus, Globe, Send, X, Loader2, Image as ImageIcon, Languages, RotateCcw, CheckCircle, ChevronDown } from 'lucide-react'

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
  products: { name: string; description: string; price: number; available: boolean; photos: string[] }[]
  services: { name: string; description: string; durationMinutes: number; price: number; available: boolean }[]
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; closed: boolean }[]
  tone: string
  greetingMessage: string
  address: string
  phone: string
  email: string
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

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const TRANSLATIONS = {
  fr: {
    title: 'Configurer votre bot IA',
    subtitle: 'Complétez ces étapes pour configurer votre assistant intelligent',
    steps: {
      basics: 'Informations de base',
      faqs: 'FAQ',
      products: 'Produits',
      services: 'Services',
      appointments: 'Rendez-vous',
      persona: 'Persona du bot',
      review: 'Révision'
    },
    buttons: {
      back: 'Retour',
      next: 'Suivant',
      complete: 'Terminer la configuration',
      saving: 'Enregistrement...',
      skip: 'Passer'
    },
    labels: {
      businessName: 'Nom de l\'entreprise *',
      description: 'Description',
      businessType: 'Type d\'entreprise *',
      botMode: 'Mode du bot *',
      languages: 'Langues *',
      tone: 'Ton *',
      greeting: 'Message de bienvenue',
      botName: 'Nom du bot',
      address: 'Adresse',
      phone: 'Téléphone',
      email: 'Email'
    },
    placeholders: {
      businessName: 'Nom de votre entreprise',
      description: 'Décrivez votre entreprise...',
      tone: 'Ex: Professionnel, Amical, Formel',
      address: 'Votre adresse',
      phone: '+216 XX XXX XXX',
      email: 'votre@email.com'
    },
    faqs: {
      description: 'Ajoutez des questions fréquentes et leurs réponses. Ajoutez au moins une.',
      question: 'Question',
      answer: 'Réponse',
      add: 'Ajouter une FAQ',
      quickFill: 'Remplissage rapide',
      quickFillDesc: 'Remplissez vos informations de contact pour les utiliser automatiquement dans les FAQs.'
    },
    loading: 'Chargement...',
    select: 'Sélectionner...',
    businessTypes: {
      SALON: 'Salon',
      RESTAURANT: 'Restaurant',
      BOUTIQUE: 'Boutique',
      CLINIC: 'Clinique',
      OTHER: 'Autre'
    },
    botModes: {
      INFO_ONLY: 'Informations uniquement',
      ORDERS: 'Commandes',
      APPOINTMENTS: 'Rendez-vous',
      BOTH: 'Commandes et rendez-vous'
    },
    tones: {
      professional: 'Professionnel',
      friendly: 'Amical',
      formal: 'Formel',
      casual: 'Décontracté',
      warm: 'Chaleureux',
      direct: 'Direct'
    }
  },
  ar: {
    title: 'تكوين البوت الخاص بك',
    subtitle: 'أكمل هذه الخطوات لإعداد المساعد الذكي الخاص بك',
    steps: {
      basics: 'المعلومات الأساسية',
      faqs: 'الأسئلة الشائعة',
      products: 'المنتجات',
      services: 'الخدمات',
      appointments: 'المواعيد',
      persona: 'شخصية البوت',
      review: 'مراجعة'
    },
    buttons: {
      back: 'رجوع',
      next: 'التالي',
      complete: 'إنهاء الإعداد',
      saving: 'جاري الحفظ...',
      skip: 'تخطي'
    },
    labels: {
      businessName: 'اسم الشركة *',
      description: 'الوصف',
      businessType: 'نوع الشركة *',
      botMode: 'وضع البوت *',
      languages: 'اللغات *',
      tone: 'النبرة *',
      greeting: 'رسالة الترحيب',
      botName: 'اسم البوت',
      address: 'العنوان',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني'
    },
    placeholders: {
      businessName: 'اسم شركتك',
      description: 'صف شركتك...',
      tone: 'مثال: احترافي، ودود، رسمي',
      address: 'عنوانك',
      phone: '+216 XX XXX XXX',
      email: 'بريدك@الإلكتروني.com'
    },
    faqs: {
      description: 'أضف الأسئلة الشائعة وإجاباتها. أضف سؤالاً واحداً على الأقل.',
      question: 'السؤال',
      answer: 'الإجابة',
      add: 'إضافة سؤال شائع',
      quickFill: 'ملء سريع',
      quickFillDesc: 'املأ معلومات الاتصال الخاصة بك لاستخدامها تلقائياً في الأسئلة الشائعة.'
    },
    loading: 'جاري التحميل...',
    select: 'اختر...',
    businessTypes: {
      SALON: 'صالون',
      RESTAURANT: 'مطعم',
      BOUTIQUE: 'متجر',
      CLINIC: 'عيادة',
      OTHER: 'أخرى'
    },
    botModes: {
      INFO_ONLY: 'معلومات فقط',
      ORDERS: 'الطلبات',
      APPOINTMENTS: 'المواعيد',
      BOTH: 'الطلبات والمواعيد'
    },
    tones: {
      professional: 'احترافي',
      friendly: 'ودود',
      formal: 'رسمي',
      casual: 'غير رسمي',
      warm: 'دافئ',
      direct: 'مباشر'
    }
  },
  en: {
    title: 'Configure Your AI Bot',
    subtitle: 'Complete these steps to set up your intelligent assistant',
    steps: {
      basics: 'Business Basics',
      faqs: 'FAQs',
      products: 'Products',
      services: 'Services',
      appointments: 'Appointments',
      persona: 'Bot Persona',
      review: 'Review'
    },
    buttons: {
      back: 'Back',
      next: 'Next',
      complete: 'Complete Setup',
      saving: 'Saving...',
      skip: 'Skip'
    },
    labels: {
      businessName: 'Business Name *',
      description: 'Description',
      businessType: 'Business Type *',
      botMode: 'Bot Mode *',
      languages: 'Languages *',
      tone: 'Tone *',
      greeting: 'Greeting Message',
      botName: 'Bot Name',
      address: 'Address',
      phone: 'Phone',
      email: 'Email'
    },
    placeholders: {
      businessName: 'Your business name',
      description: 'Describe your business...',
      tone: 'e.g., Professional, Friendly, Formal',
      address: 'Your address',
      phone: '+216 XX XXX XXX',
      email: 'your@email.com'
    },
    faqs: {
      description: 'Add frequently asked questions and their answers. Add at least one.',
      question: 'Question',
      answer: 'Answer',
      add: 'Add FAQ',
      quickFill: 'Quick Fill',
      quickFillDesc: 'Fill in your contact information to use it automatically in FAQs.'
    },
    loading: 'Loading...',
    select: 'Select...',
    businessTypes: {
      SALON: 'Salon',
      RESTAURANT: 'Restaurant',
      BOUTIQUE: 'Boutique',
      CLINIC: 'Clinic',
      OTHER: 'Other'
    },
    botModes: {
      INFO_ONLY: 'Information Only',
      ORDERS: 'Orders',
      APPOINTMENTS: 'Appointments',
      BOTH: 'Orders & Appointments'
    },
    tones: {
      professional: 'Professional',
      friendly: 'Friendly',
      formal: 'Formal',
      casual: 'Casual',
      warm: 'Warm',
      direct: 'Direct'
    }
  }
}

const STANDARD_FAQS = [
  { question: 'What are your business hours?', answer: 'We are open from 9 AM to 6 PM, Monday to Saturday.' },
  { question: 'Where are you located?', answer: 'We are located at [your address]. Visit us or contact us for directions.' },
  { question: 'What payment methods do you accept?', answer: 'We accept cash, credit cards, and mobile payments.' },
  { question: 'Do you offer delivery?', answer: 'Yes, we offer delivery services. Contact us for more details.' },
  { question: 'How can I contact you?', answer: 'You can reach us by phone at [your number] or email us at [your email].' },
  { question: 'What is your return policy?', answer: 'Returns are accepted within 14 days with original receipt.' },
  { question: 'Do you offer discounts?', answer: 'We occasionally offer special promotions. Follow us for updates.' },
  { question: 'How long does service take?', answer: 'Service time varies depending on the request. Contact us for an estimate.' },
  { question: 'Do I need to book in advance?', answer: 'For appointments, booking in advance is recommended. Walk-ins are welcome when available.' },
  { question: 'What makes your business unique?', answer: 'We pride ourselves on quality service, customer satisfaction, and attention to detail.' }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en'>('fr')
  const [testBotOpen, setTestBotOpen] = useState(false)
  const [testMessages, setTestMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([])
  const [testInput, setTestInput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [capturedData, setCapturedData] = useState<any>(null)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    description: '',
    businessType: '',
    botMode: '',
    languages: ['fr', 'ar'], // Pre-select Arabic and French
    botName: '',
    faqs: [...STANDARD_FAQS],
    products: [],
    services: [],
    schedules: DAY_NAMES.map((_, i) => ({ dayOfWeek: i, openTime: '09:00', closeTime: '18:00', closed: false })),
    tone: '',
    greetingMessage: '',
    address: '',
    phone: '',
    email: '',
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
          address: result.data.address || '',
          phone: result.data.phone || '',
          email: result.data.email || '',
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
        setData(prev => ({ ...prev, products: productsResult.data.map((p: any) => ({ ...p, photos: p.photos || [] })) }))
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
      setError(TRANSLATIONS[language].loading)
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
          address: data.address,
          phone: data.phone,
          email: data.email,
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
        // Boutique always needs products regardless of botMode
        if (data.businessType === 'BOUTIQUE' || data.botMode === 'ORDERS' || data.botMode === 'BOTH') {
          return data.products.some(p => p.name)
        }
        return true
      case 'services':
        // Boutique skips services
        if (data.businessType === 'BOUTIQUE') return true
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

  const handleTestMessage = async () => {
    if (!testInput.trim() || testLoading) return
    
    setTestLoading(true)
    const userMessage = testInput
    setTestInput('')
    setTestMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      // Filter out unfilled items before generating prompt
      const filteredData = {
        ...data,
        faqs: data.faqs.filter(f => f.question && f.answer),
        products: data.products.filter(p => p.name),
        services: data.services.filter(s => s.name),
      }
      
      // Generate system prompt from filtered data
      const systemPrompt = generateSystemPrompt(filteredData, language)
      
      const res = await fetch('/api/bot/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'test-onboarding',
          message: userMessage,
          systemPrompt,
        }),
      })
      
      if (res.ok) {
        const result = await res.json()
        const botReply = result.reply || 'Sorry, I could not process that.'
        setTestMessages(prev => [...prev, { role: 'bot', content: botReply }])
        
        // Check for captured data
        if (result.action && result.action.data) {
          setCapturedData(result.action.data)
        }
      } else {
        setTestMessages(prev => [...prev, { role: 'bot', content: 'Sorry, the bot service is not available.' }])
      }
    } catch (err) {
      setTestMessages(prev => [...prev, { role: 'bot', content: 'Sorry, could not connect to the bot service.' }])
    } finally {
      setTestLoading(false)
    }
  }

  const generateSystemPrompt = (businessData: OnboardingData, lang: 'fr' | 'ar' | 'en') => {
    let prompt = `You are ${businessData.botName || businessData.name}, an AI assistant for ${businessData.name}, a ${businessData.businessType || 'business'}.`
    if (businessData.description) prompt += `\n\nBusiness Description: ${businessData.description}`
    if (businessData.tone) prompt += `\n\nTone: ${businessData.tone}`
    prompt += `\n\nLanguages: ${businessData.languages.join(', ')}. Respond in the customer's language when possible.`
    if (businessData.greetingMessage) prompt += `\n\nGreeting Message: ${businessData.greetingMessage}`
    
    if (businessData.products.length > 0) {
      prompt += `\n\nProducts:\n`
      businessData.products.forEach(p => {
        prompt += `- ${p.name}`
        if (p.description) prompt += `: ${p.description}`
        prompt += ` (${p.price} DT)\n`
      })
    }
    
    if (businessData.services.length > 0) {
      prompt += `\n\nServices:\n`
      businessData.services.forEach(s => {
        prompt += `- ${s.name}`
        if (s.description) prompt += `: ${s.description}`
        prompt += ` (${s.durationMinutes} min, ${s.price} DT)\n`
      })
    }
    
    if (businessData.faqs.length > 0) {
      prompt += `\n\nFAQs:\n`
      businessData.faqs.forEach(f => {
        if (f.question && f.answer) {
          prompt += `Q: ${f.question}\nA: ${f.answer}\n\n`
        }
      })
    }
    
    return prompt
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Bot size={48} style={{ color: C.primary, marginBottom: 16 }} />
          <p style={{ color: C.textSecondary }}>{TRANSLATIONS[language].loading}</p>
        </div>
      </div>
    )
  }

  const t = TRANSLATIONS[language]
  const isRTL = language === 'ar'

  // Filter steps based on business type
  const visibleSteps = STEPS.filter(step => {
    if (step.id === 'services' && data.businessType === 'BOUTIQUE') return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', direction: isRTL ? 'rtl' : 'ltr', position: 'relative' }}>
      {/* Background Pattern */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 10% 10%, rgba(26,86,219,0.03) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(26,86,219,0.02) 0%, transparent 40%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      {/* Slim Topbar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#ffffff',
        borderBottom: '1px solid #E5E7EB',
        padding: '10px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>
              Répondly<span style={{ color: '#1A56DB' }}>.</span>
            </span>
          </div>
          
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as 'fr' | 'ar' | 'en')}
              style={{
                padding: '8px 32px 8px 14px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#ffffff',
                color: '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                appearance: 'none',
                minWidth: 120,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <Globe size={14} style={{
              position: 'absolute',
              right: isRTL ? 'auto' : 10,
              left: isRTL ? 10 : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#1A56DB',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 20, padding: '16px 24px', position: 'relative', zIndex: 1 }}>
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {visibleSteps.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = visibleSteps.findIndex(s => s.id === currentStep) > index
              const StepIcon = step.icon
              const stepLabel = t.steps[step.id as keyof typeof t.steps] || step.label

              // Skip services step for boutique
              if (step.id === 'services' && data.businessType === 'BOUTIQUE') return null

              return (
                <motion.div
                  key={step.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setCurrentStep(step.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 6,
                    background: isActive ? '#1A56DB' : '#ffffff',
                    color: isActive ? '#ffffff' : '#6B7280',
                    border: isActive ? '1px solid #1A56DB' : '1px solid #E5E7EB',
                    fontSize: 12, fontWeight: isActive ? 500 : 400, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(26,86,219,0.25)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCompleted ? <Check size={12} color={isActive ? '#ffffff' : '#10B981'} /> : <StepIcon size={12} color={isActive ? '#ffffff' : '#6B7280'} />}
                    {stepLabel}
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
              background: '#ffffff',
              borderRadius: 8,
              padding: '24px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              minHeight: 400,
              position: 'relative',
            }}>
              {/* Blue accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #1A56DB 0%, #3B82F6 100%)',
                borderRadius: '8px 8px 0 0',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                  {currentStep === 'basics' && <BasicsStep data={data} setData={setData} language={language} />}
                  {currentStep === 'faqs' && <FAQsStep data={data} setData={setData} language={language} />}
                  {currentStep === 'products' && <ProductsStep data={data} setData={setData} botMode={data.botMode} businessType={data.businessType} setCurrentStep={setCurrentStep} language={language} />}
                  {currentStep === 'services' && data.businessType !== 'BOUTIQUE' && <ServicesStep data={data} setData={setData} botMode={data.botMode} setCurrentStep={setCurrentStep} language={language} />}
                  {currentStep === 'appointments' && <AppointmentsStep data={data} setData={setData} botMode={data.botMode} setCurrentStep={setCurrentStep} language={language} />}
                  {currentStep === 'persona' && <PersonaStep data={data} setData={setData} language={language} />}
                  {currentStep === 'review' && <ReviewStep data={data} language={language} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
            <button
              onClick={handleBack}
              disabled={currentStep === 'basics'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 6,
                background: '#ffffff', color: '#374151',
                border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 500,
                cursor: currentStep === 'basics' ? 'not-allowed' : 'pointer',
                opacity: currentStep === 'basics' ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (currentStep !== 'basics') (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ffffff'}
            >
              {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              {t.buttons.back}
            </button>

            {error && (
              <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 500, background: '#FEF2F2', padding: '6px 12px', borderRadius: 4 }}>
                {error}
              </div>
            )}

            {currentStep === 'review' ? (
              <button
                onClick={handleSave}
                disabled={saving || !canProceed()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', borderRadius: 6,
                  background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)', color: '#ffffff', border: 'none',
                  fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving || !canProceed() ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
                }}
                onMouseEnter={e => { if (!saving && canProceed()) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }
              >
                {saving ? t.buttons.saving : t.buttons.complete}
                <Check size={14} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 6,
                  background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)', color: '#ffffff', border: 'none',
                  fontSize: 13, fontWeight: 500, cursor: !canProceed() ? 'not-allowed' : 'pointer',
                  opacity: !canProceed() ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
                }}
                onMouseEnter={e => { if (canProceed()) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }
              >
                {t.buttons.next}
                {isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Test Bot Window */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            position: 'sticky',
            top: 56,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 72px)',
          }}>
            {/* Blue accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #1A56DB 0%, #3B82F6 100%)',
              zIndex: 2,
            }} />
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F9FAFB',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={14} style={{ color: '#ffffff' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Test Bot</span>
              </div>
              <button
                onClick={() => { setTestMessages([]); setCapturedData(null) }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: 6,
                  borderRadius: 4,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F3F4F6' }}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ffffff' }
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {testMessages.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: 12,
                  padding: '32px 16px',
                }}>
                  <Bot size={24} style={{ color: '#1A56DB', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  Test your bot with the current configuration
                </div>
              )}
              {testMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start'),
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)' : '#EFF6FF',
                    color: msg.role === 'user' ? '#ffffff' : '#1A56DB',
                    fontSize: 12,
                    lineHeight: 1.4,
                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(26,86,219,0.25)' : 'none',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div style={{
                  display: 'flex',
                  justifyContent: isRTL ? 'flex-start' : 'flex-end',
                }}>
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#EFF6FF',
                    color: '#1A56DB',
                  }}>
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Captured Data Popup */}
            <AnimatePresence>
              {capturedData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    padding: '10px 16px',
                    borderTop: '1px solid #E5E7EB',
                    background: '#ECFDF5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <CheckCircle size={14} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#10B981' }}>Data Saved</span>
                    <button
                      onClick={() => setCapturedData(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6B7280',
                        padding: 2,
                        marginLeft: 'auto',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.4 }}>
                    {Object.entries(capturedData).map(([key, value]: [string, any]) => (
                      <div key={key} style={{ marginBottom: 1 }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #E5E7EB',
              background: '#F9FAFB',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTestMessage()}
                  placeholder="Type a message..."
                  disabled={testLoading}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #E5E7EB',
                    background: '#ffffff',
                    color: '#111827',
                    fontSize: 12,
                  }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
                />
                <button
                  onClick={handleTestMessage}
                  disabled={testLoading || !testInput.trim()}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: testLoading || !testInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: testLoading || !testInput.trim() ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
                  }}
                >
                  {testLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasicsStep({ data, setData, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const LANGUAGES = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [langDropdownOpen])
  
  const toggleLanguage = (langCode: string) => {
    if (data.languages.includes(langCode)) {
      if (data.languages.length > 1) {
        setData({ ...data, languages: data.languages.filter(l => l !== langCode) })
      }
    } else {
      setData({ ...data, languages: [...data.languages, langCode] })
    }
  }
  
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.basics}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.businessName}
          </label>
          <input
            type="text"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
            placeholder={t.placeholders.businessName}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.description}
          </label>
          <textarea
            value={data.description}
            onChange={e => setData({ ...data, description: e.target.value })}
            placeholder={t.placeholders.description}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff', resize: 'vertical',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.businessType}
          </label>
          <select
            value={data.businessType}
            onChange={e => setData({ ...data, businessType: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff', cursor: 'pointer',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          >
            <option value="">{t.select}</option>
            <option value="SALON">{t.businessTypes.SALON}</option>
            <option value="RESTAURANT">{t.businessTypes.RESTAURANT}</option>
            <option value="BOUTIQUE">{t.businessTypes.BOUTIQUE}</option>
            <option value="CLINIC">{t.businessTypes.CLINIC}</option>
            <option value="OTHER">{t.businessTypes.OTHER}</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.botMode}
          </label>
          <select
            value={data.botMode}
            onChange={e => setData({ ...data, botMode: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff', cursor: 'pointer',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          >
            <option value="">{t.select}</option>
            <option value="INFO_ONLY">{t.botModes.INFO_ONLY}</option>
            <option value="ORDERS">{t.botModes.ORDERS}</option>
            <option value="APPOINTMENTS">{t.botModes.APPOINTMENTS}</option>
            <option value="BOTH">{t.botModes.BOTH}</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.languages}
          </label>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 6,
                border: langDropdownOpen ? '1px solid #1A56DB' : '1px solid #E5E7EB',
                fontSize: 13, color: '#111827',
                background: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 40,
              }}
            >
              <span style={{ color: data.languages.length === 0 ? '#9CA3AF' : '#111827' }}>
                {data.languages.length === 0 ? t.select : data.languages.map(l => LANGUAGES.find(lang => lang.code === l)?.label).join(', ')}
              </span>
              <ChevronDown size={14} style={{ color: '#6B7280', transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>
            
            {langDropdownOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: 4,
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                zIndex: 10,
              }}>
                {LANGUAGES.map(lang => (
                  <div
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#ffffff'}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={data.languages.includes(lang.code)}
                        onChange={() => {}}
                        onClick={(e) => { e.stopPropagation(); toggleLanguage(lang.code) }}
                        style={{
                          width: 16, height: 16,
                          cursor: 'pointer',
                          accentColor: '#1A56DB',
                        }}
                      />
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.address}
          </label>
          <input
            type="text"
            value={data.address}
            onChange={e => setData({ ...data, address: e.target.value })}
            placeholder={t.placeholders.address}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.phone}
          </label>
          <input
            type="text"
            value={data.phone}
            onChange={e => setData({ ...data, phone: e.target.value })}
            placeholder={t.placeholders.phone}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.email}
          </label>
          <input
            type="email"
            value={data.email}
            onChange={e => setData({ ...data, email: e.target.value })}
            placeholder={t.placeholders.email}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>
      </div>
    </div>
  )
}

function FAQsStep({ data, setData, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
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

  const autoFillFAQs = () => {
    const newFAQs = data.faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer
        .replace('[your address]', data.address || '[your address]')
        .replace('[your number]', data.phone || '[your number]')
        .replace('[your email]', data.email || '[your email]')
    }))
    setData({ ...data, faqs: newFAQs })
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.faqs}</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        {t.faqs.description}
      </p>
      
      {/* Quick Fill Section */}
      <div style={{
        background: '#EFF6FF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        border: '1px solid #BFDBFE',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', margin: 0 }}>
            {t.faqs.quickFill}
          </h3>
          <button
            onClick={autoFillFAQs}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: '#1A56DB',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            Auto-Fill FAQs
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#3B82F6', margin: 0 }}>
          {t.faqs.quickFillDesc}
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#1E40AF' }}>
          <span><strong>Address:</strong> {data.address || 'Not set'}</span>
          <span><strong>Phone:</strong> {data.phone || 'Not set'}</span>
          <span><strong>Email:</strong> {data.email || 'Not set'}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.faqs.map((faq, index) => (
          <div key={index} style={{
            background: '#ffffff', borderRadius: 8,
            padding: 16, border: '1px solid #E5E7EB', position: 'relative',
          }}>
            <button
              onClick={() => removeFAQ(index)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#EF4444', padding: 6, borderRadius: 4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <X size={16} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={faq.question}
                onChange={e => updateFAQ(index, 'question', e.target.value)}
                placeholder={t.faqs.question}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <textarea
                value={faq.answer}
                onChange={e => updateFAQ(index, 'answer', e.target.value)}
                placeholder={t.faqs.answer}
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff', resize: 'vertical',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>
        ))}
        <button
          onClick={addFAQ}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 6,
            background: '#ffffff', border: '1px dashed #E5E7EB',
            color: '#1A56DB', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
        >
          <Plus size={16} />
          {t.faqs.add}
        </button>
      </div>
    </div>
  )
}

function ProductsStep({ data, setData, botMode, businessType, setCurrentStep, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; businessType: string; setCurrentStep: (s: Step) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
  // Boutique always shows products, others only if ORDERS or BOTH
  if (businessType !== 'BOUTIQUE' && botMode !== 'ORDERS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Package size={48} style={{ color: '#9CA3AF', marginBottom: 16 }} />
        <p style={{ color: '#6B7280' }}>Les produits ne sont pas nécessaires pour votre mode de bot sélectionné.</p>
        <button
          onClick={() => setCurrentStep('services')}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 6,
            background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
          }}
        >
          {t.buttons.skip}
        </button>
      </div>
    )
  }

  const addProduct = () => {
    setData({ ...data, products: [...data.products, { name: '', description: '', price: 0, available: true, photos: [] }] })
  }

  const removeProduct = (index: number) => {
    setData({ ...data, products: data.products.filter((_, i) => i !== index) })
  }

  const updateProduct = (index: number, field: string, value: any) => {
    const newProducts = [...data.products]
    newProducts[index] = { ...newProducts[index], [field]: value }
    setData({ ...data, products: newProducts })
  }

  const addPhoto = (productIndex: number) => {
    const newProducts = [...data.products]
    newProducts[productIndex] = { ...newProducts[productIndex], photos: [...newProducts[productIndex].photos, ''] }
    setData({ ...data, products: newProducts })
  }

  const removePhoto = (productIndex: number, photoIndex: number) => {
    const newProducts = [...data.products]
    newProducts[productIndex] = { ...newProducts[productIndex], photos: newProducts[productIndex].photos.filter((_, i) => i !== photoIndex) }
    setData({ ...data, products: newProducts })
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.products}</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Ajoutez vos produits avec leurs prix. Ajoutez au moins un.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.products.map((product, index) => (
          <div key={index} style={{
            background: '#ffffff', borderRadius: 8,
            padding: 16, border: '1px solid #E5E7EB', position: 'relative',
          }}>
            <button
              onClick={() => removeProduct(index)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#EF4444', padding: 6, borderRadius: 4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <X size={16} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={product.name}
                onChange={e => updateProduct(index, 'name', e.target.value)}
                placeholder="Nom du produit"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <textarea
                value={product.description || ''}
                onChange={e => updateProduct(index, 'description', e.target.value)}
                placeholder="Description"
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff', resize: 'vertical',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <input
                type="number"
                step="0.01"
                value={product.price}
                onChange={e => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                placeholder="Prix (DT)"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#111827' }}>
                <input
                  type="checkbox"
                  checked={product.available}
                  onChange={e => updateProduct(index, 'available', e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#1A56DB' }}
                />
                Disponible
              </label>
              {/* Photo placeholders */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 8 }}>
                  Photos
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.photos.map((photo, photoIndex) => (
                    <div key={photoIndex} style={{
                      width: 80, height: 80,
                      borderRadius: 6,
                      border: '1px dashed #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      background: '#F9FAFB',
                    }}>
                      <button
                        onClick={() => removePhoto(index, photoIndex)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: '#EF4444', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 20, height: 20, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                      <ImageIcon size={24} style={{ color: '#9CA3AF' }} />
                    </div>
                  ))}
                  <button
                    onClick={() => addPhoto(index)}
                    style={{
                      width: 80, height: 80,
                      borderRadius: 6,
                      border: '1px dashed #1A56DB',
                      background: 'rgba(26, 86, 219, 0.05)',
                      color: '#1A56DB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26, 86, 219, 0.05)'}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addProduct}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 6,
            background: '#ffffff', border: '1px dashed #E5E7EB',
            color: '#1A56DB', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
        >
          <Plus size={16} />
          Ajouter un produit
        </button>
      </div>
    </div>
  )
}

function ServicesStep({ data, setData, botMode, setCurrentStep, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; setCurrentStep: (s: Step) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
  if (botMode !== 'APPOINTMENTS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Sparkles size={48} style={{ color: '#9CA3AF', marginBottom: 16 }} />
        <p style={{ color: '#6B7280' }}>Les services ne sont pas nécessaires pour votre mode de bot sélectionné.</p>
        <button
          onClick={() => setCurrentStep('persona')}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 6,
            background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
          }}
        >
          {t.buttons.skip}
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
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.services}</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Ajoutez vos services avec durée et tarification. Ajoutez au moins un.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.services.map((service, index) => (
          <div key={index} style={{
            background: '#ffffff', borderRadius: 8,
            padding: 16, border: '1px solid #E5E7EB', position: 'relative',
          }}>
            <button
              onClick={() => removeService(index)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#EF4444', padding: 6, borderRadius: 4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <X size={16} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={service.name}
                onChange={e => updateService(index, 'name', e.target.value)}
                placeholder="Nom du service"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <input
                type="text"
                value={service.description || ''}
                onChange={e => updateService(index, 'description', e.target.value)}
                placeholder="Description"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                  background: '#ffffff',
                }}
                onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="number"
                  value={service.durationMinutes}
                  onChange={e => updateService(index, 'durationMinutes', parseInt(e.target.value) || 30)}
                  placeholder="Durée (min)"
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 6,
                    border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                    background: '#ffffff',
                  }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
                />
                <input
                  type="number"
                  step="0.01"
                  value={service.price}
                  onChange={e => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="Prix (DT)"
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 6,
                    border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                    background: '#ffffff',
                  }}
                  onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
                  onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#111827' }}>
                <input
                  type="checkbox"
                  checked={service.available}
                  onChange={e => updateService(index, 'available', e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#1A56DB' }}
                />
                Disponible
              </label>
            </div>
          </div>
        ))}
        <button
          onClick={addService}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 6,
            background: '#ffffff', border: '1px dashed #E5E7EB',
            color: '#1A56DB', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
        >
          <Plus size={16} />
          Ajouter un service
        </button>
      </div>
    </div>
  )
}

function AppointmentsStep({ data, setData, botMode, setCurrentStep, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; botMode: string; setCurrentStep: (s: Step) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
  if (botMode !== 'APPOINTMENTS' && botMode !== 'BOTH') {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Calendar size={48} style={{ color: '#9CA3AF', marginBottom: 16 }} />
        <p style={{ color: '#6B7280' }}>La planification des rendez-vous n'est pas nécessaire pour votre mode de bot sélectionné.</p>
        <button
          onClick={() => setCurrentStep('persona')}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 6,
            background: 'linear-gradient(135deg, #1A56DB 0%, #3B82F6 100%)', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,86,219,0.25)',
          }}
        >
          {t.buttons.skip}
        </button>
      </div>
    )
  }

  const updateSchedule = (dayIndex: number, field: 'openTime' | 'closeTime' | 'closed', value: any) => {
    const newSchedules = [...data.schedules]
    newSchedules[dayIndex] = { ...newSchedules[dayIndex], [field]: value }
    setData({ ...data, schedules: newSchedules })
  }

  const copyToAllDays = (sourceIndex: number) => {
    const sourceSchedule = data.schedules[sourceIndex]
    const newSchedules = data.schedules.map((schedule, index) => 
      index === sourceIndex ? schedule : { ...sourceSchedule, dayOfWeek: index }
    )
    setData({ ...data, schedules: newSchedules })
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return [
      `${hour}:00`,
      `${hour}:15`,
      `${hour}:30`,
      `${hour}:45`
    ]
  }).flat()

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.appointments}</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Définissez vos horaires d'ouverture pour chaque jour de la semaine.
      </p>
      
      {/* Quick Actions */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <button
          onClick={() => copyToAllDays(0)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            color: '#1A56DB',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
        >
          Copy Monday to all days
        </button>
        <button
          onClick={() => {
            const newSchedules = data.schedules.map(s => ({ ...s, closed: false }))
            setData({ ...data, schedules: newSchedules })
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            color: '#1A56DB',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
        >
          Open all days
        </button>
      </div>
      <div style={{
        background: '#ffffff',
        borderRadius: 8,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr 1fr 80px',
          padding: '12px 16px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          fontSize: 12,
          fontWeight: 500,
          color: '#6B7280',
        }}>
          <div>Jour</div>
          <div>Ouverture</div>
          <div>Fermeture</div>
          <div>Fermé</div>
        </div>
        
        {/* Table Rows */}
        {data.schedules.map((schedule, index) => (
          <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr 80px',
            padding: '12px 16px',
            borderBottom: index < data.schedules.length - 1 ? '1px solid #F3F4F6' : 'none',
            alignItems: 'center',
            fontSize: 13,
            background: schedule.closed ? '#FEF2F2' : '#ffffff',
            transition: 'background 0.15s ease',
          }}>
            <div style={{ fontWeight: 500, color: schedule.closed ? '#991B1B' : '#111827' }}>
              {DAY_NAMES[index]}
            </div>
            <div>
              <select
                value={schedule.closed ? '' : schedule.openTime}
                onChange={e => updateSchedule(index, 'openTime', e.target.value)}
                disabled={schedule.closed}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: schedule.closed ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
                  fontSize: 12,
                  color: '#111827',
                  background: schedule.closed ? '#FEE2E2' : '#ffffff',
                  cursor: 'pointer',
                  opacity: schedule.closed ? 0.5 : 1,
                }}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={schedule.closed ? '' : schedule.closeTime}
                onChange={e => updateSchedule(index, 'closeTime', e.target.value)}
                disabled={schedule.closed}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: schedule.closed ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
                  fontSize: 12,
                  color: '#111827',
                  background: schedule.closed ? '#FEE2E2' : '#ffffff',
                  cursor: 'pointer',
                  opacity: schedule.closed ? 0.5 : 1,
                }}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={schedule.closed}
                  onChange={e => updateSchedule(index, 'closed', e.target.checked)}
                  style={{
                    cursor: 'pointer',
                    accentColor: '#DC2626',
                    width: 16,
                    height: 16,
                  }}
                />
                <span style={{ fontSize: 11, color: schedule.closed ? '#991B1B' : '#6B7280' }}>
                  {schedule.closed ? 'Closed' : 'Open'}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonaStep({ data, setData, language }: { data: OnboardingData; setData: (d: OnboardingData) => void; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
  const toneOptions = [
    { id: 'professional', label: t.tones.professional, desc: 'Formel et professionnel' },
    { id: 'friendly', label: t.tones.friendly, desc: 'Chaleureux et accessible' },
    { id: 'formal', label: t.tones.formal, desc: 'Strictement professionnel' },
    { id: 'casual', label: t.tones.casual, desc: 'Détendu et informel' },
    { id: 'warm', label: t.tones.warm, desc: 'Bienveillant et empathique' },
    { id: 'direct', label: t.tones.direct, desc: 'Aller droit au but' },
  ]
  
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.persona}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.botName}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={data.botName}
              onChange={e => setData({ ...data, botName: e.target.value })}
              placeholder={data.name || 'Nom du bot'}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 6,
                border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
                background: '#ffffff',
              }}
              onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
              onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
            />
            <button
              onClick={() => setData({ ...data, botName: data.name })}
              disabled={!data.name}
              style={{
                padding: '10px 16px', borderRadius: 6,
                background: 'transparent',
                border: '1px solid #E5E7EB',
                color: '#1A56DB',
                fontSize: 13, fontWeight: 500,
                cursor: data.name ? 'pointer' : 'not-allowed',
                opacity: data.name ? 1 : 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              Utiliser le nom de l'entreprise
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.tone}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {toneOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setData({ ...data, tone: option.id })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  background: data.tone === option.id ? '#1A56DB' : '#ffffff',
                  color: data.tone === option.id ? '#ffffff' : '#111827',
                  border: data.tone === option.id ? 'none' : '1px solid #E5E7EB',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: data.tone === option.id ? '0 2px 8px rgba(26,86,219,0.25)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>
            {t.labels.greeting}
          </label>
          <textarea
            value={data.greetingMessage}
            onChange={e => setData({ ...data, greetingMessage: e.target.value })}
            placeholder="Comment votre bot doit-il saluer les clients ?"
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
              background: '#ffffff', resize: 'vertical',
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = '#1A56DB'}
            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ data, language }: { data: OnboardingData; language: 'fr' | 'ar' | 'en' }) {
  const t = TRANSLATIONS[language]
  
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>{t.steps.review}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Entreprise</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Nom:</strong> {data.name}</p>
          {data.description && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Description:</strong> {data.description}</p>}
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Type:</strong> {t.businessTypes[data.businessType as keyof typeof t.businessTypes] || data.businessType}</p>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Mode:</strong> {t.botModes[data.botMode as keyof typeof t.botModes] || data.botMode}</p>
          <p style={{ fontSize: 13, color: '#6B7280' }}><strong>Langues:</strong> {data.languages.join(', ')}</p>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>FAQs</h3>
          {data.faqs.filter(f => f.question && f.answer).length > 0 ? (
            data.faqs.filter(f => f.question && f.answer).map((faq, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}><strong>Q:</strong> {faq.question}</p>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}><strong>R:</strong> {faq.answer}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucune FAQ configurée</p>
          )}
        </div>

        {(data.businessType === 'BOUTIQUE' || data.botMode === 'ORDERS' || data.botMode === 'BOTH') && (
          <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Produits</h3>
            {data.products.filter(p => p.name).length > 0 ? (
              data.products.filter(p => p.name).map((p, i) => (
                <p key={i} style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>
                  {p.name} - {p.price} DT {p.available ? '' : '(indisponible)'}
                </p>
              ))
            ) : (
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun produit configuré</p>
            )}
          </div>
        )}

        {(data.businessType !== 'BOUTIQUE' && (data.botMode === 'APPOINTMENTS' || data.botMode === 'BOTH')) && (
          <>
            <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Services</h3>
              {data.services.filter(s => s.name).length > 0 ? (
                data.services.filter(s => s.name).map((s, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>
                    {s.name} - {s.durationMinutes}min - {s.price} DT
                  </p>
                ))
              ) : (
                <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun service configuré</p>
              )}
            </div>
            <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Horaires</h3>
              {data.schedules.filter(s => !s.closed).map((s, i) => (
                <p key={i} style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>
                  {DAY_NAMES[s.dayOfWeek]}: {s.openTime} - {s.closeTime}
                </p>
              ))}
            </div>
          </>
        )}

        <div style={{ background: '#ffffff', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Personnalité du bot</h3>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Nom:</strong> {data.botName || data.name}</p>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}><strong>Ton:</strong> {t.tones[data.tone as keyof typeof t.tones] || data.tone}</p>
          {data.greetingMessage && <p style={{ fontSize: 13, color: '#6B7280' }}><strong>Message de bienvenue:</strong> {data.greetingMessage}</p>}
        </div>
      </div>
    </div>
  )
}
