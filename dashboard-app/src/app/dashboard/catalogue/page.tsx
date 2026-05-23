'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle, Edit2, Eye, EyeOff, DollarSign } from 'lucide-react'

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

export default function CataloguePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    outOfStock: false,
    deliveryFee: '',
    visible: true,
    durationMinutes: '',
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const endpoint = activeTab === 'products' ? '/api/products' : '/api/services'
      const res = await fetch(endpoint)
      const data = await res.json()
      if (data.success) {
        if (activeTab === 'products') {
          setProducts(data.data)
        } else {
          setServices(data.data)
        }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const endpoint = activeTab === 'products' ? '/api/products' : '/api/services'
      const payload = {
        businessId: '1',
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        available: formData.available,
        outOfStock: formData.outOfStock,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : null,
        visible: formData.visible,
        ...(activeTab === 'services' && { durationMinutes: parseInt(formData.durationMinutes) }),
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', editingItem ? 'Élément mis à jour' : 'Élément ajouté')
        setShowAddForm(false)
        setEditingItem(null)
        setFormData({ name: '', description: '', price: '', available: true, outOfStock: false, deliveryFee: '', visible: true, durationMinutes: '' })
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

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet élément ?')) return
    try {
      const endpoint = activeTab === 'products' ? `/api/products/${id}` : `/api/services/${id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        showToast('success', 'Élément supprimé')
        fetchData()
      } else {
        showToast('error', data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      showToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      available: item.available,
      outOfStock: item.outOfStock || false,
      deliveryFee: item.deliveryFee?.toString() || '',
      visible: item.visible !== undefined ? item.visible : true,
      durationMinutes: item.durationMinutes?.toString() || '',
    })
    setShowAddForm(true)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.pageBg }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: C.primary }} />
      </div>
    )
  }

  const items = activeTab === 'products' ? products : services

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
          <Package size={32} color={C.primary} />
          Catalogue
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary }}>Gérez vos produits et services</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, background: C.depth2, padding: 4, borderRadius: C.radiusInput, width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === 'products' ? C.primary : 'transparent',
              color: activeTab === 'products' ? '#fff' : C.textPrimary,
              fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            Produits
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === 'services' ? C.primary : 'transparent',
              color: activeTab === 'services' ? '#fff' : C.textPrimary,
              fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
            }}
          >
            Services
          </button>
        </div>
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary }}>
              {activeTab === 'products' ? 'Mes produits' : 'Mes services'}
            </h2>
            <button
              onClick={() => { setShowAddForm(true); setEditingItem(null); setFormData({ name: '', description: '', price: '', available: true, outOfStock: false, deliveryFee: '', visible: true, durationMinutes: '' }) }}
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

          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textSecondary, textAlign: 'center', padding: 40 }}>
              Aucun{activeTab === 'products' ? ' produit' : ' service'} pour le moment
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 12, background: C.depth2 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary }}>{item.name}</span>
                      {!item.visible && <EyeOff size={12} color={C.textSecondary} />}
                      {item.outOfStock && <span style={{ fontSize: 10, color: C.error, background: C.error + '10', padding: '2px 6px', borderRadius: 4 }}>RUPTURE</span>}
                    </div>
                    {item.description && <p style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>{item.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: C.textPrimary }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <DollarSign size={12} />
                        {item.price} DT
                      </span>
                      {item.deliveryFee && (
                        <span style={{ fontSize: 11, color: C.textSecondary }}>
                          + {item.deliveryFee} DT livraison
                        </span>
                      )}
                      {activeTab === 'services' && item.durationMinutes && (
                        <span style={{ fontSize: 11, color: C.textSecondary }}>
                          {item.durationMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.primary }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: C.error }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {showAddForm && (
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
            <h2 style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 16 }}>
              {editingItem ? 'Modifier' : 'Nouveau'} {activeTab === 'products' ? 'produit' : 'service'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                      background: C.depth2, color: C.textPrimary, fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                      background: C.depth2, color: C.textPrimary, fontSize: 14, resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Prix (DT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      style={{
                        width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                        background: C.depth2, color: C.textPrimary, fontSize: 14,
                      }}
                    />
                  </div>
                  {activeTab === 'services' && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Durée (min) *</label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                        required
                        style={{
                          width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                          background: C.depth2, color: C.textPrimary, fontSize: 14,
                        }}
                      />
                    </div>
                  )}
                  {activeTab === 'products' && (
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary, marginBottom: 4, display: 'block' }}>Frais livraison (DT)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                        style={{
                          width: '100%', padding: '10px', borderRadius: C.radiusInput, border: C.borderGlossy,
                          background: C.depth2, color: C.textPrimary, fontSize: 14,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                    <span style={{ fontSize: 13, color: C.textPrimary }}>Disponible</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.outOfStock}
                      onChange={(e) => setFormData({ ...formData, outOfStock: e.target.checked })}
                    />
                    <span style={{ fontSize: 13, color: C.textPrimary }}>Rupture de stock</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.visible}
                      onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    />
                    <span style={{ fontSize: 13, color: C.textPrimary }}>Visible</span>
                  </label>
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
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingItem(null) }}
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
  )
}
