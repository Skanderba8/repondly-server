'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, RefreshCw, CheckCircle, AlertCircle, MessageSquare, Tag, Phone, User } from 'lucide-react'

const C = {
  primary: '#1A56DB',
  accentGreen: '#0EA472',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  pageBg: '#F2F2F7',
  cardBg: '#FFFFFF',
  border: 'rgba(0, 0, 0, 0.08)',
  depth2: 'rgba(255, 255, 255, 0.85)',
  glassSuperBlur: 'blur(48px)',
  radiusCard: 16,
  radiusInput: 12,
  shadowGlossy: 'inset 0 2px 4px rgba(255,255,255,0.6), 0 8px 32px rgba(30,27,75,0.12), 0 0 0 1px rgba(255,255,255,0.4)',
  borderGlossy: '1px solid rgba(255,255,255,0.5), inset 0 0 0 1px rgba(255,255,255,0.2)',
  glossyGradient: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  success: '#0EA472',
  error: '#EF4444',
}

export default function BotSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  
  const [config, setConfig] = useState({
    handoverTriggers: [] as string[],
    collectFields: [] as string[],
    strictInstructionBlock: '',
  })

  const [newTrigger, setNewTrigger] = useState('')
  const [newCollectField, setNewCollectField] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bot-config?businessId=1')
      const data = await res.json()
      if (data.success) {
        setConfig({
          handoverTriggers: data.data.handoverTriggers || [],
          collectFields: data.data.collectFields || [],
          strictInstructionBlock: data.data.strictInstructionBlock || '',
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
      const res = await fetch('/api/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: '1',
          ...config,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Paramètres sauvegardés')
      } else {
        showToast('error', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const addTrigger = () => {
    if (newTrigger.trim()) {
      setConfig({ ...config, handoverTriggers: [...config.handoverTriggers, newTrigger.trim()] })
      setNewTrigger('')
    }
  }

  const removeTrigger = (index: number) => {
    setConfig({ ...config, handoverTriggers: config.handoverTriggers.filter((_, i) => i !== index) })
  }

  const addCollectField = () => {
    if (newCollectField.trim()) {
      setConfig({ ...config, collectFields: [...config.collectFields, newCollectField.trim()] })
      setNewCollectField('')
    }
  }

  const removeCollectField = (index: number) => {
    setConfig({ ...config, collectFields: config.collectFields.filter((_, i) => i !== index) })
  }

  const COLLECT_FIELD_OPTIONS = ['Nom', 'Téléphone', 'Email', 'Service', 'Produit', 'Livraison', 'Localisation', 'Budget', 'Notes']

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
          <Settings size={32} color={C.primary} />
          Paramètres Bot
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary }}>Configuration avancée du comportement du bot</p>
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={18} />
              Mots-clés handover
            </h2>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
              Ces mots déclenchent le transfert vers un humain
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTrigger()}
                placeholder="Ajouter un mot-clé..."
                style={{
                  flex: 1, padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                  background: C.depth2, color: C.textPrimary, fontSize: 14,
                }}
              />
              <button
                onClick={addTrigger}
                style={{
                  padding: '10px 16px', borderRadius: C.radiusInput, background: C.primary,
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                Ajouter
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {config.handoverTriggers.map((trigger, index) => (
                <span key={index} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 20, background: C.primary + '10', color: C.primary, fontSize: 13,
                }}>
                  {trigger}
                  <button
                    onClick={() => removeTrigger(index)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} />
              Champs à collecter
            </h2>
            <p style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
              Informations à collecter pendant la conversation
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select
                value={newCollectField}
                onChange={(e) => setNewCollectField(e.target.value)}
                style={{
                  flex: 1, padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                  background: C.depth2, color: C.textPrimary, fontSize: 14, cursor: 'pointer',
                }}
              >
                <option value="">Sélectionner un champ...</option>
                {COLLECT_FIELD_OPTIONS.filter(opt => !config.collectFields.includes(opt)).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <button
                onClick={addCollectField}
                disabled={!newCollectField}
                style={{
                  padding: '10px 16px', borderRadius: C.radiusInput, background: C.primary,
                  color: '#fff', border: 'none', cursor: newCollectField ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 500, opacity: newCollectField ? 1 : 0.5,
                }}
              >
                Ajouter
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {config.collectFields.map((field, index) => (
                <span key={index} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 20, background: C.accentGreen + '10', color: C.accentGreen, fontSize: 13,
                }}>
                  {field}
                  <button
                    onClick={() => removeCollectField(index)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C.accentGreen, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
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
              Instructions strictes
            </h2>
            <textarea
              value={config.strictInstructionBlock}
              onChange={(e) => setConfig({ ...config, strictInstructionBlock: e.target.value })}
              placeholder="Instructions supplémentaires que le bot doit suivre strictement..."
              rows={4}
              style={{
                width: '100%', padding: '12px', borderRadius: C.radiusInput, border: C.borderGlossy,
                background: C.depth2, color: C.textPrimary, fontSize: 14, resize: 'vertical',
              }}
            />
            <p style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>
              Ces instructions sont ajoutées au prompt système avec la plus haute priorité
            </p>
          </div>
        </motion.div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '14px 24px', borderRadius: C.radiusInput, background: C.primary,
            color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1, marginTop: 8,
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
