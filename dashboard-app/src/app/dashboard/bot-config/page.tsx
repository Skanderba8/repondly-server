'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, Bot, Plus, Edit, Trash2, Save, 
  Package, Calendar, HelpCircle, ChevronRight,
  CheckCircle, AlertCircle, RefreshCw, Webhook, Link2
} from 'lucide-react'

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
  glassUltraBlur: 'blur(64px)',
  radiusCard: 16,
  radiusInput: 12,
  radiusPill: 999,
  shadowGlossy: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 32px rgba(30,27,75,0.12), 0 0 0 1px rgba(255,255,255,0.4)',
  shadowLayered: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(30,27,75,0.1), 0 16px 48px rgba(30,27,75,0.08)',
  blueShadow: '0 8px 32px rgba(30, 27, 75, 0.15)',
  recessed: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  borderGlossy: '1px solid rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
  glossyGradient: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  liquidGradient: 'linear-gradient(135deg, rgba(26,86,219,0.05) 0%, rgba(124,58,237,0.05) 100%)',
  glowPrimary: '0 0 24px rgba(26,86,219,0.3)',
  glowSuccess: '0 0 24px rgba(14,164,114,0.3)',
}

type SubTab = 'general' | 'products' | 'services' | 'schedules' | 'faqs' | 'webhooks'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  available: boolean
}

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  available: boolean
}

interface Schedule {
  id: string
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  closed: boolean
}

interface Faq {
  id: string
  question: string
  answer: string
}

interface BotConfig {
  id: string
  businessType: string | null
  botMode: string | null
  languages: string[]
  tone: string | null
  ownerPhone: string | null
  requiredOrderFields: string[]
  requiredAppointmentFields: string[]
  handoverTriggers: string[]
  collectName: boolean
  collectPhone: boolean
  collectLocation: boolean
}

