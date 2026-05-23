'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Store, Clock, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

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

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function MonCommercePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [showAddException, setShowAddException] = useState(false)
  
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
  })
  
  const [schedules, setSchedules] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  
  const [newException, setNewException] = useState({
    label: '',
    startDate: '',
    endDate: '',
    closedAllDay: false,
    openTime: '',
    closeTime: '',
    customMessage: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [configRes, schedulesRes, exceptionsRes] = await Promise.all([
        fetch('/api/bot-config-full?businessId=1'),
        fetch('/api/schedules'),
        fetch('/api/schedule-exceptions?businessId=1'),
      ])

      const configData = await configRes.json()
      const schedulesData = await schedulesRes.json()
      const exceptionsData = await exceptionsRes.json()

      if (configData.success) {
        setBusinessInfo({
          name: configData.data.business?.name || '',
          description: configData.data.business?.description || '',
          phone: configData.data.business?.phone || '',
          address: configData.data.business?.address || '',
        })
      }
      if (schedulesData.success) setSchedules(schedulesData.data)
      if (exceptionsData.success) setExceptions(exceptionsData.data)
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

  const handleSaveBusiness = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/bot-config-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business: {
            id: '1',
            name: businessInfo.name,
            description: businessInfo.description,
            phone: businessInfo.phone,
            address: businessInfo.address,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Informations sauvegardées')
      } else {
        showToast('error', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/schedule-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: '1',
          ...newException,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Exception ajoutée')
        setShowAddException(false)
        setNewException({ label: '', startDate: '', endDate: '', closedAllDay: false, openTime: '', closeTime: '', customMessage: '' })
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteException = async (id: string) => {
    if (!confirm('Supprimer cette exception ?')) return
    try {
      const res = await fetch(`/api/schedule-exceptions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Exception supprimée')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la suppression')
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
          <Store size={32} color={C.primary} />
          Mon Commerce
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary }}>Informations sur votre entreprise et horaires</p>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>Informations entreprise</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  style={{
                    width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                    background: C.depth2, color: C.textPrimary, fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Description</label>
                <textarea
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                    background: C.depth2, color: C.textPrimary, fontSize: 14, resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Téléphone</label>
                  <input
                    type="tel"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                      background: C.depth2, color: C.textPrimary, fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Adresse</label>
                  <input
                    type="text"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                      background: C.depth2, color: C.textPrimary, fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveBusiness}
              disabled={saving}
              style={{
                marginTop: 16, padding: '10px 20px', borderRadius: C.radiusInput, background: C.primary,
                color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} />
                Horaires réguliers
              </h2>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {DAY_NAMES.map((day, idx) => {
                const schedule = schedules.find(s => s.dayOfWeek === idx)
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: C.depth2 }}>
                    <span style={{ width: 80, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{day}</span>
                    {schedule?.closed ? (
                      <span style={{ fontSize: 13, color: C.textSecondary }}>Fermé</span>
                    ) : (
                      <span style={{ fontSize: 13, color: C.textPrimary }}>
                        {schedule?.openTime} - {schedule?.closeTime}
                      </span>
                    )}
                  </div>
                )
              })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} />
                Exceptions horaires
              </h2>
              <button
                onClick={() => setShowAddException(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  borderRadius: C.radiusInput, background: C.primary, color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                <Plus size={14} />
                Ajouter
              </button>
            </div>
            {exceptions.length === 0 ? (
              <p style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', padding: 20 }}>
                Aucune exception horaire
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {exceptions.map((exc) => (
                  <div key={exc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: 8, background: C.depth2 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>{exc.label}</div>
                      <div style={{ fontSize: 12, color: C.textSecondary }}>
                        {new Date(exc.startDate).toLocaleDateString('fr-FR')} - {new Date(exc.endDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteException(exc.id)}
                      style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.error }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {showAddException && (
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
              <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>Nouvelle exception</h2>
              <form onSubmit={handleAddException}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Label *</label>
                    <input
                      type="text"
                      value={newException.label}
                      onChange={(e) => setNewException({ ...newException, label: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                        background: C.depth2, color: C.textPrimary, fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Date début *</label>
                      <input
                        type="date"
                        value={newException.startDate}
                        onChange={(e) => setNewException({ ...newException, startDate: e.target.value })}
                        required
                        style={{
                          width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                          background: C.depth2, color: C.textPrimary, fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Date fin *</label>
                      <input
                        type="date"
                        value={newException.endDate}
                        onChange={(e) => setNewException({ ...newException, endDate: e.target.value })}
                        required
                        style={{
                          width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                          background: C.depth2, color: C.textPrimary, fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={newException.closedAllDay}
                      onChange={(e) => setNewException({ ...newException, closedAllDay: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: 13, color: C.textPrimary }}>Fermé toute la journée</label>
                  </div>
                  {!newException.closedAllDay && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }} >Heure ouverture</label>
                        <input
                          type="time"
                          value={newException.openTime}
                          onChange={(e) => setNewException({ ...newException, openTime: e.target.value })}
                          style={{
                            width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                            background: C.depth2, color: C.textPrimary, fontSize: 14,
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Heure fermeture</label>
                        <input
                          type="time"
                          value={newException.closeTime}
                          onChange={(e) => setNewException({ ...newException, closeTime: e.target.value })}
                          style={{
                            width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                            background: C.depth2, color: C.textPrimary, fontSize: 14,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Message personnalisé</label>
                    <input
                      type="text"
                      value={newException.customMessage}
                      onChange={(e) => setNewException({ ...newException, customMessage: e.target.value })}
                      placeholder="Ex: Fermé pour vacances"
                      style={{
                        width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                        background: C.depth2, color: C.textPrimary, fontSize: 14,
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1, padding: '10px 20px', borderRadius: C.radiusInput, background: C.primary,
                      color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? 'Ajout...' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddException(false)}
                    style={{
                      padding: '10px 20px', borderRadius: C.radiusInput, background: C.depth2,
                      color: C.textPrimary, border: C.borderGlossy, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
