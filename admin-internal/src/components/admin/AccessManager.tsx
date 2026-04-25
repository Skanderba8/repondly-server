'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, Eye, EyeOff, UserX, UserCheck } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

type AdminUser = {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AccessManager() {
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as { role?: string } | undefined)?.role === 'SUPER_ADMIN'

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', name: '', role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/access', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setUsers(await res.json() as AdminUser[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchUsers() }, [fetchUsers])

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 12, padding: '24px 32px', textAlign: 'center', color: C.red }}>
          <Shield size={32} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 16 }}>Accès refusé</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Cette section est réservée aux Super Admins.</div>
        </div>
      </div>
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json() as AdminUser & { error?: string }
      if (!res.ok) { setFormError(json.error ?? 'Erreur'); return }
      setUsers(prev => [...prev, json])
      setShowForm(false)
      setFormData({ email: '', name: '', role: 'ADMIN', password: '' })
    } catch { setFormError('Erreur réseau') }
    finally { setSubmitting(false) }
  }

  async function toggleActive(user: AdminUser) {
    setActionLoading(user.id)
    try {
      const res = await fetch(`/api/admin/access/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      if (res.ok) {
        const updated = await res.json() as AdminUser
        setUsers(prev => prev.map(u => u.id === user.id ? updated : u))
      }
    } finally { setActionLoading(null) }
  }

  async function handleDelete(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/access/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success?: boolean; error?: string }
      if (res.ok && json.success) {
        setUsers(prev => prev.filter(u => u.id !== id))
        setDeleteConfirm(null)
      } else {
        alert(json.error ?? 'Erreur lors de la suppression')
      }
    } finally { setActionLoading(null) }
  }

  async function handleResetPassword(id: string) {
    if (!newPassword) return
    setActionLoading(id)
    try {
      await fetch(`/api/admin/access/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      setResetPasswordId(null)
      setNewPassword('')
    } finally { setActionLoading(null) }
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={17} color={C.blue} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Gestion des accès</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => void fetchUsers()} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: C.mid, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Actualiser
          </button>
          <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.blue, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
            <Plus size={13} /> Nouvel admin
          </button>
        </div>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 16px' }}>Créer un administrateur</h2>
            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.redBg, color: C.red, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                <AlertCircle size={14} /> {formError}
              </div>
            )}
            <form onSubmit={(e) => { void handleCreate(e) }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Nom', key: 'name', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.mid, display: 'block', marginBottom: 6 }}>{label}</label>
                  <input type={type} required value={formData[key as 'email' | 'name']}
                    onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.ink, background: C.bg, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mid, display: 'block', marginBottom: 6 }}>Rôle</label>
                <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.ink, background: C.bg }}>
                  <option value="ADMIN">Administrateur</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.mid, display: 'block', marginBottom: 6 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%', padding: '8px 36px 8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.ink, background: C.bg, boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, color: C.mid, cursor: 'pointer', fontSize: 13 }}>
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: C.blue, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.redBg, border: `1px solid ${C.red}30`, borderRadius: 12, padding: '16px 20px', color: C.red, fontSize: 14, marginBottom: 18 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
                {['Nom', 'Email', 'Rôle', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: C.ink }}>{user.name}</td>
                  <td style={{ padding: '12px 16px', color: C.mid }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: user.role === 'SUPER_ADMIN' ? '#ede9fe' : C.blueLight, color: user.role === 'SUPER_ADMIN' ? '#7c3aed' : C.blue, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: user.active ? C.greenBg : C.redBg, color: user.active ? C.green : C.red, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.active ? C.green : C.red, display: 'inline-block' }} />
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: C.mid, fontSize: 12 }}>{formatDate(user.lastLoginAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* Toggle active */}
                      <button onClick={() => void toggleActive(user)} disabled={actionLoading === user.id}
                        title={user.active ? 'Désactiver' : 'Activer'}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${user.active ? C.red : C.green}30`, borderRadius: 7, background: user.active ? C.redBg : C.greenBg, color: user.active ? C.red : C.green, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        {user.active ? <UserX size={11} /> : <UserCheck size={11} />}
                        {user.active ? 'Désactiver' : 'Activer'}
                      </button>
                      {/* Reset password */}
                      <button onClick={() => { setResetPasswordId(user.id); setNewPassword('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.bgAlt, color: C.mid, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        <RefreshCw size={11} /> Réinitialiser MDP
                      </button>
                      {/* Delete */}
                      <button onClick={() => setDeleteConfirm(user.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C.red}30`, borderRadius: 7, background: C.redBg, color: C.red, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        <Trash2 size={11} /> Supprimer
                      </button>
                    </div>
                    {/* Reset password inline */}
                    {resetPasswordId === user.id && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.ink, background: C.bg, flex: 1 }} />
                        <button onClick={() => void handleResetPassword(user.id)} disabled={!newPassword || actionLoading === user.id}
                          style={{ padding: '6px 12px', border: 'none', borderRadius: 7, background: C.blue, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle2 size={12} />
                        </button>
                        <button onClick={() => setResetPasswordId(null)}
                          style={{ padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg, color: C.mid, cursor: 'pointer', fontSize: 12 }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              style={{ background: C.bg, borderRadius: 14, padding: '28px 32px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>Confirmer la suppression</h3>
              <p style={{ fontSize: 13, color: C.mid, margin: '0 0 20px' }}>Cette action est irréversible. L&apos;administrateur sera définitivement supprimé.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.bg, color: C.mid, cursor: 'pointer', fontSize: 13 }}>
                  Annuler
                </button>
                <button onClick={() => void handleDelete(deleteConfirm)} disabled={actionLoading === deleteConfirm}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: C.red, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
