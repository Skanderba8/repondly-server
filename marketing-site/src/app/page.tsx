'use client'
import { useState, useEffect, useRef, CSSProperties } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, CalendarCheck, Bell, Globe, UserCheck, ArrowRight,
  Check, Plus, MapPin, Clock, Languages,
  Bot, Zap, CheckCircle, Smartphone, LayoutDashboard,
  ChevronDown, Menu, X,
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'

// ── Design tokens ─────────────────────────────────────────────────────────────
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
  white:     '#ffffff',
}

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }

const featureIcons = [MessageSquare, CalendarCheck, Bell, MessageSquare, Globe, UserCheck, Smartphone, LayoutDashboard]

// ── Background patterns ───────────────────────────────────────────────────────

/** Pattern A — dot grid (hero) */
function PatternDots() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `radial-gradient(circle, #c8d6e8 1px, transparent 1px)`,
      backgroundSize: '28px 28px', opacity: 0.45,
    }} />
  )
}

/** Pattern B — diagonal hairlines (features / pricing) */
function PatternDiagonal() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `repeating-linear-gradient(
        135deg,
        transparent,
        transparent 18px,
        rgba(26,107,255,0.055) 18px,
        rgba(26,107,255,0.055) 19px
      )`,
      opacity: 1,
    }} />
  )
}

