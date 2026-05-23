'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, Globe, Phone, MessageSquare } from 'lucide-react'

const C = {
  primary: '#1A56DB',
  accentGreen: '#0EA472',
  accentPurple: '#7C3AED',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  pageBg: '#F2F2F7',
  cardBg: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  success: '#0EA472',
  error: '#EF4444',
  depth2: 'rgba(255, 255, 255, 0.85)',
  glassSuperBlur: 'blur(48px)',
  radiusCard: 16,
  radiusInput: 12,
  shadowGlossy: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 32px rgba(30,27,75,0.12), 0 0 0 1px rgba(255,255,255,0.4)',
  borderGlossy: '1px solid rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
  glossyGradient: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
}

export default function MonBotPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  
  const [config, setConfig] = useState({
    botActive: true,
    defaultLanguage: 'FR' as 'FR' | 'AR' | 'DARIJA',
    handoverPhone: '',
    botName: '',
    greetingMessage: '',
    systemPrompt: '',
    lastGeneratedAt: null as Date | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bot-config-full?businessId=1')
      const data = await res.json()
      if (data.success) {
        setConfig({
          botActive: data.data.botConfig?.botActive ?? true,
          defaultLanguage: data.data.botConfig?.defaultLanguage ?? 'FR',
          handoverPhone: data.data.botConfig?.handoverPhone ?? '',
          botName: data.data.business?.botName ?? '',
          greetingMessage: data.data.business?.greetingMessage ?? '',
          systemPrompt: data.data.botConfig?.systemPrompt ?? '',
          lastGeneratedAt: data.data.botConfig?.lastGeneratedAt ?? null,
        })
      }
    } catch (error) {
      showToast('error', 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'error' | 'success', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/bot-config-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            id: '1',
            botName: config.botName,
            greetingMessage: config.greetingMessage,
          },
          botConfig: {
            businessId: '1',
            botActive: config.botActive,
            defaultLanguage: config.defaultLanguage,
            handoverPhone: config.handoverPhone,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Configuration sauvegardée')
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

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/regenerate-prompt/1', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Prompt régénéré')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la régénération')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la régénération')
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.pageBg }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: C.primary }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.pageBg, padding: '28px 32px' }}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: 12,
            border: C.borderGlossy, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: C.shadowGlossy, zIndex: 9999,
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={16} color={C.error} /> : <CheckCircle size={16} color={C.success} />}
          <span style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{toast.msg}</span>
        </motion.div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: C.textPrimary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bot size={32} color={C.primary} />
          Mon Bot
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary }}>Configurez votre assistant intelligent</p>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary }}>Statut du bot</h2>
              <button
                onClick={() => setConfig({ ...config, botActive: !config.botActive })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                  borderRadius: 20, border: `1px solid ${config.botActive ? C.success : C.error}`,
                  background: config.botActive ? C.success + '10' : C.error + '10',
                  color: config.botActive ? C.success : C.error, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {config.botActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {config.botActive ? 'Actif' : 'Inactif'}
              </button>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary }}>
              {config.botActive ? 'Votre bot répond automatiquement aux clients.' : 'Le bot ne répondra pas aux messages.'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>Langue par défaut</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['FR', 'AR', 'DARIJA'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setConfig({ ...config, defaultLanguage: lang })}
                  style={{
                    flex: 1, padding: '12px', borderRadius: C.radiusInput, border: C.borderGlossy,
                    background: config.defaultLanguage === lang ? C.primary : C.depth2,
                    color: config.defaultLanguage === lang ? '#fff' : C.textPrimary,
                    cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500,
                  }}
                >
                  {lang === 'FR' ? 'Français' : lang === 'AR' ? 'Arabe' : 'Darija'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>
              <Phone size={18} style={{ display: 'inline', marginRight: 8 }} />
              Téléphone handover
            </h2>
            <input
              type="tel"
              value={config.handoverPhone}
              onChange={(e) => setConfig({ ...config, handoverPhone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              style={{
                width: '100%', padding: '12px', borderRadius: C.radiusInput, border: C.borderGlossy,
                background: C.depth2, color: C.textPrimary, fontSize: 14,
              }}
            />
            <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>
              Numéro WhatsApp pour notifications handover
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>
              <MessageSquare size={18} style={{ display: 'inline', marginRight: 8 }} />
              Nom du bot
            </h2>
            <input
              type="text"
              value={config.botName}
              onChange={(e) => setConfig({ ...config, botName: e.target.value })}
              placeholder="Ex: Assistant Répondly"
              style={{
                width: '100%', padding: '12px', borderRadius: C.radiusInput, border: C.borderGlossy,
                background: C.depth2, color: C.textPrimary, fontSize: 14,
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>
              Message d'accueil
            </h2>
            <textarea
              value={config.greetingMessage}
              onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
              placeholder="Ex: Bonjour ! Comment puis-je vous aider aujourd'hui ?"
              rows={3}
              style={{
                width: '100%', padding: '12px', borderRadius: C.radiusInput, border: C.borderGlossy,
                background: C.depth2, color: C.textPrimary, fontSize: 14, resize: 'vertical',
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: C.depth2, backdropFilter: C.glassSuperBlur, borderRadius: C.radiusCard,
            boxShadow: C.shadowGlossy, border: C.borderGlossy, padding: 24, position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: C.glossyGradient, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} />
                Prompt système
                {config.lastGeneratedAt && (
                  <span style={{ fontSize: 11, color: C.success, background: C.success + '10', padding: '2px 8px', borderRadius: 10 }}>
                    À jour
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: C.borderGlossy, background: C.depth2, color: C.textPrimary, cursor: 'pointer', fontSize: 12 }}
              >
                {showPrompt ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPrompt ? 'Masquer' : 'Voir'}
              </button>
            </div>
            {showPrompt && (
              <div style={{ background: C.depth2, padding: 12, borderRadius: 8, fontSize: 12, color: C.textSecondary, maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {config.systemPrompt || 'Aucun prompt généré'}
              </div>
            )}
          </div>
        </motion.div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '14px 24px', borderRadius: C.radiusInput, background: C.primary,
              color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            style={{
              padding: '14px 24px', borderRadius: C.radiusInput, background: C.depth2,
              color: C.textPrimary, border: C.borderGlossy, cursor: regenerating ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s', opacity: regenerating ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {regenerating ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Régénérer
          </button>
        </div>
      </div>
    </div>
  )
}
