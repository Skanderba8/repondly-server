'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) return setError('Email ou mot de passe incorrect')

    const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
    const session = await sessionRes.json() as { user?: { role?: 'SUPER_ADMIN' | 'ADMIN' } }
    const role = session?.user?.role
    router.push(role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'https://admin.repondly.com' : '/dashboard')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
          100% { transform: translate(0, 0); }
        }
        .auth-container { 
          height: 100vh; 
          width: 100vw;
          background-color: #060b19;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          color: #ffffff;
        }
        .orb-1 {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%);
          top: -10%; left: -10%;
          animation: drift 15s ease-in-out infinite;
          pointer-events: none;
        }
        .orb-2 {
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%);
          bottom: -10%; right: -5%;
          animation: drift 18s ease-in-out infinite reverse;
          pointer-events: none;
        }
        .main-card {
          position: relative;
          z-index: 10;
          display: flex;
          width: 100%;
          max-width: 960px;
          background: rgba(13, 22, 45, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          overflow: hidden;
          animation: fadeIn 0.5s ease-out;
        }
        .panel {
          flex: 1;
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .right-panel {
          display: none;
          position: relative;
        }
        .divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);
          display: none;
        }
        .input-field {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .input-field:focus {
          border-color: #3b82f6;
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
        }
        .submit-btn {
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 4px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #f1f5f9;
        }
        .forgot-pwd-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.8rem;
          transition: color 0.2s;
        }
        .forgot-pwd-link:hover {
          color: #ffffff;
        }
        @media (min-width: 900px) {
          .right-panel { display: flex; }
          .divider { display: block; }
        }
        @media (max-height: 700px) {
          .panel { padding: 2rem 3.5rem; }
        }
      `}} />

      <main className="auth-container">
        <div className="orb-1" />
        <div className="orb-2" />

        <div className="main-card">
          {/* LEFT: SIGN IN FORM */}
          <div className="panel">
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.5rem', color: '#fff' }}>
                Répondly<span style={{ color: '#3b82f6' }}>.</span>
              </div>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 500, marginBottom: '6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Bon retour
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '28px' }}>
              Connectez-vous à votre espace Répondly
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </label>
                <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mot de passe
                  </label>
                  <Link href="#" className="forgot-pwd-link">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

              <button className="submit-btn" style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} type="submit" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* DIVIDER */}
          <div className="divider" />

          {/* RIGHT: VALUE PROP */}
          <div className="panel right-panel">
            <div style={{ zIndex: 2 }}>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 500, lineHeight: 1.2, marginBottom: '16px', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Centralisez.<br/><span style={{ color: '#3b82f6' }}>Automatisez.</span><br/>Évoluez.
              </h2>
              <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px', maxWidth: '90%' }}>
                Pilotez toutes vos interactions clients depuis un espace unique. L'intelligence artificielle au service de votre croissance, sur tous vos canaux.
              </p>
              <div style={{ display: 'flex', gap: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>99.9%</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uptime</span>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>&lt; 3s</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temps de réponse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}