/** Pattern C — subtle grid squares (how / faq / contact) */
function PatternGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(26,107,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26,107,255,0.05) 1px, transparent 1px)
      `,
      backgroundSize: '36px 36px',
      opacity: 1,
    }} />
  )
}

// ── Soft glow ─────────────────────────────────────────────────────────────────
function Glow({ x = '70%', y = '30%', size = 600, opacity = 0.10 }: {
  x?: string; y?: string; size?: number; opacity?: number
}) {
  return (
    <div style={{
      position: 'absolute', pointerEvents: 'none',
      left: x, top: y, width: size, height: size,
      transform: 'translate(-50%,-50%)', borderRadius: '50%',
      background: `radial-gradient(circle, rgba(26,107,255,${opacity}) 0%, transparent 70%)`,
    }} />
  )
}

// ── useBreakpoint ─────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn, { passive: true })
    fn()
    return () => window.removeEventListener('resize', fn)
  }, [])
  return { isMobile: w < 768, isTablet: w < 1024, w }
}

// ── useActiveSection ──────────────────────────────────────────────────────────
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

// ── DEMO: Booking flow ────────────────────────────────────────────────────────
function BookingDemo({ active, fading }: { active: boolean; fading: boolean }) {
  const STEPS = [
    { dir: 'left',    text: 'Salam! prix mta3na yabda men 49 DT/mois. Tnajem tchouf les détails: repondly.com/tarifs' },
    { dir: 'left',    text: 'T7eb nreservilk appel bech na7kiw akther?' },
    { dir: 'right',   text: 'Oui n7eb nchouf démo' },
    { dir: 'booking', text: '' },
  ]
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!active) return
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setShown(0), 0))
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setShown(i + 1), 800 + i * 1800))
    })
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 272, justifyContent: 'flex-end' }}>
      <AnimatePresence>
        {shown >= 1 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: fading ? 0 : 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 5 }}>
            {['Darija', 'Français', 'Arabe'].map((l, i) => (
              <span key={l} style={{
                fontSize: 10.5, padding: '2px 9px', borderRadius: 100,
                background: i === 0 ? C.blueLight : 'transparent',
                color: i === 0 ? C.blue : C.muted,
                border: `1px solid ${i === 0 ? C.blueLight : C.border}`,
                fontWeight: i === 0 ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
              }}>{l}</span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {STEPS.map((step, i) => (
        <AnimatePresence key={i}>
          {shown > i && (
            <motion.div
              initial={{ opacity: 0, y: 7 }} animate={{ opacity: fading ? 0 : 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.35 }}
              style={{ display: 'flex', gap: 8, flexDirection: step.dir === 'right' ? 'row-reverse' : 'row', flexShrink: 0 }}>
              {step.dir !== 'booking' && (
                <div style={{
                  width: 27, height: 27, borderRadius: '50%', flexShrink: 0,
                  background: step.dir === 'right' ? C.blueLight : '#eef0f3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                  color: step.dir === 'right' ? C.blue : C.mid,
                }}>
                  {step.dir === 'right' ? 'C' : <Bot size={12} />}
                </div>
              )}
              {step.dir === 'booking' ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                  style={{
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: '12px 14px', boxShadow: '0 2px 16px rgba(26,107,255,0.09)',
                    width: '100%', maxWidth: 210,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <CalendarCheck size={12} color={C.blue} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>Réserver une démo</span>
                  </div>
                  <p style={{ fontSize: 11, color: C.mid, margin: '0 0 9px', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                    Choisissez un créneau horaire qui vous convient.
                  </p>
                  <div style={{
                    background: C.blue, color: C.white, borderRadius: 7,
                    padding: '7px 0', fontSize: 11, fontWeight: 500, textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Voir le calendrier →
                  </div>
                </motion.div>
              ) : (
                <div style={{
                  maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55,
                  borderBottomRightRadius: step.dir === 'right' ? 3 : 12,
                  borderBottomLeftRadius: step.dir === 'left' ? 3 : 12,
                  background: step.dir === 'right' ? C.blue : C.bgAlt,
                  color: step.dir === 'right' ? C.white : C.ink,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {step.text}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <AnimatePresence>
        {!fading && shown > 0 && shown < STEPS.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 27, height: 27, borderRadius: '50%', background: '#eef0f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={12} color={C.mid} />
            </div>
            <div style={{ padding: '9px 12px', borderRadius: 12, borderBottomLeftRadius: 3, background: C.bgAlt, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <motion.span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: C.mid, display: 'block' }}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── DEMO: Chat ────────────────────────────────────────────────────────────────
const chatConvos = [
  {
    channel: 'WhatsApp', color: '#25d366',
    msgs: [
      { side: 'left' as const,  text: 'Bonjour, je voudrais prendre un rendez-vous pour demain.' },
      { side: 'right' as const, text: 'Bonjour ! Quelle heure vous convient le mieux, matin ou après-midi ?' },
      { side: 'left' as const,  text: '10h si possible.' },
      { side: 'right' as const, text: 'Parfait. RDV mardi à 10h confirmé. Un rappel vous sera envoyé 1h avant. ✓' },
    ],
  },
  {
    channel: 'Instagram', color: '#e1306c',
    msgs: [
      { side: 'left' as const,  text: 'Bonjour, quels sont vos horaires d\'ouverture ?' },
      { side: 'right' as const, text: 'Bonjour ! Nous sommes ouverts lundi–samedi, 9h à 19h.' },
      { side: 'left' as const,  text: 'Vous proposez des consultations en ligne ?' },
      { side: 'right' as const, text: 'Oui ! Je peux vous réserver un créneau en ligne dès maintenant si vous souhaitez.' },
    ],
  },
]

function ChatDemo({ convo, active, fading }: { convo: typeof chatConvos[0]; active: boolean; fading: boolean }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!active) return
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setShown(0), 0))
    convo.msgs.forEach((_, i) => {
      timers.push(setTimeout(() => setShown(i + 1), 800 + i * 1750))
    })
    return () => timers.forEach(clearTimeout)
  }, [active, convo])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 272, justifyContent: 'flex-end' }}>
      <AnimatePresence mode="popLayout">
        {convo.msgs.slice(0, shown).map((msg, i) => (
          <motion.div key={i} layout
            initial={{ opacity: 0, y: 7 }} animate={{ opacity: fading ? 0 : 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.32 }}
            style={{ display: 'flex', gap: 8, flexDirection: msg.side === 'right' ? 'row-reverse' : 'row', flexShrink: 0 }}>
            <div style={{
              width: 27, height: 27, borderRadius: '50%', flexShrink: 0,
              background: msg.side === 'right' ? C.blueLight : '#eef0f3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
              color: msg.side === 'right' ? C.blue : C.mid,
            }}>
              {msg.side === 'right' ? <Bot size={12} /> : 'C'}
            </div>
            <div style={{
              maxWidth: '74%', padding: '8px 12px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55,
              borderBottomRightRadius: msg.side === 'right' ? 3 : 12,
              borderBottomLeftRadius: msg.side === 'left' ? 3 : 12,
              background: msg.side === 'right' ? C.blue : C.bgAlt,
              color: msg.side === 'right' ? C.white : C.ink,
              fontFamily: 'Inter, sans-serif',
            }}>
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {!fading && shown > 0 && shown < convo.msgs.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 27, height: 27, borderRadius: '50%', background: '#eef0f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={12} color={C.mid} />
            </div>
            <div style={{ padding: '9px 12px', borderRadius: 12, borderBottomLeftRadius: 3, background: C.bgAlt, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <motion.span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: C.mid, display: 'block' }}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Hero mockup ───────────────────────────────────────────────────────────────
const DEMOS = [
  { label: 'Prise de démo',  channel: 'WhatsApp',  color: '#25d366' },
  { label: 'Répondly Chat',  channel: 'WhatsApp',  color: '#25d366' },
  { label: 'Répondly Chat',  channel: 'Instagram', color: '#e1306c' },
]
const DEMO_DURATION = 9500

function HeroMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, margin: '-40px' })
  const [ci, setCi] = useState(0)
  const [fading, setFading] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setFading(true), DEMO_DURATION - 800)
    const t2 = setTimeout(() => {
      setFading(false)
      setKey(k => k + 1)
      setCi(c => (c + 1) % DEMOS.length)
    }, DEMO_DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [inView, ci])

  const demo = DEMOS[ci]

  return (
    <div ref={ref} style={{
      borderRadius: 18, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      boxShadow: '0 16px 48px rgba(26,107,255,0.11), 0 2px 8px rgba(0,0,0,0.04)',
      background: C.white,
    }}>
      {/* Chrome bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: C.bgAlt }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <motion.div key={`dot-${ci}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: demo.color }} />
          <motion.span key={`lbl-${ci}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: 11.5, color: C.mid, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
            {demo.channel} — Répondly
          </motion.span>
        </div>
      </div>

      <div style={{ padding: '18px 18px 14px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={`demo-${ci}-${key}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>
            {ci === 0
              ? <BookingDemo active={inView} fading={fading} />
              : <ChatDemo convo={chatConvos[ci - 1]} active={inView} fading={fading} />
            }
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', gap: 5, padding: '2px 16px 13px', justifyContent: 'center' }}>
        {DEMOS.map((d, i) => (
          <button key={i} onClick={() => { setFading(false); setKey(k => k + 1); setCi(i) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: i === ci ? 600 : 400,
              background: i === ci ? C.blueLight : 'transparent',
              color: i === ci ? C.blue : C.muted,
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: i === ci ? C.blue : d.color, opacity: i === ci ? 1 : 0.5 }} />
            {d.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: C.border, position: 'relative', overflow: 'hidden' }}>
        <motion.div key={`bar-${ci}-${key}`}
          initial={{ width: '0%' }} animate={{ width: '100%' }}
          transition={{ duration: DEMO_DURATION / 1000, ease: 'linear' }}
          style={{ height: '100%', background: C.blue, position: 'absolute', left: 0, top: 0 }} />
      </div>
    </div>
  )
}

// ── Stats row ─────────────────────────────────────────────────────────────────
function StatsRow({ lang, isMobile }: { lang: string; isMobile: boolean }) {
  const stats = lang === 'fr'
    ? [
        { value: '+200', label: 'entreprises actives' },
        { value: '98%',  label: 'satisfaction client' },
        { value: '24/7', label: 'disponibilité IA' },
        { value: '<2s',  label: 'temps de réponse' },
      ]
    : [
        { value: '200+', label: 'active businesses' },
        { value: '98%',  label: 'client satisfaction' },
        { value: '24/7', label: 'AI availability' },
        { value: '<2s',  label: 'response time' },
      ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, auto)',
      gap: isMobile ? '16px 24px' : '0 28px',
    }}>
      {stats.map((s, i) => (
        <div key={i}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? '1.3rem' : '1.45rem',
            color: C.ink, letterSpacing: '-0.03em', lineHeight: 1,
          }}>{s.value}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div variants={fadeUp} onClick={() => setOpen(o => !o)}
      style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 0', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 15, color: C.ink, lineHeight: 1.4, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.22 }}
          style={{ color: C.blue, flexShrink: 0, display: 'flex' }}>
          <Plus size={16} />
        </motion.span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', color: C.mid, fontSize: 14, lineHeight: 1.8, margin: '12px 0 0', fontWeight: 300, fontFamily: 'Inter, sans-serif' }}>
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Sec({ id, children, bg = C.bg, pattern, style = {} }: {
  id?: string
  children: React.ReactNode
  bg?: string
  pattern?: 'dots' | 'diagonal' | 'grid'
  style?: CSSProperties
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.section id={id} ref={ref}
      variants={stagger} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      style={{
        background: bg,
        padding: 'var(--sec-pad-v) var(--sec-pad-h)',
        position: 'relative', overflow: 'hidden',
        ...style,
      }}>
      {pattern === 'dots'     && <PatternDots />}
      {pattern === 'diagonal' && <PatternDiagonal />}
      {pattern === 'grid'     && <PatternGrid />}
      {children}
    </motion.section>
  )
}

const wrap: CSSProperties = { maxWidth: 1080, margin: '0 auto', position: 'relative' }

function Eyebrow({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.13em',
      textTransform: 'uppercase', color: C.blue, margin: '0 0 12px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {label}
    </p>
  )
}

// ── Contact form ──────────────────────────────────────────────────────────────
function ContactForm({ tr }: { tr: ReturnType<typeof import('@/lib/LangContext').useLang>['tr'] }) {
  const [business, setBusiness] = useState('')
  const [autre, setAutre] = useState('')
  const [focused, setFocused] = useState<string | null>(null)

  const inp = (name: string): CSSProperties => ({
    background: C.white, border: `1.5px solid ${focused === name ? C.blue : C.border}`,
    borderRadius: 9, padding: '11px 14px', fontSize: 14, color: C.ink,
    outline: 'none', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.18s', width: '100%',
    boxSizing: 'border-box',
  })

  return (
    <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      {[
        { label: tr.formName,  type: 'text', ph: tr.formNamePh,  name: 'name' },
        { label: tr.formPhone, type: 'tel',  ph: tr.formPhonePh, name: 'phone' },
      ].map(f => (
        <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.mid, fontFamily: "'DM Sans', sans-serif" }}>
            {f.label}
          </label>
          <input type={f.type} placeholder={f.ph} style={inp(f.name)}
            onFocus={() => setFocused(f.name)} onBlur={() => setFocused(null)} />
        </div>
      ))}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.mid, fontFamily: "'DM Sans', sans-serif" }}>
          {tr.formBusiness}
        </label>
        <div style={{ position: 'relative' }}>
          <select value={business} onChange={e => setBusiness(e.target.value)}
            style={{ ...inp('business'), appearance: 'none', paddingRight: 34, cursor: 'pointer', color: business ? C.ink : C.mid } as CSSProperties}
            onFocus={() => setFocused('business')} onBlur={() => setFocused(null)}>
            <option value="" disabled>{tr.formBusinessPh}</option>
            {tr.formBusinessOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} color={C.mid} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      <AnimatePresence>
        {(business === 'Autre' || business === 'Other') && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.mid, fontFamily: "'DM Sans', sans-serif" }}>
                Précisez
              </label>
              <input type="text" placeholder="Ex : Coiffure, Pharmacie, Garage…" value={autre}
                onChange={e => setAutre(e.target.value)} style={inp('autre')}
                onFocus={() => setFocused('autre')} onBlur={() => setFocused(null)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.mid, fontFamily: "'DM Sans', sans-serif" }}>
          {tr.formMessage}
        </label>
        <textarea rows={3} placeholder={tr.formMessagePh}
          style={{ ...inp('msg'), resize: 'none' } as CSSProperties}
          onFocus={() => setFocused('msg')} onBlur={() => setFocused(null)} />
      </div>

      <button style={{
        background: C.blue, color: C.white, border: 'none', borderRadius: 100,
        padding: '13px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif", marginTop: 4, transition: 'all 0.18s', width: '100%',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = C.blueDark; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'none' }}>
        {tr.formSubmit}
      </button>
    </motion.div>
  )
}

