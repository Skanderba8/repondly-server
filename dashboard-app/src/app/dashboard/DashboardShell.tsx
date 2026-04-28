'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Circle, MessageSquare, Bot, Activity, 
  X, Settings, LayoutDashboard, Users, ExternalLink, 
  LogOut, User, SlidersHorizontal, ChevronDown, Zap,
  Clock, CheckCircle, ArrowRight, HelpCircle, Check
} from 'lucide-react'

// ── Design Tokens (Marketing Page Aesthetic) ──
const C = {
  bg:        '#ffffff',
  bgAlt:     '#f5f7fa',
  blue:      '#1a6bff',
  blueDark:  '#0f4fd4',
  blueLight: '#e8f0ff',
  ink:       '#0d1b2e',
  mid:       '#5a6a80',
  muted:     '#8899aa',
  border:    '#e2e8f2',
}

declare global {
  interface Window { FB: any; fbAsyncInit: () => void }
}

const WaIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.268 2 2 8.268 2 16c0 2.4.627 4.65 1.72 6.6L2 30l7.6-1.694A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#25D366"/>
    <path d="M22.5 19.5c-.3-.15-1.8-.9-2.1-1-.3-.1-.5-.15-.7.15-.2.3-.8 1-.95 1.2-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.8-.74 2.05-1.45.25-.71.25-1.32.17-1.45-.07-.13-.27-.2-.57-.35z" fill="white"/>
  </svg>
)

