'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0', red: '#dc2626',
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '10px 12px', fontSize: 14, color: C.ink, outline: 'none',
  boxSizing: 'border-box', background: C.bg,
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'FREE', trialEndsAt: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      router.push(`/admin/clients/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const fields = [
    { id: 'name', label: 'Nom de l\'entreprise', type: 'text', placeholder: 'Acme Corp', required: true },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'contact@exemple.com', required: true },
    { id: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••', required: true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bgAlt, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(13,27,46,0.07)' }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/admin/clients" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: C.mid, textDecoration: 'none',
            padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}`,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.blue; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.blue }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.mid; (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border }}
          >
            <ArrowLeft size={13} /> Retour aux clients
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserPlus size={20} color={C.blue} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.ink, margin: 0 }}>Nouveau client</h1>
            <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>Créer un compte business</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.id}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {f.label}
              </label>
              <input
                id={f.id} name={f.id} type={f.type}
                required={f.required}
                value={form[f.id as keyof typeof form]}
                onChange={handleChange}
                style={inputStyle}
                placeholder={f.placeholder}
                onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Plan
            </label>
            <select
              name="plan" value={form.plan} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Fin d&apos;essai (optionnel)
            </label>
            <input
              name="trialEndsAt" type="date"
              value={form.trialEndsAt} onChange={handleChange}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,107,255,0.1)' }}
              onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5', color: C.red, fontSize: 13 }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? C.mid : C.blue, color: '#fff',
              border: 'none', borderRadius: 9, padding: '12px 0',
              width: '100%', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#0047cc' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = C.blue }}
          >
            {loading ? 'Création en cours…' : 'Créer le client'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
