'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminSignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Invalid credentials or insufficient permissions.')
      return
    }
    router.push('/admin')
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Répondly<span style={styles.dot}>.</span> <span style={styles.badge}>Admin</span></div>
        <h1 style={styles.title}>Admin Access</h1>
        <p style={styles.sub}>Sign in with your administrator account.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@repondly.com" required />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: '#fff', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' },
  dot: { color: '#2563eb' },
  badge: { fontSize: '0.65rem', fontWeight: 600, background: '#1d3461', color: '#60a5fa', padding: '3px 8px', borderRadius: '100px', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'inherit' },
  title: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '-0.02em', color: '#fff' },
  sub: { color: '#6b6b67', fontSize: '0.9rem', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.78rem', fontWeight: 500, color: '#6b6b67', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 14px', border: '1px solid #222', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', background: '#1a1a1a', color: '#fff' },
  error: { color: '#f87171', fontSize: '0.85rem', margin: 0 },
  btn: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
}
