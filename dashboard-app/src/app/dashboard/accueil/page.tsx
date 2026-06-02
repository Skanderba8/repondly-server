'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, Zap, ArrowRight, ShoppingBag } from 'lucide-react'
import PageTransition from '@/components/ui/PageTransition'
import SkeletonCard from '@/components/ui/SkeletonCard'

interface RecentConv {
  id: number
  name: string
  time: number
  channel: string
  unread: number
}

interface Stats {
  openConvs: number
  resolvedToday: number
  handovers: number
  orders: number
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() / 1000 - ts) / 60)
  if (diff < 1) return 'À l\'instant'
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function channelLabel(ch: string) {
  const k = ch.toLowerCase()
  if (k.includes('whatsapp')) return { label: 'WhatsApp', color: '#22C55E' }
  if (k.includes('instagram')) return { label: 'Instagram', color: '#EC4899' }
  if (k.includes('facebook')) return { label: 'Facebook', color: '#6C63FF' }
  return { label: ch || 'Conversation', color: 'var(--text-muted)' }
}

const KPIS = [
  { key: 'openConvs',     label: 'En attente',         sub: 'conversations ouvertes',  icon: Clock,         accent: '#F59E0B', href: '/dashboard/messagerie' },
  { key: 'resolvedToday', label: 'Traités aujourd\'hui', sub: 'résolues aujourd\'hui',   icon: MessageSquare, accent: '#22C55E', href: null },
  { key: 'handovers',     label: 'Interventions',       sub: 'transferts humains',       icon: Zap,           accent: '#6C63FF', href: null },
  { key: 'orders',        label: 'Commandes',           sub: 'commandes en attente',     icon: ShoppingBag,   accent: '#BF5AF2', href: '/dashboard/commandes' },
] as const

export default function AccueilPage() {
  const [stats, setStats] = useState<Stats>({ openConvs: 0, resolvedToday: 0, handovers: 0, orders: 0 })
  const [convs, setConvs] = useState<RecentConv[]>([])
  const [loading, setLoading] = useState(true)
  const sseRef = useRef<EventSource | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [openRes, resolvedRes, ordersRes] = await Promise.all([
        fetch('/api/chatwoot/conversations?status=open'),
        fetch('/api/chatwoot/conversations?status=resolved&page=1'),
        fetch('/api/orders'),
      ])

      let openConvs = 0
      let recentConvs: RecentConv[] = []

      if (openRes.ok) {
        const d = await openRes.json()
        const payload: Array<{
          id: number; meta?: { sender?: { name: string } }
          last_activity_at: number; created_at: number
          inbox?: { name: string }; channel_type?: string; unread_count?: number
        }> = d.data?.payload || []
        openConvs = payload.length
        recentConvs = payload.slice(0, 6).map(c => ({
          id: c.id,
          name: c.meta?.sender?.name || 'Client',
          time: c.last_activity_at || c.created_at,
          channel: c.inbox?.name || c.channel_type || '',
          unread: c.unread_count || 0,
        }))
      }

      let resolvedToday = 0
      if (resolvedRes.ok) {
        const d = await resolvedRes.json()
        const payload: Array<{ updated_at: number }> = d.data?.payload || []
        const start = new Date(); start.setHours(0, 0, 0, 0)
        resolvedToday = payload.filter(c => new Date(c.updated_at * 1000) >= start).length
      }

      let orders = 0
      if (ordersRes.ok) {
        const d = await ordersRes.json()
        const payload: Array<{ status: string }> = d.data || []
        orders = payload.filter(o => o.status === 'PENDING').length
      }

      setStats({ openConvs, resolvedToday, handovers: 0, orders })
      setConvs(recentConvs)
    } catch (err) {
      console.error('[Accueil]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/sse')
      sseRef.current = es

      es.addEventListener('message_created', () => fetchData())
      es.addEventListener('conversation_created', () => fetchData())
      es.addEventListener('conversation_updated', () => fetchData())

      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    fetchData()
    connect()
    return () => { es.close(); clearTimeout(retryTimeout); sseRef.current = null }
  }, [fetchData])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <PageTransition>
      <div style={{ padding: 'clamp(16px, 5vw, 36px)', maxWidth: 960, margin: '0 auto', paddingBottom: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Image src="/logo.png" alt="" width={36} height={36} style={{ borderRadius: 10 }} />
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}>
              Tableau de bord
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>
              {todayCap}
            </p>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
          {KPIS.map((kpi, i) => {
            const Icon = kpi.icon
            const value = stats[kpi.key]
            const inner = (
              <motion.div
                key={kpi.key}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '18px 16px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                  cursor: kpi.href ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 110,
                }}
              >
                {/* accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: kpi.accent, borderRadius: '16px 16px 0 0' }} />

                {/* icon chip */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: `${kpi.accent}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: kpi.accent, flexShrink: 0,
                }}>
                  <Icon size={17} />
                </div>

                {/* number */}
                {loading ? (
                  <div className="rp-shimmer" style={{ height: 34, width: 52, borderRadius: 8 }} />
                ) : (
                  <span style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 34, fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                  }}>
                    {value}
                  </span>
                )}

                {/* label */}
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {kpi.label}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {kpi.sub}
                    {kpi.href && <ArrowRight size={10} />}
                  </div>
                </div>
              </motion.div>
            )
            return kpi.href
              ? <Link key={kpi.key} href={kpi.href} style={{ textDecoration: 'none' }}>{inner}</Link>
              : inner
          })}
        </div>

        {/* Recent conversations */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Activité récente
            </span>
            <Link href="/dashboard/messagerie" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</>
          ) : convs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <MessageSquare size={24} color="var(--surface-border)" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucune conversation active</p>
            </div>
          ) : convs.map((conv, i) => {
            const { label: chLabel, color: chColor } = channelLabel(conv.channel)
            const ini = initials(conv.name)
            return (
              <Link key={conv.id} href={`/dashboard/messagerie/${conv.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 18px',
                    borderBottom: i < convs.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `${chColor}1A`, border: `1.5px solid ${chColor}40`,
                    color: chColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.name}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: chColor, marginTop: 1, fontWeight: 500 }}>
                      {chLabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(conv.time)}</span>
                    {conv.unread > 0 && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: 'var(--brand-primary)', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 5px',
                      }}>
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes rp-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .rp-shimmer { animation: rp-pulse 1.4s ease-in-out infinite; background: var(--surface-2); }
      `}</style>
    </PageTransition>
  )
}
