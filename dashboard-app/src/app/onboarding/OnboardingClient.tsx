'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window { FB: any; fbAsyncInit: () => void }
}

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' },
  box: { width: '100%', maxWidth: 480 },
  iconWrap: { width: 64, height: 64, borderRadius: 16, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
  h1: { fontSize: 26, fontWeight: 700, textAlign: 'center' as const, margin: '0 0 8px' },
  desc: { color: '#888', fontSize: 14, textAlign: 'center' as const, lineHeight: 1.6, margin: '0 0 40px' },
  step: { display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 18px', marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepTxt: { color: '#ccc', fontSize: 13 },
  alert: (type: 'success' | 'error') => ({ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '14px 18px', marginBottom: 20, background: type === 'success' ? 'rgba(37,211,102,0.1)' : 'rgba(239,68,68,0.1)', border: type === 'success' ? '1px solid rgba(37,211,102,0.3)' : '1px solid rgba(239,68,68,0.3)', color: type === 'success' ? '#25D366' : '#ef4444', fontSize: 13 }),
  btnGreen: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25D366', color: '#000', border: 'none', borderRadius: 12, padding: '16px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 24 },
  btnGhost: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 24px', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 24 },
  fine: { color: '#444', fontSize: 11, textAlign: 'center' as const, marginTop: 20 },
}

const WaIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

export default function OnboardingClient() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fbLoaded, setFbLoaded] = useState(false)

  // Load FB SDK
  useEffect(() => {
    if (document.getElementById('fb-sdk')) { setFbLoaded(true); return }
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      })
      setFbLoaded(true)
    }
    const script = document.createElement('script')
    script.id = 'fb-sdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // THIS is the key part — listen for Meta sending back the waba_id and phone_number_id
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        console.log('Meta message event:', data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          const { phone_number_id, waba_id } = data.data
          // send to backend
          fetch('/api/auth/meta/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumberId: phone_number_id, wabaId: waba_id }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.success) setStatus('success')
              else { setStatus('error'); setErrorMsg(d.error || 'Erreur inconnue.') }
            })
            .catch(() => { setStatus('error'); setErrorMsg('Erreur réseau.') })
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSignup = () => {
    if (!window.FB) return
    setStatus('loading')
    window.FB.login((response: any) => {
      console.log('FB login response:', JSON.stringify(response))
      // if user closed the popup without finishing
      if (!response.authResponse) {
        setStatus('error')
        setErrorMsg('Signup annulé ou échoué.')
      }
      // DO NOT send the token to backend here
      // the message event listener above will handle it
    }, {
      config_id: '862562813521133',
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
    })
  }

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.iconWrap}><WaIcon size={32} /></div>
        <h1 style={s.h1}>Connecter WhatsApp</h1>
        <p style={s.desc}>Reliez votre numéro WhatsApp Business en quelques clics.</p>

        {['Connectez votre compte Meta/Facebook', 'Sélectionnez votre compte WhatsApp Business', 'Choisissez votre numéro de téléphone'].map((txt, i) => (
          <div key={i} style={s.step}>
            <span style={s.stepNum}>{i + 1}</span>
            <span style={s.stepTxt}>{txt}</span>
          </div>
        ))}

        {status === 'success' && <div style={s.alert('success')}>✓ WhatsApp connecté avec succès !</div>}
        {status === 'error' && <div style={s.alert('error')}>✕ {errorMsg}</div>}

        {status !== 'success' ? (
          <button
            style={{ ...s.btnGreen, opacity: (!fbLoaded || status === 'loading') ? 0.5 : 1, cursor: (!fbLoaded || status === 'loading') ? 'not-allowed' : 'pointer' }}
            onClick={handleSignup}
            disabled={!fbLoaded || status === 'loading'}
          >
            <WaIcon size={20} />
            {status === 'loading' ? 'Connexion en cours...' : 'Connecter WhatsApp Business'}
          </button>
        ) : (
          <button style={s.btnGhost} onClick={() => router.push('/dashboard')}>
            Aller au tableau de bord →
          </button>
        )}

        <p style={s.fine}>Vos données sont sécurisées. Nous ne stockons jamais votre mot de passe Facebook.</p>
      </div>
    </div>
  )
}