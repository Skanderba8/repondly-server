'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'FREE',
    trialEndsAt: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    color: C.ink,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.mid,
    marginBottom: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bgAlt, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px' }}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/admin/clients" style={{ fontSize: 13, color: C.blue, textDecoration: 'none' }}>
            ← Retour aux clients
          </Link>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: '0 0 24px' }}>
          Nouveau client
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle} htmlFor="name">Nom</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="plan">Plan</label>
            <select
              id="plan"
              name="plan"
              value={form.plan}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="FREE">FREE</option>
              <option value="STARTER">STARTER</option>
              <option value="PRO">PRO</option>
              <option value="BUSINESS">BUSINESS</option>
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="trialEndsAt">Fin d&apos;essai (optionnel)</label>
            <input
              id="trialEndsAt"
              name="trialEndsAt"
              type="date"
              value={form.trialEndsAt}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: 13, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? C.mid : C.blue,
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 0',
              width: '100%',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {loading ? 'Création...' : 'Créer le client'}
          </button>
        </form>
      </div>
    </div>
  )
}