const TABS = [
  { id: 'general' as SubTab, label: 'Général', icon: <Settings size={16} /> },
  { id: 'products' as SubTab, label: 'Produits', icon: <Package size={16} /> },
  { id: 'services' as SubTab, label: 'Services', icon: <Calendar size={16} /> },
  { id: 'schedules' as SubTab, label: 'Horaires', icon: <Calendar size={16} /> },
  { id: 'faqs' as SubTab, label: 'FAQ', icon: <HelpCircle size={16} /> },
  { id: 'webhooks' as SubTab, label: 'Webhooks', icon: <Webhook size={16} /> },
]

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function BotConfigPage() {
  const [activeTab, setActiveTab] = useState<SubTab>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [showAddFaq, setShowAddFaq] = useState(false)
  const [submittingItem, setSubmittingItem] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<{ bot: boolean; dashboard: boolean } | null>(null)
  const [testingWebhook, setTestingWebhook] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [configRes, productsRes, servicesRes, schedulesRes, faqsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/products'),
        fetch('/api/services'),
        fetch('/api/schedules'),
        fetch('/api/faqs'),
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        if (configData.success) setBotConfig(configData.data)
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
        if (data.success) setProducts(data.data)
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json()
        if (data.success) setServices(data.data)
      }
      if (schedulesRes.ok) {
        const data = await schedulesRes.json()
        if (data.success) setSchedules(data.data)
      }
      if (faqsRes.ok) {
        const data = await faqsRes.json()
        if (data.success) setFaqs(data.data)
      }
    } catch (error) {
      showToast('error', 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'error' | 'success', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSaveConfig = async () => {
    if (!botConfig) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessType: botConfig.businessType,
          botMode: botConfig.botMode,
          languages: botConfig.languages,
          tone: botConfig.tone,
          ownerPhone: botConfig.ownerPhone,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Configuration sauvegardée')
      } else {
        showToast('error', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBotConfig = async (config: Partial<BotConfig>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Configuration du bot sauvegardée')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Produit supprimé')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Service supprimé')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Supprimer cette FAQ ?')) return
    try {
      const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'FAQ supprimée')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      available: formData.get('available') === 'true',
    }
    
    if (!data.name || isNaN(data.price)) {
      showToast('error', 'Veuillez remplir les champs requis')
      return
    }
    
    setSubmittingItem(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await res.json()
      if (responseData.success) {
        showToast('success', 'Produit ajouté')
        setShowAddProduct(false)
        form.reset()
        fetchData()
      } else {
        showToast('error', responseData.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de l\'ajout')
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      durationMinutes: parseInt(formData.get('durationMinutes') as string),
      price: parseFloat(formData.get('price') as string),
      available: formData.get('available') === 'true',
    }
    
    if (!data.name || isNaN(data.durationMinutes) || isNaN(data.price)) {
      showToast('error', 'Veuillez remplir les champs requis')
      return
    }
    
    setSubmittingItem(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await res.json()
      if (responseData.success) {
        showToast('success', 'Service ajouté')
        setShowAddService(false)
        form.reset()
        fetchData()
      } else {
        showToast('error', responseData.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de l\'ajout')
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleAddFaq = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      question: formData.get('question') as string,
      answer: formData.get('answer') as string,
    }
    
    if (!data.question || !data.answer) {
      showToast('error', 'Veuillez remplir les champs requis')
      return
    }
    
    setSubmittingItem(true)
    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await res.json()
      if (responseData.success) {
        showToast('success', 'FAQ ajoutée')
        setShowAddFaq(false)
        form.reset()
        fetchData()
      } else {
        showToast('error', responseData.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de l\'ajout')
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleAddSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
      openTime: formData.get('openTime') as string,
      closeTime: formData.get('closeTime') as string,
      closed: formData.get('closed') === 'true',
    }
    
    if (isNaN(data.dayOfWeek)) {
      showToast('error', 'Veuillez remplir les champs requis')
      return
    }
    
    setSubmittingItem(true)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const responseData = await res.json()
      if (responseData.success) {
        showToast('success', 'Horaire ajouté')
        setShowAddSchedule(false)
        form.reset()
        fetchData()
      } else {
        showToast('error', responseData.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de l\'ajout')
    } finally {
      setSubmittingItem(false)
    }
  }

  const handleTestWebhook = async () => {
    setTestingWebhook(true)
    try {
      const res = await fetch('/api/webhook/test', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setWebhookStatus(data.data)
        showToast('success', 'Webhook test réussi')
      } else {
        showToast('error', data.error || 'Erreur lors du test')
      }
    } catch (error) {
      showToast('error', 'Erreur lors du test')
    } finally {
      setTestingWebhook(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: C.primary }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, padding: '28px 32px' }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            background: C.depth1,
            backdropFilter: C.glassSuperBlur,
            borderRadius: 12,
            border: C.borderGlossy,
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: C.shadowGlossy, zIndex: 9999,
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={16} color={C.error} /> : <CheckCircle size={16} color={C.success} />}
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{toast.msg}</span>
        </motion.div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: C.textPrimary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bot size={32} color={C.primary} />
          Configuration du Bot IA
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary }}>Configurez votre assistant intelligent pour automatiser vos réponses</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: C.radiusPill,
              background: activeTab === tab.id ? C.depth2 : C.depth3,
              backdropFilter: C.glassSuperBlur,
              color: activeTab === tab.id ? C.primary : C.textSecondary,
              border: activeTab === tab.id ? C.borderGlossy : '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 500, cursor: 'pointer',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? C.shadowGlossy : C.recessed,
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id) {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth2 as string
                el.style.boxShadow = C.shadowGlossy as string
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id) {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth3 as string
                el.style.boxShadow = C.recessed as string
              }
            }}
          >
            {activeTab === tab.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
                borderRadius: C.radiusPill,
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {tab.icon}
              {tab.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {activeTab === 'general' && botConfig && (
          <GeneralConfig config={botConfig} setConfig={setBotConfig} onSave={handleSaveConfig} saving={saving} />
        )}
        {activeTab === 'products' && (
          <ProductsList 
            products={products} 
            onRefresh={fetchData}
            onDelete={handleDeleteProduct}
            onAdd={() => setShowAddProduct(true)}
            showAdd={showAddProduct}
            setShowAdd={setShowAddProduct}
            submittingItem={submittingItem}
            handleAdd={handleAddProduct}
          />
        )}
        {activeTab === 'services' && (
          <ServicesList 
            services={services} 
            onRefresh={fetchData}
            onDelete={handleDeleteService}
            onAdd={() => setShowAddService(true)}
            showAdd={showAddService}
            setShowAdd={setShowAddService}
            submittingItem={submittingItem}
            handleAdd={handleAddService}
          />
        )}
        {activeTab === 'schedules' && (
          <SchedulesList 
            schedules={schedules} 
            onRefresh={fetchData}
            onAdd={() => setShowAddSchedule(true)}
            showAdd={showAddSchedule}
            setShowAdd={setShowAddSchedule}
            submittingItem={submittingItem}
            handleAdd={handleAddSchedule}
          />
        )}
        {activeTab === 'faqs' && (
          <FaqsList
            faqs={faqs}
            onRefresh={fetchData}
            onDelete={handleDeleteFaq}
            onAdd={() => setShowAddFaq(true)}
            showAdd={showAddFaq}
            setShowAdd={setShowAddFaq}
            submittingItem={submittingItem}
            handleAdd={handleAddFaq}
          />
        )}
        {activeTab === 'webhooks' && (
          <WebhookStatus status={webhookStatus} onTest={handleTestWebhook} testing={testingWebhook} />
        )}
      </motion.div>
    </div>
  )
}

