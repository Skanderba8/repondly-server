'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      return setError(data.error || 'Something went wrong')
    }
    router.push('/auth/signin')
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Répondly<span style={styles.dot}>.</span></div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.sub}>Get started in seconds</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Business name</label>
            <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Business" required />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3', fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#fff', border: '1px solid #e5e5e3', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  logo: { fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', marginBottom: '28px', color: '#111' },
  dot: { color: '#2563eb' },
  title: { fontSize: '1.5rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '-0.02em' },
  sub: { color: '#6b6b67', fontSize: '0.9rem', marginBottom: '28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  group: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.78rem', fontWeight: 500, color: '#6b6b67', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 14px', border: '1px solid #e5e5e3', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
  error: { color: '#dc2626', fontSize: '0.85rem', margin: 0 },
  btn: { background: '#111', color: '#fff', border: 'none', borderRadius: '100px', padding: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', marginTop: '4px' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#6b6b67' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 500 },
}
