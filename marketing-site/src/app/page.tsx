'use client'
import { useState, useEffect, useRef, CSSProperties } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, CalendarCheck, Bell, Globe, UserCheck, ArrowRight,
  Check, Plus, Minus, MapPin, Clock, Languages,
  Bot, Zap, CheckCircle, Smartphone, LayoutDashboard,
  ChevronDown
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#ffffff',
  bgAlt:     '#f4f7fb',
  blue:      '#1a6bff',
  blueDark:  '#0f4fd4',
  blueLight: '#e8f0ff',
  blueFaint: '#f0f5ff',
  ink:       '#0d1b2e',
  mid:       '#5a6a80',
  border:    '#dde5f0',
  white:     '#ffffff',
}

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: 'easeOut' as const },
  }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

// ── Icon maps ─────────────────────────────────────────────────────────────────
const featureIcons = [MessageSquare, CalendarCheck, Bell, MessageSquare, Globe, UserCheck, Smartphone, LayoutDashboard]

// ── Abstract blobs — unique per section via seed offsets ──────────────────────
function Blobs({ seed = 0, opacity = 0.5 }: { seed?: number; opacity?: number }) {
  const s = seed * 137
  return (
    <svg aria-hidden="true" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', overflow: 'visible',
    }} viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`bg${seed}a`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity={opacity * 0.16} />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`bg${seed}b`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity={opacity * 0.10} />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`bg${seed}c`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity={opacity * 0.07} />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={(900 + s) % 1200} cy={(100 + s * 0.4) % 400} rx="400" ry="320" fill={`url(#bg${seed}a)`} />
      <ellipse cx={(80  + s * 0.6) % 600} cy={(550 + s * 0.3) % 700} rx="340" ry="260" fill={`url(#bg${seed}b)`} />
      <ellipse cx={(500 + s * 0.2) % 1000} cy={(350 + s * 0.5) % 600} rx="240" ry="180" fill={`url(#bg${seed}c)`} />
    </svg>
  )
}

// ── 3 looping chat conversations ──────────────────────────────────────────────
type Msg = { side: 'left' | 'right'; text: string }
type Convo = { channel: string; color: string; msgs: Msg[] }

const convos: Convo[] = [
  {
    channel: 'WhatsApp', color: '#25d366',
    msgs: [
      { side: 'left',  text: 'Bonjour, je voudrais prendre un rendez-vous pour demain.' },
      { side: 'right', text: 'Bonjour ! Quelle heure vous convient le mieux, matin ou après-midi ?' },
      { side: 'left',  text: '10h si possible.' },
      { side: 'right', text: 'Parfait. RDV mardi à 10h confirmé. Un rappel vous sera envoyé 1h avant.' },
    ],
  },
  {
    channel: 'Instagram', color: '#e1306c',
    msgs: [
      { side: 'left',  text: 'Bonjour, quels sont vos horaires ?' },
      { side: 'right', text: 'Bonjour ! Nous sommes ouverts lundi-samedi, 9h à 19h.' },
      { side: 'left',  text: 'Vous proposez des consultations en ligne ?' },
      { side: 'right', text: 'Oui ! Je peux vous réserver un créneau en ligne dès maintenant.' },
    ],
  },
  {
    channel: 'Facebook', color: '#1877f2',
    msgs: [
      { side: 'left',  text: "J'ai vu votre pub. C'est quoi exactement votre service ?" },
      { side: 'right', text: 'On automatise vos réponses clients sur tous vos canaux, 24h/24.' },
      { side: 'left',  text: 'Il y a un essai gratuit ?' },
      { side: 'right', text: 'Oui, 30 jours gratuits, sans carte bancaire. Je vous envoie le lien ?' },
    ],
  },
]