// ── Mobile nav drawer ─────────────────────────────────────────────────────────
function MobileDrawer({
  open, onClose, navLinks, lang, toggle, tr,
}: {
  open: boolean
  onClose: () => void
  navLinks: { href: string; label: string }[]
  lang: string
  toggle: () => void
  tr: { navCta: string; navSignin: string }
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(13,27,46,0.35)',
              backdropFilter: 'blur(4px)', zIndex: 199,
            }}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(80vw, 300px)',
              background: C.white, zIndex: 200,
              boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column',
              padding: '20px 24px 32px',
            }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.05rem', color: C.ink }}>
                Répondly<span style={{ color: C.blue }}>.</span>
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mid, padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              {navLinks.map((l, i) => (
                <motion.a
                  key={l.href} href={l.href} onClick={onClose}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    fontSize: 16, color: C.ink, textDecoration: 'none',
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                    padding: '12px 8px', borderRadius: 8,
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                  {l.label}
                </motion.a>
              ))}
            </nav>

            {/* Bottom actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              <a href="https://app.repondly.com/auth/signin"
                style={{
                  fontSize: 14, color: C.mid, textDecoration: 'none', fontWeight: 400,
                  fontFamily: "'DM Sans', sans-serif", padding: '10px 0', textAlign: 'center',
                }}>
                {tr.navSignin}
              </a>
              <a href="#contact" onClick={onClose} style={{
                background: C.blue, color: C.white, borderRadius: 100,
                padding: '12px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", textAlign: 'center',
              }}>
                {tr.navCta}
              </a>
              <button onClick={() => { toggle(); onClose() }} style={{
                background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 100,
                padding: '9px 12px', fontSize: 12, fontWeight: 500, color: C.mid, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {lang === 'fr' ? '🌐 EN' : '🌐 FR'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Sticky mobile CTA bar ─────────────────────────────────────────────────────
function StickyMobileCta({ label, contactInView }: { label: string; contactInView: boolean }) {
  return (
    <AnimatePresence>
      {!contactInView && (
        <motion.div
          initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
          transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          className="safe-bottom"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.97)',
            borderTop: `1px solid ${C.border}`,
            backdropFilter: 'blur(12px)',
          }}>
          <a href="#contact" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: C.blue, color: C.white, borderRadius: 100,
            padding: '13px 0', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif", width: '100%',
          }}>
            {label} <ArrowRight size={14} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { lang, tr, toggle } = useLang()
  const { isMobile, isTablet } = useBreakpoint()
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const contactRef = useRef<HTMLElement>(null)
  const contactInView = useInView(contactRef, { margin: '0px' })

  const sectionIds = ['features', 'how', 'pricing', 'faq', 'contact']
  const activeSection = useActiveSection(sectionIds)

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
      desc:  lang === 'fr' ? 'WhatsApp, Instagram, Facebook, email — tout centralisé en un seul endroit.' : 'WhatsApp, Instagram, Facebook, email — all in one place.',
    },
    {
      n: '2', icon: Bot,
      title: lang === 'fr' ? 'Configuration de votre IA' : 'Configure your AI',
      desc:  lang === 'fr' ? 'On paramètre votre assistant avec votre ton, vos services et vos règles métier.' : 'We set up your assistant with your tone, services and business rules.',
    },
    {
      n: '3', icon: Zap,
      title: lang === 'fr' ? 'Automatisations actives' : 'Automations live',
      desc:  lang === 'fr' ? 'Réponses, RDV, rappels, commentaires — tout tourne en automatique.' : 'Replies, bookings, reminders, comments — all running automatically.',
    },
    {
      n: '4', icon: LayoutDashboard,
      title: lang === 'fr' ? 'Vous gardez le contrôle' : 'You stay in control',
      desc:  lang === 'fr' ? 'Dashboard centralisé, app mobile, notifications en temps réel.' : 'Centralised dashboard, mobile app, real-time notifications.',
    },
  ]

  // ── Computed layout values ─────────────────────────────────────────────────
  const heroPad  = isMobile ? '0 16px' : isTablet ? '0 24px' : '0 48px'
  const heroGrid = isMobile
    ? { display: 'flex', flexDirection: 'column' as const, gap: 40 }
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(18px) saturate(160%)',
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)',
        borderBottom: `1px solid ${scrolled ? C.border : 'transparent'}`,
        transition: 'all 0.3s',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 20px' : '0 40px', height: 60,
        }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Répondly" width={28} height={28} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.18rem', letterSpacing: '-0.02em', color: C.ink }}>
              Répondly<span style={{ color: C.blue }}>.</span>
            </span>
          </a>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {navLinks.map(l => (
                <a key={l.href} href={l.href}
                  style={{
                    fontSize: 13.5, textDecoration: 'none', fontWeight: 400,
                    padding: '4px 10px', borderRadius: 8,
                    fontFamily: "'DM Sans', sans-serif",
                    color: activeSection === l.href.slice(1) ? C.blue : C.mid,
                    background: activeSection === l.href.slice(1) ? C.blueLight : 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (activeSection !== l.href.slice(1)) e.currentTarget.style.color = C.ink }}
                  onMouseLeave={e => { if (activeSection !== l.href.slice(1)) e.currentTarget.style.color = C.mid }}>
                  {l.label}
                </a>
              ))}
              {!isTablet && (
                <>
                  <div style={{ width: 1, height: 16, background: C.border, margin: '0 4px' }} />
                  <a href="https://repondly.com/privacy"
                    style={{ fontSize: 12, color: C.muted, textDecoration: 'none', padding: '4px 7px', fontFamily: "'DM Sans', sans-serif" }}>
                    Confidentialité
                  </a>
                  <a href="https://repondly.com/terms"
                    style={{ fontSize: 12, color: C.muted, textDecoration: 'none', padding: '4px 7px', fontFamily: "'DM Sans', sans-serif" }}>
                    CGU
                  </a>
                </>
              )}
            </nav>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isMobile && (
              <>
                <button onClick={toggle} style={{
                  background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 100,
                  padding: '5px 12px', fontSize: 12, fontWeight: 500, color: C.mid, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.blue)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                  {lang === 'fr' ? 'EN' : 'FR'}
                </button>
                <a href="https://app.repondly.com/auth/signin"
                  style={{ fontSize: 13.5, color: C.mid, textDecoration: 'none', fontWeight: 400, padding: '5px 6px', fontFamily: "'DM Sans', sans-serif" }}>
                  {tr.navSignin}
                </a>
                <a href="#contact" style={{
                  background: C.blue, color: C.white, borderRadius: 100,
                  padding: '8px 20px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.18s', boxShadow: '0 2px 10px rgba(26,107,255,0.25)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.blueDark; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'none' }}>
                  {tr.navCta}
                </a>
              </>
            )}

            {/* Mobile: signin link + hamburger */}
            {isMobile && (
              <>
                <a href="https://app.repondly.com/auth/signin"
                  style={{ fontSize: 13, color: C.mid, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                  {tr.navSignin}
                </a>
                <button onClick={() => setDrawerOpen(true)} style={{
                  background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '7px 9px', cursor: 'pointer', color: C.mid, display: 'flex',
                }}>
                  <Menu size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen} onClose={() => setDrawerOpen(false)}
        navLinks={navLinks} lang={lang} toggle={toggle} tr={tr}
      />

      {/* Sticky mobile CTA */}
      {isMobile && (
        <StickyMobileCta label={tr.navCta} contactInView={contactInView} />
      )}

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        padding: heroPad,
        position: 'relative', overflow: 'hidden',
        background: C.bg,
        display: 'flex', alignItems: 'center',
      }}>
        <PatternDots />
        <Glow x="64%" y="44%" size={700} opacity={0.09} />
        <Glow x="10%" y="70%" size={350} opacity={0.06} />

        <div style={{
          ...wrap,
          width: '100%',
          ...heroGrid,
          paddingTop: isMobile ? 80 : 60,
          paddingBottom: isMobile ? 100 : 0, /* space for sticky CTA */
        }}>
          {/* LEFT — text */}
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.h1 variants={fadeUp} custom={0} style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: isMobile ? 'clamp(2rem, 9vw, 2.8rem)' : 'clamp(2.4rem, 4vw, 3.5rem)',
              lineHeight: 1.08, letterSpacing: '-0.03em',
              color: C.ink, margin: '0 0 18px',
            }}>
              {tr.heroTitle}
              <em style={{ fontStyle: 'italic', color: C.blue, display: 'block' }}>{tr.heroTitleEm}</em>
            </motion.h1>

            <motion.p variants={fadeUp} custom={1} style={{
              fontSize: isMobile ? 15 : 16, color: C.mid, fontWeight: 300,
              lineHeight: 1.8, maxWidth: 400, margin: '0 0 30px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {tr.heroSub}
            </motion.p>

            <motion.div variants={fadeUp} custom={2} style={{
              display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40,
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <a href="#contact" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: C.blue, color: C.white, borderRadius: 100,
                padding: isMobile ? '14px 28px' : '12px 26px',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 18px rgba(26,107,255,0.28)', transition: 'all 0.18s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.blueDark; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'none' }}>
                {tr.heroBtn1} <ArrowRight size={14} />
              </a>
              <a href="#features" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: 'transparent', color: C.ink, borderRadius: 100,
                padding: isMobile ? '14px 28px' : '12px 26px',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif",
                border: `1.5px solid ${C.border}`, transition: 'border-color 0.18s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.blue)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                {tr.heroBtn2}
              </a>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}
              style={{ height: 1, background: C.border, marginBottom: 26, maxWidth: 360 }} />

            <motion.div variants={fadeUp} custom={4}>
              <StatsRow lang={lang} isMobile={isMobile} />
            </motion.div>
          </motion.div>

          {/* RIGHT — mockup */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%' }}>
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <Sec id="features" bg={C.bgAlt} pattern="diagonal">
        <div style={wrap}>
          <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
            <Eyebrow label={tr.featuresLabel} />
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', letterSpacing: '-0.025em',
              maxWidth: 500, color: C.ink, margin: '0 0 10px', lineHeight: 1.2,
            }}>
              {tr.featuresTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.8, maxWidth: 400, fontWeight: 300, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {tr.featuresSub}
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
          }}>
            {tr.features.map((f, i) => {
              const Icon = featureIcons[i] ?? MessageSquare
              return (
                <motion.div key={f.title} variants={fadeUp} custom={i}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, padding: '22px 20px 24px' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(26,107,255,0.08)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>
                    <Icon size={16} />
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6, color: C.ink, lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
                    {f.title}
                  </h3>
                  <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.75, fontWeight: 300, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {f.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <Sec id="how" bg={C.bg} pattern="grid">
        <div style={wrap}>
          <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
            <Eyebrow label={tr.howLabel} />
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', letterSpacing: '-0.025em',
              color: C.ink, maxWidth: 460, margin: '0 0 10px', lineHeight: 1.2,
            }}>
              {tr.howTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.8, fontWeight: 300, maxWidth: 380, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {tr.howSub}
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 12, position: 'relative',
          }}>
            {/* Connector line — desktop only */}
            {!isMobile && !isTablet && (
              <div style={{ position: 'absolute', top: 23, left: '12%', right: '12%', height: 1, background: C.border, zIndex: 0 }} />
            )}
            {howSteps.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.n} variants={fadeUp} custom={i} style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: i === 0 ? C.blue : C.white,
                    border: `1.5px solid ${i === 0 ? C.blue : C.border}`,
                    color: i === 0 ? C.white : C.blue,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: isMobile ? '0 0 14px' : '0 auto 14px',
                    boxShadow: i === 0 ? '0 4px 14px rgba(26,107,255,0.28)' : 'none',
                  }}>
                    <Icon size={17} />
                  </div>
                  <div style={{ background: C.bgAlt, borderRadius: 11, padding: '14px 13px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.blue, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 5px', fontFamily: "'DM Sans', sans-serif" }}>
                      Étape {s.n}
                    </p>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: C.ink, margin: '0 0 5px', lineHeight: 1.3, fontFamily: "'DM Sans', sans-serif" }}>
                      {s.title}
                    </h4>
                    <p style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.7, fontWeight: 300, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.div variants={fadeUp} style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {[
              { Icon: Zap,          label: lang === 'fr' ? 'Détection IA' : 'AI Detection' },
              { Icon: MessageSquare,label: lang === 'fr' ? 'Réponse instantanée' : 'Instant Reply' },
              { Icon: CalendarCheck,label: lang === 'fr' ? 'Réservation auto' : 'Auto Booking' },
              { Icon: Bell,         label: lang === 'fr' ? 'Rappel envoyé' : 'Reminder Sent' },
              { Icon: CheckCircle,  label: lang === 'fr' ? 'Client satisfait' : 'Happy Client' },
            ].map(({ Icon, label }, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: C.blueLight, borderRadius: 100, padding: '6px 13px',
                  fontSize: 12.5, color: C.blue, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  <Icon size={12} />{label}
                </div>
                {i < arr.length - 1 && <span style={{ color: C.border, fontSize: 14, marginLeft: 2 }}>›</span>}
              </div>
            ))}
          </motion.div>
        </div>
      </Sec>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <Sec id="pricing" bg={C.bgAlt} pattern="diagonal">
        <div style={wrap}>
          <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
            <Eyebrow label={tr.pricingLabel} />
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', letterSpacing: '-0.025em',
              color: C.ink, margin: '0 0 10px', lineHeight: 1.2,
            }}>
              {tr.pricingTitle}
            </h2>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.8, fontWeight: 300, maxWidth: 420, margin: 0, fontFamily: 'Inter, sans-serif' }}>
              {tr.pricingSub}
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(3, 1fr)',
            gap: 16, alignItems: 'start',
            maxWidth: isTablet && !isMobile ? 480 : undefined,
          }}>
            {tr.plans.map((plan, i) => {
              const isPro = i === 1
              return (
                <motion.div key={plan.name} variants={fadeUp} custom={i} style={{
                  background: C.white,
                  border: `1.5px solid ${isPro ? C.blue : C.border}`,
                  borderRadius: 14, padding: 26,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: isPro ? '0 8px 32px rgba(26,107,255,0.13)' : 'none',
                  display: 'flex', flexDirection: 'column',
                  transform: isPro && !isMobile ? 'scale(1.02)' : 'scale(1)',
                  /* On mobile, Pro card gets extra top border accent */
                  marginTop: isPro && isMobile ? 0 : 0,
                }}>
                  {isPro && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.blue }} />
                  )}
                  {isPro && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: C.blueLight, color: C.blue, borderRadius: 100,
                      padding: '3px 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                      marginBottom: 12, width: 'fit-content',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {tr.pricingBadge}
                    </div>
                  )}

                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 10, marginTop: isPro ? 0 : 10, fontFamily: "'DM Sans', sans-serif" }}>
                    {plan.name}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.1rem', lineHeight: 1, letterSpacing: '-0.04em', color: C.ink }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 13, color: C.mid, fontWeight: 300, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                      {tr.planPer}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.mid, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, fontFamily: 'Inter, sans-serif' }}>
                    {plan.setup}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13.5, color: C.ink, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                        <Check size={13} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />{f}
                      </li>
                    ))}
                  </ul>

                  <a href="#contact" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: isPro ? C.blue : 'transparent',
                    color: isPro ? C.white : C.blue,
                    border: `1.5px solid ${C.blue}`,
                    borderRadius: 100, padding: '11px 0', fontSize: 14, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.18s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = C.white; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isPro ? C.blue : 'transparent'; e.currentTarget.style.color = isPro ? C.white : C.blue; e.currentTarget.style.transform = 'none' }}>
                    {tr.planCta} <ArrowRight size={13} />
                  </a>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Sec>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <Sec id="faq" bg={C.bg} pattern="grid">
        <div style={{ ...wrap, maxWidth: 700 }}>
          <motion.div variants={fadeUp} style={{ marginBottom: 36 }}>
            <Eyebrow label={tr.faqLabel} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', letterSpacing: '-0.025em', color: C.ink, lineHeight: 1.2, margin: 0 }}>
              {tr.faqTitle}
            </h2>
          </motion.div>
          <motion.div variants={stagger} style={{ borderTop: `1px solid ${C.border}` }}>
            {tr.faqs.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </motion.div>
        </div>
      </Sec>

      {/* ── CONTACT ─────────────────────────────────────────────────────── */}
      <Sec
        id="contact" bg={C.bgAlt} pattern="grid"
        style={{ paddingBottom: isMobile ? 120 : undefined } as CSSProperties}
        // @ts-expect-error — forward ref via section element
        ref={contactRef}
      >
        <div style={{
          ...wrap,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 36 : 60,
          alignItems: 'start',
        }}>
          {/* Left — info */}
          <div>
            <motion.div variants={fadeUp}><Eyebrow label={tr.contactLabel} /></motion.div>
            <motion.h2 variants={fadeUp} style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', letterSpacing: '-0.025em',
              color: C.ink, margin: '0 0 12px', lineHeight: 1.2,
            }}>
              {tr.contactTitle}
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: C.mid, fontSize: 14, lineHeight: 1.8, fontWeight: 300, marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
              {tr.contactSub}
            </motion.p>

            {/* Info — pills on mobile, list on desktop */}
            {isMobile ? (
              <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {([MapPin, Clock, Languages] as const).map((Icon, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 100,
                    padding: '8px 14px', fontSize: 13, color: C.mid,
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    <Icon size={13} color={C.blue} />
                    <span>{tr.contactInfo[i]?.text}</span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([MapPin, Clock, Languages] as const).map((Icon, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 14, color: C.mid }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={C.blue} />
                    </div>
                    <div style={{ paddingTop: 6, lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>
                      {tr.contactInfo[i]?.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right — form */}
          <motion.div variants={fadeUp} style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: isMobile ? 20 : 30,
            boxShadow: '0 4px 18px rgba(26,107,255,0.06)',
          }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', color: C.ink, margin: '0 0 20px' }}>
              {lang === 'fr' ? "Démarrez dès aujourd'hui" : 'Get started today'}
            </h3>
            <ContactForm tr={tr} />
          </motion.div>
        </div>
      </Sec>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: isMobile ? '16px 20px' : '20px 40px',
        background: C.white,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Répondly" width={20} height={20} style={{ objectFit: 'contain' }} />
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '0.95rem', color: C.ink, letterSpacing: '-0.02em' }}>
              Répondly<span style={{ color: C.blue }}>.</span>
            </span>
          </a>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Confidentialité', href: 'https://repondly.com/privacy' },
              { label: 'CGU',             href: 'https://repondly.com/terms' },
              { label: 'SLA',             href: 'https://repondly.com/sla' },
            ].map(l => (
              <a key={l.href} href={l.href}
                style={{ fontSize: 12.5, color: C.muted, textDecoration: 'none', transition: 'color 0.15s', fontFamily: "'DM Sans', sans-serif" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                {l.label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, fontFamily: 'Inter, sans-serif' }}>{tr.footerRights}</p>
        </div>
      </footer>
    </div>
  )
}