export default function DashboardShell() {
  const { data: session, status } = useSession()
  
  // -- Setup State --
  const [waConnected, setWaConnected] = useState(false)
  const [hasAcceptedDPA, setHasAcceptedDPA] = useState(false)
  const [hasConfiguredBot, setHasConfiguredBot] = useState(false)
  
  // -- UI & Loading State --
  const [fbLoaded, setFbLoaded] = useState(false)
  const [waLoading, setWaLoading] = useState(false)
  const [showDPAModal, setShowDPAModal] = useState(false)
  const [dpaScrolled, setDpaScrolled] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showPersonaModal, setShowPersonaModal] = useState(false)
  const [savingPersona, setSavingPersona] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const progress = useMemo(() => {
    let p = 0
    if (waConnected) p += 33
    if (hasAcceptedDPA) p += 33
    if (hasConfiguredBot) p += 34
    return p
  }, [waConnected, hasAcceptedDPA, hasConfiguredBot])

  const activeStep = useMemo(() => {
    if (!waConnected) return 1
    if (!hasAcceptedDPA) return 2
    if (!hasConfiguredBot) return 3
    return 4 
  }, [waConnected, hasAcceptedDPA, hasConfiguredBot])

  // -- Initialize FB SDK & Check Status --
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

    fetch('/api/whatsapp/status').then(r => r.json()).then(data => {
      if (data.whatsappConnected) setWaConnected(true)
    }).catch(e => console.error("API non prête", e))
  }, [])

  // -- Step 1: Meta SDK Listener --
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          sendToBackend({ phoneNumberId: data.data.phone_number_id, wabaId: data.data.waba_id })
        }
      } catch {
        if (typeof event.data === 'string' && event.data.includes('code=')) {
          const code = new URLSearchParams(event.data.split('?')[1] || event.data).get('code')
          if (code) sendToBackend({ code })
        }
      }
    }

    const sendToBackend = (payload: any) => {
      fetch('/api/auth/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json()).then(d => {
        if (d.success) {
          setWaConnected(true)
          setWaLoading(false)
        }
      })
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSignup = () => {
    if (!window.FB) return
    setWaLoading(true)
    window.FB.login((response: any) => {
      if (!response.authResponse) setWaLoading(false)
    }, {
      config_id: '1984471322183154', 
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {}, featureType: '', sessionInfoVersion: '3' },
    })
  }

  // -- Mock Saves --
  const handleSaveProfileAndDPA = () => {
    setSavingProfile(true)
    setTimeout(() => {
      setSavingProfile(false); setShowDPAModal(false); setHasAcceptedDPA(true)
    }, 1500)
  }

  const handleSavePersona = () => {
    setSavingPersona(true)
    setTimeout(() => {
      setSavingPersona(false); setShowPersonaModal(false); setHasConfiguredBot(true)
    }, 1500)
  }

  // Click outside to close profile dropdown
  const profileRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (status === 'loading' || !session) return null

  // Mock Activity Data
  const activities = [
    { id: 1, title: 'Rendez-vous confirmé pour Sarah', description: 'Sarah a confirmé son rendez-vous pour demain à 14h00', timestamp: 'Il y a 2 minutes', status: 'confirmed', icon: CheckCircle },
    { id: 2, title: 'Question FAQ traitée', description: "L'IA a répondu à une question sur les tarifs", timestamp: 'Il y a 5 minutes', status: 'faq', icon: HelpCircle },
    { id: 3, title: 'Transfert vers agent humain', description: 'Conversation escaladée pour un problème complexe', timestamp: 'Il y a 12 minutes', status: 'transferred', icon: ArrowRight },
    { id: 4, title: 'Demande de devis reçue', description: 'Un client a demandé un devis pour un projet', timestamp: 'Il y a 28 minutes', status: 'pending', icon: Clock },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: C.bgAlt, color: C.ink, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ========================================== */}
      {/* SIDEBAR                                    */}
      {/* ========================================== */}
      <aside style={{ width: '260px', backgroundColor: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20 }}>
        <div style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: C.ink, letterSpacing: '-0.02em' }}>
            Répondly<span style={{ color: C.blue }}>.</span>
          </span>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: C.muted, letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '12px', fontFamily: "'DM Sans', sans-serif" }}>Menu Principal</div>
          
          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: C.blueLight, color: C.blueDark, border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            <LayoutDashboard size={18} /> Vue d'ensemble
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'transparent', color: C.mid, border: 'none', fontWeight: 500, fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.color = C.ink }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.mid }}>
            <Bot size={18} /> Agent IA & Règles
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'transparent', color: C.mid, border: 'none', fontWeight: 500, fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.color = C.ink }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.mid }}>
            <Users size={18} /> Contacts & Clients
          </button>
        </nav>

        <div style={{ padding: '20px 16px', borderTop: `1px solid ${C.border}` }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'transparent', color: C.mid, border: 'none', fontWeight: 500, fontSize: '14px', width: '100%', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.color = C.ink }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.mid }}>
            <Settings size={18} /> Paramètres
          </button>
        </div>
      </aside>

      {/* ========================================== */}
      {/* MAIN CONTENT AREA                          */}
      {/* ========================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOPBAR */}
        <header style={{ height: '72px', backgroundColor: C.bg, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', flexShrink: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: C.ink, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Tableau de bord</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <a 
              href="https://inbox.repondly.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: C.blue, color: C.bg, padding: '10px 18px', borderRadius: '100px', fontSize: '13.5px', fontWeight: 600, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(26,107,255,0.25)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.blueDark; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.blue; e.currentTarget.style.transform = 'none' }}
            >
              <MessageSquare size={16} /> Ouvrir la Messagerie <ExternalLink size={14} style={{ opacity: 0.7 }} />
            </a>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>{session.user?.name || 'Utilisateur'}</div>
                  <div style={{ fontSize: '11.5px', color: C.mid }}>Administrateur</div>
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown size={14} color={C.mid} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '220px', backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', zIndex: 50 }}
                  >
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'none', border: 'none', color: C.ink, fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.color = C.blue }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.ink }}>
                      <User size={16} /> Éditer le profil
                    </button>
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'none', border: 'none', color: C.ink, fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgAlt; e.currentTarget.style.color = C.blue }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.ink }}>
                      <SlidersHorizontal size={16} /> Préférences
                    </button>
                    <div style={{ height: '1px', backgroundColor: C.border, margin: '8px 0' }} />
                    <button 
                      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', background: 'none', border: 'none', color: '#e53e3e', fontSize: '13.5px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }} 
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff5f5' }} 
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* HORIZONTAL ONBOARDING WIDGET */}
            <AnimatePresence>
              {progress < 100 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  style={{ backgroundColor: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flexShrink: 0, overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px 0', color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Configuration requise ({progress}%)</h2>
                      <p style={{ color: C.mid, fontSize: '13.5px', margin: 0 }}>Finalisez ces étapes pour activer pleinement votre Agent IA Répondly.</p>
                    </div>
                    <div style={{ width: '200px', height: '6px', backgroundColor: C.border, borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', backgroundColor: C.blue }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* Step 1 */}
                    <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${waConnected ? 'rgba(37,211,102,0.3)' : C.border}`, backgroundColor: waConnected ? 'rgba(37,211,102,0.05)' : C.bgAlt, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: waConnected ? '#25d366' : C.ink, fontWeight: 600, fontSize: '14.5px', fontFamily: "'DM Sans', sans-serif" }}>
                        {waConnected ? <CheckCircle2 size={18} /> : <Circle size={18} color={C.mid}/>} 1. WhatsApp Business
                      </div>
                      {activeStep === 1 ? (
                        <button onClick={handleSignup} disabled={!fbLoaded || waLoading} style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: (!fbLoaded || waLoading) ? 'not-allowed' : 'pointer', opacity: (!fbLoaded || waLoading) ? 0.7 : 1, width: 'fit-content', fontFamily: "'DM Sans', sans-serif" }}>
                          {waLoading ? 'Connexion...' : 'Connecter via Meta'}
                        </button>
                      ) : (
                        <div style={{ fontSize: '13px', color: C.mid }}>{waConnected ? 'Connecté avec succès.' : 'En attente.'}</div>
                      )}
                    </div>

                    {/* Step 2 */}
                    <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${hasAcceptedDPA ? C.blueLight : C.border}`, backgroundColor: hasAcceptedDPA ? C.blueLight : C.bgAlt, display: 'flex', flexDirection: 'column', gap: '12px', opacity: activeStep >= 2 ? 1 : 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasAcceptedDPA ? C.blueDark : C.ink, fontWeight: 600, fontSize: '14.5px', fontFamily: "'DM Sans', sans-serif" }}>
                        {hasAcceptedDPA ? <CheckCircle2 size={18} /> : <Circle size={18} color={C.mid}/>} 2. Données & Conformité
                      </div>
                      {activeStep === 2 ? (
                        <button onClick={() => setShowDPAModal(true)} style={{ backgroundColor: C.ink, color: C.bg, border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content', fontFamily: "'DM Sans', sans-serif" }}>
                          Compléter & Signer DPA
                        </button>
                      ) : (
                        <div style={{ fontSize: '13px', color: C.mid }}>{hasAcceptedDPA ? 'Profil juridique validé.' : 'En attente.'}</div>
                      )}
                    </div>

                    {/* Step 3 */}
                    <div style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${hasConfiguredBot ? C.blueLight : C.border}`, backgroundColor: hasConfiguredBot ? C.blueLight : C.bgAlt, display: 'flex', flexDirection: 'column', gap: '12px', opacity: activeStep >= 3 ? 1 : 0.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasConfiguredBot ? C.blueDark : C.ink, fontWeight: 600, fontSize: '14.5px', fontFamily: "'DM Sans', sans-serif" }}>
                        {hasConfiguredBot ? <CheckCircle2 size={18} /> : <Circle size={18} color={C.mid}/>} 3. Personnaliser l'IA
                      </div>
                      {activeStep === 3 ? (
                        <button onClick={() => setShowPersonaModal(true)} style={{ backgroundColor: C.blue, color: C.bg, border: 'none', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: 'fit-content', fontFamily: "'DM Sans', sans-serif" }}>
                          Configurer le Bot
                        </button>
                      ) : (
                        <div style={{ fontSize: '13px', color: C.mid }}>{hasConfiguredBot ? 'Bot actif et configuré.' : 'En attente.'}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MAIN DASHBOARD WIDGETS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', flexShrink: 0 }}>
              
              <div style={{ backgroundColor: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: C.blueLight, color: C.blue, borderRadius: '10px' }}><Activity size={18} /></div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Conversations IA (7j)</h3>
                </div>
                <div style={{ fontSize: '36px', fontFamily: "'DM Serif Display', serif", marginBottom: '4px', color: C.ink }}>0</div>
                <div style={{ fontSize: '13.5px', color: C.mid }}>En attente de trafic</div>
              </div>

              <div style={{ backgroundColor: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(37,211,102,0.1)', color: '#25D366', borderRadius: '10px' }}><MessageSquare size={18} /></div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Canaux Connectés</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', color: C.ink }}><WaIcon size={16}/> WhatsApp</span>
                  <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: waConnected ? 'rgba(37,211,102,0.1)' : C.bgAlt, color: waConnected ? '#25d366' : C.mid, borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {waConnected ? 'Actif' : 'Non Connecté'}
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f1f5f9', color: C.mid, borderRadius: '10px' }}><Zap size={18} /></div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Statut Système</h3>
                </div>
                <p style={{ fontSize: '13.5px', color: C.mid, margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  {progress === 100 ? "Votre Agent IA est opérationnel et surveille les messages entrants." : "Le système est en attente de la fin de votre configuration."}
                </p>
              </div>
            </div>

            {/* RECENT ACTIVITY FEED */}
            <div style={{ backgroundColor: C.bg, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: C.ink, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Activité Récente</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activities.map((act, i) => {
                  const Icon = act.icon
                  const isLast = i === activities.length - 1
                  
                  // Status styles
                  let bg = C.bgAlt, txt = C.mid, label = 'Nouveau'
                  if (act.status === 'confirmed') { bg = '#d1fae5'; txt = '#065f46'; label = 'Confirmé' }
                  if (act.status === 'faq') { bg = '#e8f0ff'; txt = '#1a6bff'; label = 'FAQ' }
                  if (act.status === 'transferred') { bg = '#fee2e2'; txt = '#dc2626'; label = 'Transféré' }
                  if (act.status === 'pending') { bg = '#f3f4f6'; txt = '#374151'; label = 'En attente' }

                  return (
                    <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 24px', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
                      {/* Ici l'icône prend dynamiquement la couleur du texte du statut via la variable 'txt' */}
                      <div style={{ marginTop: '2px' }}><Icon size={18} color={txt} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 600, color: C.ink }}>{act.title}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: bg, color: txt, padding: '4px 8px', borderRadius: '100px' }}>{label}</span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: C.mid, margin: '0 0 6px 0' }}>{act.description}</p>
                        <span style={{ fontSize: '12px', color: C.muted }}>{act.timestamp}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ========================================== */}
      {/* MODALS (DPA & PERSONA)                     */}
      {/* ========================================== */}
      
      <AnimatePresence>
        {showDPAModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDPAModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13, 27, 46, 0.35)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={{ position: 'relative', width: '100%', maxWidth: '600px', backgroundColor: C.bg, borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
              <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontFamily: "'DM Serif Display', serif", color: C.ink }}>Données & Conformité (DPA)</h2>
                <button onClick={() => setShowDPAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}><X size={20}/></button>
              </div>
              <div style={{ padding: '32px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.mid, marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>1. Horaires d'ouverture</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" }}>Ouverture</label>
                    <input type="time" defaultValue="09:00" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.bgAlt, color: C.ink, fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: C.ink, marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" }}>Fermeture</label>
                    <input type="time" defaultValue="18:00" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.bgAlt, color: C.ink, fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.mid, marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>2. Accord de Traitement des Données (INPDP)</h3>
                <p style={{ fontSize: '13px', color: C.mid, marginBottom: '12px' }}>Veuillez faire défiler le document jusqu'en bas pour valider.</p>
                <div onScroll={(e) => { const target = e.target as HTMLDivElement; if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) setDpaScrolled(true); }} style={{ height: '180px', overflowY: 'auto', backgroundColor: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', fontSize: '13px', color: C.mid, lineHeight: 1.6 }}>
                  <strong>Accord de Traitement des Données (Loi n° 2004-63)</strong><br/><br/>Cet accord (DPA) fait partie intégrante du contrat de service entre votre entreprise et Répondly.<br/><br/>1. <strong>Nature du traitement :</strong> Répondly traitera les messages entrants via WhatsApp et les réseaux sociaux dans le seul but d'automatiser le service client et les réservations.<br/><br/>2. <strong>Souveraineté des données :</strong> Conformément à la loi tunisienne n° 2004-63 sur la protection des données personnelles, Répondly agit strictement en tant que sous-traitant. Votre entreprise demeure le responsable du traitement.<br/><br/>3. <strong>Confidentialité :</strong> Toutes les transcriptions IA (y compris les notes vocales en Darija) sont chiffrées. Le personnel de Répondly n'y accède pas sans votre autorisation.<br/><br/>4. <strong>Suppression :</strong> À la fin du contrat, les données de vos clients seront purgées de nos serveurs sous 30 jours.<br/><br/><em>(Scrollez pour accepter)</em><br/><br/><br/><br/>--- Fin du document ---
                </div>
              </div>
              <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.border}`, backgroundColor: C.bgAlt, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSaveProfileAndDPA} disabled={!dpaScrolled || savingProfile} style={{ backgroundColor: C.blue, color: '#fff', border: 'none', borderRadius: '100px', padding: '10px 24px', fontSize: '13.5px', fontWeight: 600, cursor: dpaScrolled ? 'pointer' : 'not-allowed', opacity: dpaScrolled ? 1 : 0.5, transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" }}>
                  {savingProfile ? 'Signature en cours...' : 'J\'accepte et je signe'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPersonaModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPersonaModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13, 27, 46, 0.35)', backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', backgroundColor: C.bg, borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontFamily: "'DM Serif Display', serif", color: C.ink }}>Configuration de l'IA</h2>
                <button onClick={() => setShowPersonaModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid }}><X size={20}/></button>
              </div>
              <div style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: C.mid, marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>Langue principale</label>
                  <select style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.bgAlt, color: C.ink, fontSize: '14px', outline: 'none' }}>
                    <option value="auto">Détection Auto (Darija/Fr/Ar)</option>
                    <option value="darija">Darija Tunisien Strict</option>
                    <option value="french">Français Strict</option>
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: C.mid, marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>Ton de la voix</label>
                  <select style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: `1px solid ${C.border}`, backgroundColor: C.bgAlt, color: C.ink, fontSize: '14px', outline: 'none' }}>
                    <option value="professional">Professionnel & Poli (Cliniques/B2B)</option>
                    <option value="friendly">Amical & Décontracté (E-commerce/Resto)</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '20px 32px', borderTop: `1px solid ${C.border}`, backgroundColor: C.bgAlt, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSavePersona} disabled={savingPersona} style={{ backgroundColor: C.blue, color: '#fff', border: 'none', borderRadius: '100px', padding: '10px 24px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'DM Sans', sans-serif" }}>
                  {savingPersona ? 'Activation...' : 'Activer le Bot'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}