// ── Chat mockup ───────────────────────────────────────────────────────────────
function ChatMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-40px' })
  const [ci, setCi] = useState(0)
  const [shown, setShown] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!inView) return
    const msgs = convos[ci].msgs
    const timers: ReturnType<typeof setTimeout>[] = []

    // reveal messages one by one
    msgs.forEach((_, idx) => {
      timers.push(setTimeout(() => setShown(idx + 1), 300 + idx * 900))
    })

    // after all shown + 3s pause → fade out → next convo
    const allDone = 300 + (msgs.length - 1) * 900
    timers.push(setTimeout(() => setFading(true),  allDone + 3000))
    timers.push(setTimeout(() => {
      setCi(c => (c + 1) % convos.length)
      setShown(0)
      setFading(false)
    }, allDone + 3400))

    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, ci])

  const convo = convos[ci]

  return (
    <div ref={ref} style={{
      borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      boxShadow: '0 8px 40px rgba(26,107,255,0.11)',
      background: C.white,
    }}>
      {/* title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.bgAlt,
      }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <motion.div
            key={ci}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: convo.color, flexShrink: 0 }}
          />
          <motion.span
            key={`label-${ci}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 12, color: C.mid }}
          >
            {convo.channel} — Répondly
          </motion.span>
        </div>
      </div>

      {/* messages area — fixed height, no layout shift */}
      <div style={{ padding: '18px 18px 16px', height: 220, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-end' }}>
        <AnimatePresence mode="popLayout">
          {convo.msgs.slice(0, shown).map((msg, i) => (
            <motion.div
              key={`${ci}-${i}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: fading ? 0 : 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ display: 'flex', gap: 8, flexDirection: msg.side === 'right' ? 'row-reverse' : 'row', flexShrink: 0 }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600,
                background: msg.side === 'right' ? C.blueLight : '#f0f0f0',
                color: msg.side === 'right' ? C.blue : C.mid,
              }}>
                {msg.side === 'right' ? <Bot size={12} /> : 'C'}
              </div>
              <div style={{
                maxWidth: '74%', padding: '8px 12px', borderRadius: 13, fontSize: 12.5, lineHeight: 1.5,
                borderBottomRightRadius: msg.side === 'right' ? 3 : 13,
                borderBottomLeftRadius:  msg.side === 'left'  ? 3 : 13,
                background: msg.side === 'right' ? C.blue : C.bgAlt,
                color: msg.side === 'right' ? C.white : C.ink,
              }}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* typing dots */}
        <AnimatePresence>
          {!fading && shown > 0 && shown < convo.msgs.length && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', gap: 8, flexShrink: 0 }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.mid }}>C</div>
              <div style={{ padding: '9px 12px', borderRadius: 13, borderBottomLeftRadius: 3, background: C.bgAlt, display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(d => (
                  <motion.span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: C.mid, display: 'block' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.0, repeat: Infinity, delay: d * 0.16 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* channel dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '0 0 12px' }}>
        {convos.map((_, i) => (
          <div key={i} style={{
            width: i === ci ? 16 : 5, height: 5, borderRadius: 3,
            background: i === ci ? C.blue : C.border,
            transition: 'all 0.35s ease',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div variants={fadeUp} onClick={() => setOpen(o => !o)}
      style={{
        border: `1px solid ${open ? C.blue : C.border}`,
        borderRadius: 12, padding: '18px 22px', cursor: 'pointer',
        background: C.white, transition: 'border-color 0.2s',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14.5, color: C.ink, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: C.blue, flexShrink: 0, marginTop: 2 }}>
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', color: C.mid, fontSize: 13, lineHeight: 1.7, marginTop: 10, fontWeight: 300 }}>
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Sec({ id, children, bg = C.bg, style = {} }: {
  id?: string; children: React.ReactNode; bg?: string; style?: CSSProperties
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.section id={id} ref={ref}
      variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      style={{ background: bg, padding: '88px 24px', position: 'relative', overflow: 'hidden', ...style }}>
      {children}
    </motion.section>
  )
}

const wrap: CSSProperties = { maxWidth: 1100, margin: '0 auto' }

// ── Contact form with "Autre" reveal ─────────────────────────────────────────
function ContactForm({ tr }: { tr: ReturnType<typeof import('@/lib/LangContext').useLang>['tr'] }) {
  const [business, setBusiness] = useState('')
  const [autre, setAutre] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const inputStyle = (name: string): CSSProperties => ({
    background: C.white, border: `1.5px solid ${focused === name ? C.blue : C.border}`,
    borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: C.ink,
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', width: '100%',
    boxSizing: 'border-box',
  })

  return (
    <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[
        { label: tr.formName,  type: 'text', ph: tr.formNamePh,  name: 'name' },
        { label: tr.formPhone, type: 'tel',  ph: tr.formPhonePh, name: 'phone' },
      ].map(f => (
        <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mid }}>{f.label}</label>
          <input type={f.type} placeholder={f.ph} style={inputStyle(f.name)}
            onFocus={() => setFocused(f.name)} onBlur={() => setFocused(null)} />
        </div>
      ))}

      {/* business type — custom styled select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mid }}>{tr.formBusiness}</label>
        <div style={{ position: 'relative' }}>
          <select
            value={business}
            onChange={e => setBusiness(e.target.value)}
            style={{
              ...inputStyle('business'),
              appearance: 'none', paddingRight: 36, cursor: 'pointer',
              background: business ? C.white : C.bgAlt,
              color: business ? C.ink : C.mid,
            }}
            onFocus={() => setFocused('business')} onBlur={() => setFocused(null)}
          >
            <option value="" disabled>{tr.formBusinessPh}</option>
            {tr.formBusinessOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={15} color={C.mid} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* "Autre" reveal */}
      <AnimatePresence>
        {(business === 'Autre' || business === 'Other') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 2 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mid }}>
                {tr.formBusiness === 'Type d\'entreprise' ? 'Précisez votre secteur' : 'Specify your sector'}
              </label>
              <input
                type="text"
                placeholder={tr.formBusiness === 'Type d\'entreprise' ? 'Ex : Coiffure, Garage, Pharmacie...' : 'Ex: Hair salon, Garage, Pharmacy...'}
                value={autre}
                onChange={e => setAutre(e.target.value)}
                style={inputStyle('autre')}
                onFocus={() => setFocused('autre')} onBlur={() => setFocused(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.mid }}>{tr.formMessage}</label>
        <textarea rows={3} placeholder={tr.formMessagePh} style={{ ...inputStyle('msg'), resize: 'none' } as CSSProperties}
          onFocus={() => setFocused('msg')} onBlur={() => setFocused(null)} />
      </div>

      <button style={{
        background: C.blue, color: C.white, border: 'none', borderRadius: 100,
        padding: '13px 0', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', marginTop: 4, transition: 'background 0.2s', width: '100%',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = C.blueDark)}
        onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
        {tr.formSubmit}
      </button>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { lang, tr, toggle } = useLang()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { href: '#features', label: tr.navFeatures },
    { href: '#how',      label: tr.navHow },
    { href: '#pricing',  label: tr.navPricing },
    { href: '#faq',      label: tr.navFaq },
    { href: '#contact',  label: tr.navContact },
  ]

  const howSteps = [
    {
      n: '1', icon: MessageSquare,
      title: lang === 'fr' ? 'Connexion de vos canaux' : 'Connect your channels',
      desc: lang === 'fr' ? 'WhatsApp, Instagram, Facebook, email et plus encore, tout centralisé.' : 'WhatsApp, Instagram, Facebook, email and more, all in one place.',
    },
    {
      n: '2', icon: Bot,
      title: lang === 'fr' ? 'Configuration de votre IA' : 'Configure your AI',
      desc: lang === 'fr' ? 'On paramètre votre assistant avec votre ton, vos services et vos règles.' : 'We set up your assistant with your tone, services and rules.',
    },
    {
      n: '3', icon: Zap,
      title: lang === 'fr' ? 'Automatisations actives' : 'Automations live',
      desc: lang === 'fr' ? 'Réponses, RDV, rappels, commentaires — tout tourne en automatique.' : 'Replies, bookings, reminders, comments — all running automatically.',
    },
    {
      n: '4', icon: LayoutDashboard,
      title: lang === 'fr' ? 'Vous gardez le contrôle' : 'You stay in control',
      desc: lang === 'fr' ? 'Dashboard centralisé, app mobile, notifications en temps réel.' : 'Centralised dashboard, mobile app, real-time notifications.',
    },
  ]

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(18px)',
        background: scrolled ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.75)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 64 }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Répondly" width={30} height={30} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', letterSpacing: '-0.02em', color: C.ink }}>
              Répondly<span style={{ color: C.blue }}>.</span>
            </span>
          </a>
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 13.5, color: C.mid, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
                onMouseLeave={e => (e.currentTarget.style.color = C.mid)}>
                {l.label}
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={toggle} style={{
              background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 100,
              padding: '5px 11px', fontSize: 12, fontWeight: 500, color: C.mid, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <a href="https://app.repondly.com/auth/signin" style={{ fontSize: 13.5, color: C.mid, textDecoration: 'none' }}>{tr.navSignin}</a>
            <a href="#contact" style={{
              background: C.blue, color: C.white, borderRadius: 100,
              padding: '8px 20px', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = C.blueDark)}
              onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
              {tr.navCta}
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start', textAlign: 'center',
        padding: '96px 24px 80px', position: 'relative', overflow: 'hidden',
        background: C.bg,
      }}>
        <Blobs seed={0} opacity={0.65} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
          backgroundSize: '36px 36px', opacity: 0.45,
        }} />

        <motion.h1 variants={fadeUp} custom={0} initial="hidden" animate="visible" style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          lineHeight: 1.1, letterSpacing: '-0.03em',
          maxWidth: 780, position: 'relative', color: C.ink, margin: 0,
        }}>
          {tr.heroTitle}
          <em style={{ fontStyle: 'italic', color: C.blue }}>{tr.heroTitleEm}</em>
        </motion.h1>

        <motion.p variants={fadeUp} custom={1} initial="hidden" animate="visible" style={{
          fontSize: 15, color: C.mid, fontWeight: 300,
          lineHeight: 1.7, maxWidth: 460, marginTop: 18, position: 'relative',
        }}>
          {tr.heroSub}
        </motion.p>

        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible"
          style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
          <a href="#contact" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: C.blue, color: C.white, borderRadius: 100,
            padding: '11px 26px', fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
            boxShadow: '0 4px 18px rgba(26,107,255,0.28)', transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.blueDark)}
            onMouseLeave={e => (e.currentTarget.style.background = C.blue)}>
            {tr.heroBtn1} <ArrowRight size={14} />
          </a>
          <a href="#features" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'transparent', color: C.ink, borderRadius: 100,
            padding: '11px 26px', fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
            border: `1.5px solid ${C.border}`, transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.blue)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
            {tr.heroBtn2}
          </a>
        </motion.div>

        {/* mockup with bottom padding so it doesn't sit on section edge */}
        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible"
          style={{ marginTop: 44, width: '100%', maxWidth: 580, position: 'relative', paddingBottom: 0 }}>
          <ChatMockup />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <Sec id="features" bg={C.bgAlt}>
        <Blobs seed={1} opacity={0.38} />
        <div style={{ ...wrap, position: 'relative' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>{tr.featuresLabel}</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', letterSpacing: '-0.025em', maxWidth: 540, margin: '0 auto', color: C.ink }}>
              {tr.featuresTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7, maxWidth: 420, margin: '12px auto 0', fontWeight: 300 }}>{tr.featuresSub}</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {tr.features.map((f, i) => {
              const Icon = featureIcons[i] ?? MessageSquare
              return (
                <motion.div key={f.title} variants={fadeUp} custom={i}
                  whileHover={{ y: -3, transition: { duration: 0.16 } }}
                  style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 24px 28px', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(26,107,255,0.09)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={17} />
                  </div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1rem', marginBottom: 7, color: C.ink }}>{f.title}</h3>
                  <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ── HOW IT WORKS ── */}
      <Sec id="how" bg={C.bg}>
        <Blobs seed={2} opacity={0.45} />
        <div style={{ ...wrap, position: 'relative' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>{tr.howLabel}</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', letterSpacing: '-0.025em', color: C.ink, maxWidth: 500, margin: '0 auto' }}>
              {tr.howTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7, fontWeight: 300, maxWidth: 400, margin: '12px auto 0' }}>{tr.howSub}</p>
          </motion.div>

          {/* 4-column step cards with connector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 26, left: '12.5%', right: '12.5%', height: 2, background: C.blueLight, zIndex: 0 }} />
            {howSteps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.n} variants={fadeUp} custom={i} style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: i === 0 ? C.blue : C.white,
                    border: `2px solid ${i === 0 ? C.blue : C.border}`,
                    color: i === 0 ? C.white : C.blue,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: i === 0 ? '0 4px 14px rgba(26,107,255,0.28)' : 'none',
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: '16px 15px',
                    boxShadow: '0 2px 10px rgba(26,107,255,0.05)',
                  }}>
                    <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '0.9rem', color: C.ink, marginBottom: 6 }}>{s.title}</h4>
                    <p style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* flow pills */}
          <motion.div variants={fadeUp} style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {[
              { Icon: Zap,          label: lang === 'fr' ? 'Détection IA' : 'AI Detection' },
              { Icon: MessageSquare,label: lang === 'fr' ? 'Réponse instantanée' : 'Instant Reply' },
              { Icon: CalendarCheck,label: lang === 'fr' ? 'Réservation auto' : 'Auto Booking' },
              { Icon: Bell,         label: lang === 'fr' ? 'Rappel envoyé' : 'Reminder Sent' },
              { Icon: CheckCircle,  label: lang === 'fr' ? 'Client satisfait' : 'Happy Client' },
            ].map(({ Icon, label }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: C.blueFaint, border: `1px solid ${C.blueLight}`,
                borderRadius: 100, padding: '7px 14px',
                fontSize: 12.5, color: C.blue, fontWeight: 500,
              }}>
                <Icon size={13} />{label}
              </div>
            ))}
          </motion.div>
        </div>
      </Sec>

      {/* ── PRICING ── */}
      <Sec id="pricing" bg={C.bgAlt}>
        <Blobs seed={3} opacity={0.32} />
        <div style={{ ...wrap, position: 'relative' }}>
          {/* Header */}
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>{tr.pricingLabel}</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', letterSpacing: '-0.025em', color: C.ink, marginBottom: 12 }}>
              {tr.pricingTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7, fontWeight: 300, maxWidth: 460, margin: '0 auto' }}>{tr.pricingSub}</p>
          </motion.div>

          {/* 3-column plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
            {tr.plans.map((plan, i) => {
              const isPro = i === 1
              return (
                <motion.div key={plan.name} variants={fadeUp} custom={i} style={{
                  background: C.white,
                  border: `1px solid ${isPro ? C.blue : C.border}`,
                  borderRadius: 14,
                  padding: 28,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isPro ? '0 4px 28px rgba(26,107,255,0.12)' : 'none',
                  opacity: isPro ? 1 : 0.92,
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Blue top border accent for Pro */}
                  {isPro && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.blue }} />}

                  {/* Recommandé badge */}
                  {isPro && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: C.blueLight, color: C.blue,
                      borderRadius: 100, padding: '3px 10px',
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                      marginBottom: 14,
                    }}>
                      {tr.pricingBadge}
                    </div>
                  )}

                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.mid, marginBottom: 10, marginTop: isPro ? 0 : 14 }}>{plan.name}</p>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.2rem', lineHeight: 1, letterSpacing: '-0.04em', color: C.ink }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: C.mid, fontWeight: 300, marginBottom: 4 }}>{tr.planPer}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.mid, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>{plan.setup}</p>

                  {/* Features */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.ink }}>
                        <Check size={13} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />{f}
                      </li>
                    ))}
                  </ul>

                  <a href="#contact" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: isPro ? C.blue : 'transparent',
                    color: isPro ? C.white : C.blue,
                    border: `1.5px solid ${C.blue}`,
                    borderRadius: 100,
                    padding: '11px 0', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s, color 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = C.white }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPro ? C.blue : 'transparent'; e.currentTarget.style.color = isPro ? C.white : C.blue }}>
                    {tr.planCta} <ArrowRight size={14} />
                  </a>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ── FAQ ── */}
      <Sec id="faq" bg={C.bg}>
        <Blobs seed={4} opacity={0.28} />
        <div style={{ ...wrap, maxWidth: 740, position: 'relative' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>{tr.faqLabel}</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', letterSpacing: '-0.025em', color: C.ink }}>{tr.faqTitle}</h2>
          </motion.div>
          <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tr.faqs.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </motion.div>
        </div>
      </Sec>

      {/* ── CONTACT ── */}
      <Sec id="contact" bg={C.bgAlt}>
        <Blobs seed={5} opacity={0.38} />
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start', position: 'relative' }}>
          <div>
            <motion.p variants={fadeUp} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blue, marginBottom: 12 }}>{tr.contactLabel}</motion.p>
            <motion.h2 variants={fadeUp} style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)', letterSpacing: '-0.025em', color: C.ink, marginBottom: 12 }}>
              {tr.contactTitle}
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.7, fontWeight: 300, marginBottom: 28 }}>{tr.contactSub}</motion.p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([MapPin, Clock, Languages] as const).map((Icon, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 13, color: C.mid }}>
                  <Icon size={14} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />
                  {tr.contactInfo[i]?.text}
                </motion.div>
              ))}
            </div>
          </div>
          <ContactForm tr={tr} />
        </div>
      </Sec>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '28px 48px', background: C.white }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Répondly" width={22} height={22} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1rem', color: C.ink, letterSpacing: '-0.02em' }}>
              Répondly<span style={{ color: C.blue }}>.</span>
            </span>
          </a>
          <p style={{ fontSize: 12, color: C.mid }}>{tr.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}