function GeneralConfig({ config, setConfig, onSave, saving }: { 
  config: BotConfig; 
  setConfig: (c: BotConfig) => void; 
  onSave: () => void; 
  saving: boolean 
}) {
  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} color={C.primary} />
          Configuration Générale
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
              Type d'entreprise
            </label>
            <select
              value={config.businessType || ''}
              onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                background: C.depth1,
                cursor: 'pointer',
              }}
            >
              <option value="">Sélectionner...</option>
              <option value="SALON">Salon</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="BOUTIQUE">Boutique</option>
              <option value="CLINIC">Clinique</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
              Mode du bot
            </label>
            <select
              value={config.botMode || ''}
              onChange={(e) => setConfig({ ...config, botMode: e.target.value })}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                background: C.depth1,
                cursor: 'pointer',
              }}
            >
              <option value="">Sélectionner...</option>
              <option value="INFO_ONLY">Informations uniquement</option>
              <option value="ORDERS">Commandes</option>
              <option value="APPOINTMENTS">Rendez-vous</option>
              <option value="BOTH">Commandes et rendez-vous</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
              Ton du bot
            </label>
            <input
              type="text"
              value={config.tone || ''}
              onChange={(e) => setConfig({ ...config, tone: e.target.value })}
              placeholder="Ex: Professionnel, Amical, Formel..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                background: C.depth1,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.textSecondary, marginBottom: 8 }}>
              Téléphone du propriétaire (pour notifications)
            </label>
            <input
              type="tel"
              value={config.ownerPhone || ''}
              onChange={(e) => setConfig({ ...config, ownerPhone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: C.radiusInput,
                border: `1px solid ${C.borderMid}`, fontSize: 14, color: C.textPrimary,
                background: C.depth1,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                borderRadius: C.radiusPill,
                background: C.primary,
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: C.glowPrimary,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!saving) {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'scale(1.02)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'scale(1)'
              }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductsList({ products, onRefresh, onDelete, onAdd, showAdd, setShowAdd, submittingItem, handleAdd }: { 
  products: Product[]; 
  onRefresh: () => void; 
  onDelete: (id: string) => void
  onAdd: () => void
  showAdd: boolean
  setShowAdd: (show: boolean) => void
  submittingItem: boolean
  handleAdd: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={20} color={C.primary} />
          Produits
        </h2>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: C.glowPrimary,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1)'
          }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: C.depth2,
            backdropFilter: C.glassSuperBlur,
            borderRadius: C.radiusInput,
            padding: '20px',
            marginBottom: 20,
            border: C.borderGlossy,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <form onSubmit={handleAdd} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                name="name"
                placeholder="Nom du produit"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <input
                name="description"
                placeholder="Description"
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Prix (DT)"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary, cursor: 'pointer' }}>
                <input name="available" type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                Disponible
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingItem}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: C.primary,
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submittingItem ? 'not-allowed' : 'pointer',
                    opacity: submittingItem ? 0.7 : 1,
                    boxShadow: C.glowPrimary,
                  }}
                >
                  {submittingItem ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: 'transparent',
                    color: C.textSecondary,
                    border: `1px solid ${C.borderMid}`,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: C.textSecondary,
          background: C.depth3,
          borderRadius: C.radiusInput,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
          Aucun produit configuré
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: C.radiusInput,
                background: C.depth3,
                backdropFilter: C.glassSuperBlur,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: C.blueShadow,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth2 as string
                el.style.boxShadow = C.shadowGlossy as string
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth3 as string
                el.style.boxShadow = C.blueShadow as string
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{product.name}</div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                  {product.description && <span>{product.description} • </span>}
                  {product.price} DT
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {/* TODO: Open edit modal */}}
                  style={{
                    padding: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textSecondary,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.liquidGradient
                    e.currentTarget.style.color = C.primary
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = C.textSecondary
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(product.id)}
                  style={{
                    padding: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textSecondary,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.color = C.error
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = C.textSecondary
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function ServicesList({ services, onRefresh, onDelete, onAdd, showAdd, setShowAdd, submittingItem, handleAdd }: { 
  services: Service[]; 
  onRefresh: () => void; 
  onDelete: (id: string) => void
  onAdd: () => void
  showAdd: boolean
  setShowAdd: (show: boolean) => void
  submittingItem: boolean
  handleAdd: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} color={C.primary} />
          Services
        </h2>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: C.glowPrimary,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1)'
          }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: C.depth2,
            backdropFilter: C.glassSuperBlur,
            borderRadius: C.radiusInput,
            padding: '20px',
            marginBottom: 20,
            border: C.borderGlossy,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <form onSubmit={handleAdd} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                name="name"
                placeholder="Nom du service"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <input
                name="description"
                placeholder="Description"
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <input
                name="durationMinutes"
                type="number"
                placeholder="Durée (minutes)"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <input
                name="price"
                type="number"
                step="0.01"
                placeholder="Prix (DT)"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary, cursor: 'pointer' }}>
                <input name="available" type="checkbox" defaultChecked style={{ cursor: 'pointer' }} />
                Disponible
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingItem}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: C.primary,
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submittingItem ? 'not-allowed' : 'pointer',
                    opacity: submittingItem ? 0.7 : 1,
                    boxShadow: C.glowPrimary,
                  }}
                >
                  {submittingItem ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: 'transparent',
                    color: C.textSecondary,
                    border: `1px solid ${C.borderMid}`,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {services.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: C.textSecondary,
          background: C.depth3,
          borderRadius: C.radiusInput,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
          Aucun service configuré
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {services.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: C.radiusInput,
                background: C.depth3,
                backdropFilter: C.glassSuperBlur,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: C.blueShadow,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth2 as string
                el.style.boxShadow = C.shadowGlossy as string
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth3 as string
                el.style.boxShadow = C.blueShadow as string
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{service.name}</div>
                <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                  {service.description && <span>{service.description} • </span>}
                  {service.durationMinutes} min • {service.price} DT
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {/* TODO: Open edit modal */}}
                  style={{
                    padding: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textSecondary,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.liquidGradient
                    e.currentTarget.style.color = C.primary
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = C.textSecondary
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(service.id)}
                  style={{
                    padding: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textSecondary,
                    borderRadius: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.color = C.error
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none'
                    e.currentTarget.style.color = C.textSecondary
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function SchedulesList({ schedules, onRefresh, onAdd, showAdd, setShowAdd, submittingItem, handleAdd }: { 
  schedules: Schedule[]; 
  onRefresh: () => void
  onAdd: () => void
  showAdd: boolean
  setShowAdd: (show: boolean) => void
  submittingItem: boolean
  handleAdd: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editOpenTime, setEditOpenTime] = useState('')
  const [editCloseTime, setEditCloseTime] = useState('')
  const [editClosed, setEditClosed] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const handleEditSchedule = (dayIndex: number) => {
    const schedule = schedules.find(s => s.dayOfWeek === dayIndex)
    setEditingDay(dayIndex)
    setEditOpenTime(schedule?.openTime || '')
    setEditCloseTime(schedule?.closeTime || '')
    setEditClosed(schedule?.closed || false)
  }

  const handleSaveSchedule = async (dayIndex: number) => {
    setSavingSchedule(true)
    try {
      const existingSchedule = schedules.find(s => s.dayOfWeek === dayIndex)
      
      if (existingSchedule) {
        // Update existing
        const res = await fetch(`/api/schedules/${existingSchedule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openTime: editClosed ? null : editOpenTime || null,
            closeTime: editClosed ? null : editCloseTime || null,
            closed: editClosed,
          }),
        })
        const data = await res.json()
        if (data.success) {
          onRefresh()
          setEditingDay(null)
        }
      } else {
        // Create new
        const res = await fetch('/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayOfWeek: dayIndex,
            openTime: editClosed ? null : editOpenTime || null,
            closeTime: editClosed ? null : editCloseTime || null,
            closed: editClosed,
          }),
        })
        const data = await res.json()
        if (data.success) {
          onRefresh()
          setEditingDay(null)
        }
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setSavingSchedule(false)
    }
  }

  const handleDeleteSchedule = async (dayIndex: number) => {
    const schedule = schedules.find(s => s.dayOfWeek === dayIndex)
    if (!schedule) return
    
    if (!confirm('Supprimer cet horaire ?')) return
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' })
      if (res.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} color={C.primary} />
          Horaires d'ouverture
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DAY_NAMES.map((day, index) => {
          const schedule = schedules.find(s => s.dayOfWeek === index)
          const isEditing = editingDay === index

          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                position: 'relative',
                padding: '16px 20px',
                borderRadius: C.radiusInput,
                background: isEditing ? C.depth2 : C.depth3,
                backdropFilter: C.glassSuperBlur,
                border: isEditing ? C.borderGlossy : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: isEditing ? C.shadowGlossy : C.blueShadow,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isEditing) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = C.depth2 as string
                  el.style.boxShadow = C.shadowGlossy as string
                }
              }}
              onMouseLeave={e => {
                if (!isEditing) {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = C.depth3 as string
                  el.style.boxShadow = C.blueShadow as string
                }
              }}
            >
              {/* Glossy gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }} />

              {isEditing ? (
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, minWidth: 100 }}>{day}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textPrimary }}>
                      <input
                        type="checkbox"
                        checked={editClosed}
                        onChange={(e) => setEditClosed(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      Fermé
                    </label>
                  </div>
                  
                  {!editClosed && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Ouverture</label>
                        <input
                          type="time"
                          value={editOpenTime}
                          onChange={(e) => setEditOpenTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: C.radiusInput,
                            border: `1px solid ${C.borderMid}`,
                            fontSize: 14,
                            background: C.depth1,
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>Fermeture</label>
                        <input
                          type="time"
                          value={editCloseTime}
                          onChange={(e) => setEditCloseTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: C.radiusInput,
                            border: `1px solid ${C.borderMid}`,
                            fontSize: 14,
                            background: C.depth1,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSaveSchedule(index)}
                      disabled={savingSchedule}
                      style={{
                        padding: '8px 16px',
                        borderRadius: C.radiusPill,
                        background: C.primary,
                        color: '#fff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: savingSchedule ? 'not-allowed' : 'pointer',
                        opacity: savingSchedule ? 0.7 : 1,
                        boxShadow: C.glowPrimary,
                      }}
                    >
                      {savingSchedule ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button
                      onClick={() => setEditingDay(null)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: C.radiusPill,
                        background: 'transparent',
                        color: C.textSecondary,
                        border: `1px solid ${C.borderMid}`,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, minWidth: 100 }}>{day}</span>
                    {schedule?.closed ? (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.textTertiary,
                        background: C.depth3,
                        padding: '4px 10px',
                        borderRadius: C.radiusPill,
                      }}>
                        Fermé
                      </span>
                    ) : schedule?.openTime && schedule?.closeTime ? (
                      <span style={{
                        fontSize: 13,
                        color: C.success,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: C.success,
                          boxShadow: '0 0 8px rgba(14, 164, 114, 0.4)',
                        }} />
                        {schedule.openTime} - {schedule.closeTime}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 13,
                        color: C.textTertiary,
                        fontStyle: 'italic',
                      }}>
                        Non configuré
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEditSchedule(index)}
                      style={{
                        padding: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: C.textSecondary,
                        borderRadius: 6,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = C.liquidGradient
                        e.currentTarget.style.color = C.primary
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'none'
                        e.currentTarget.style.color = C.textSecondary
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    {schedule && (
                      <button
                        onClick={() => handleDeleteSchedule(index)}
                        style={{
                          padding: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: C.textSecondary,
                          borderRadius: 6,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          e.currentTarget.style.color = C.error
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'none'
                          e.currentTarget.style.color = C.textSecondary
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function FaqsList({ faqs, onRefresh, onDelete, onAdd, showAdd, setShowAdd, submittingItem, handleAdd }: { 
  faqs: Faq[]; 
  onRefresh: () => void; 
  onDelete: (id: string) => void
  onAdd: () => void
  showAdd: boolean
  setShowAdd: (show: boolean) => void
  submittingItem: boolean
  handleAdd: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={20} color={C.primary} />
          FAQ
        </h2>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: C.radiusPill,
            background: C.primary, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: C.glowPrimary,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.transform = 'scale(1)'
          }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: C.depth2,
            backdropFilter: C.glassSuperBlur,
            borderRadius: C.radiusInput,
            padding: '20px',
            marginBottom: 20,
            border: C.borderGlossy,
            boxShadow: C.shadowGlossy,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: C.glossyGradient,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <form onSubmit={handleAdd} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                name="question"
                placeholder="Question"
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                }}
              />
              <textarea
                name="answer"
                placeholder="Réponse"
                required
                rows={3}
                style={{
                  padding: '10px 14px',
                  borderRadius: C.radiusInput,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 14,
                  background: C.depth1,
                  color: C.textPrimary,
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submittingItem}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: C.primary,
                    color: '#fff',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submittingItem ? 'not-allowed' : 'pointer',
                    opacity: submittingItem ? 0.7 : 1,
                    boxShadow: C.glowPrimary,
                  }}
                >
                  {submittingItem ? 'Ajout...' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: C.radiusPill,
                    background: 'transparent',
                    color: C.textSecondary,
                    border: `1px solid ${C.borderMid}`,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {faqs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: C.textSecondary,
          background: C.depth3,
          borderRadius: C.radiusInput,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}>
          Aucune FAQ configurée
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq) => (
            <motion.div
              key={faq.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                position: 'relative',
                padding: '16px 20px',
                borderRadius: C.radiusInput,
                background: C.depth3,
                backdropFilter: C.glassSuperBlur,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: C.blueShadow,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth2 as string
                el.style.boxShadow = C.shadowGlossy as string
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = C.depth3 as string
                el.style.boxShadow = C.blueShadow as string
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: C.glossyGradient,
                pointerEvents: 'none',
                zIndex: 0,
              }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{faq.question}</span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => {/* TODO: Open edit modal */}}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: C.textSecondary,
                      borderRadius: 6,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = C.liquidGradient
                      e.currentTarget.style.color = C.primary
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.color = C.textSecondary
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(faq.id)}
                    style={{
                      padding: 6,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: C.textSecondary,
                      borderRadius: 6,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      e.currentTarget.style.color = C.error
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.color = C.textSecondary
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 1.5 }}>{faq.answer}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function WebhookStatus({ status, onTest, testing }: { 
  status: { bot: boolean; dashboard: boolean } | null
  onTest: () => void
  testing: boolean
}) {
  return (
    <div style={{
      background: C.depth1,
      backdropFilter: C.glassSuperBlur,
      borderRadius: C.radiusCard,
      padding: '24px',
      border: C.borderGlossy,
      boxShadow: C.shadowGlossy,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: C.glossyGradient,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Webhook size={20} color={C.primary} />
            Configuration des Webhooks
          </h2>
          <button
            onClick={onTest}
            disabled={testing}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: C.radiusPill,
              background: C.primary, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: testing ? 'not-allowed' : 'pointer',
              opacity: testing ? 0.7 : 1,
              boxShadow: C.glowPrimary,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!testing) {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'scale(1.02)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'scale(1)'
            }}
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
            {testing ? 'Test en cours...' : 'Tester les webhooks'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Bot Webhook */}
          <div style={{
            padding: '20px',
            borderRadius: C.radiusInput,
            background: C.depth3,
            backdropFilter: C.glassSuperBlur,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: C.blueShadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(26, 86, 219, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.primary,
              }}>
                <Bot size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>Bot Webhook</h3>
                <div style={{ fontSize: 13, color: C.textSecondary, fontFamily: 'monospace' }}>
                  https://app.repondly.com/chatwoot-webhook
                </div>
              </div>
              {status?.bot !== null && status?.bot !== undefined && (
                <div style={{
                  padding: '6px 12px', borderRadius: C.radiusPill,
                  background: status.bot ? 'rgba(14, 164, 114, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: status.bot ? C.success : C.error,
                  fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {status.bot ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {status.bot ? 'Actif' : 'Inactif'}
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
              Ce webhook reçoit les événements Chatwoot pour le traitement par le bot IA.
              Configurez-le dans Chatwoot Admin → Settings → Integrations → Webhooks
            </p>
          </div>

          {/* Dashboard Webhook */}
          <div style={{
            padding: '20px',
            borderRadius: C.radiusInput,
            background: C.depth3,
            backdropFilter: C.glassSuperBlur,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: C.blueShadow,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(124, 58, 237, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.accentPurple,
              }}>
                <Link2 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>Dashboard Webhook</h3>
                <div style={{ fontSize: 13, color: C.textSecondary, fontFamily: 'monospace' }}>
                  https://app.repondly.com/api/chatwoot/webhook
                </div>
              </div>
              {status?.dashboard !== null && status?.dashboard !== undefined && (
                <div style={{
                  padding: '6px 12px', borderRadius: C.radiusPill,
                  background: status.dashboard ? 'rgba(14, 164, 114, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: status.dashboard ? C.success : C.error,
                  fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {status.dashboard ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {status.dashboard ? 'Actif' : 'Inactif'}
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: 0 }}>
              Ce webhook reçoit les événements Chatwoot pour les mises à jour en temps réel du dashboard (SSE).
              Configurez-le dans Chatwoot Admin → Settings → Integrations → Webhooks
            </p>
          </div>

          {/* Configuration Instructions */}
          <div style={{
            padding: '16px',
            borderRadius: C.radiusInput,
            background: 'rgba(14, 164, 114, 0.05)',
            border: '1px solid rgba(14, 164, 114, 0.2)',
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={16} color={C.accentGreen} />
              Configuration dans Chatwoot
            </h4>
            <ol style={{ fontSize: 13, color: C.textSecondary, margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
              <li>Allez sur <a href="https://inbox.repondly.com" target="_blank" rel="noopener noreferrer" style={{ color: C.primary, textDecoration: 'underline' }}>inbox.repondly.com</a></li>
              <li>Navigation: Settings → Integrations → Webhooks</li>
              <li>Ajoutez les deux webhooks avec le secret: <code style={{ background: C.depth3, padding: '2px 6px', borderRadius: 4 }}>EMGWH2BzRjKjyrEXATbjBwpt</code></li>
              <li>Événements à sélectionner: message_created, conversation_created, conversation_status_changed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
