'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, Zap, ArrowRight, RefreshCw } from 'lucide-react'
import { useTheme, palette } from '@/lib/theme'

interface RecentConv {
  id: number
  name: string
  preview: string
  time: number
  channel: string
  unread: number
}

interface Stats {
  openCount: number
  treatedToday: number
  handoversToday: number
}

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: '#22C55E',
  facebook: '#3B82F6',
  instagram: '#EC4899',
}

function channelColor(ch: string) {
  const key = ch.toLowerCase()
  for (const [k, v] of Object.entries(CHANNEL_COLOR)) {
    if (key.includes(k)) return v
  }
  return '#3B82F6'
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

export default function AccueilPage() {
  const router = useRouter()
  const dark = useTheme()
  const P = palette(dark)
  const [stats, setStats] = useState<Stats>({ openCount: 0, treatedToday: 0, handoversToday: 0 })
  const [convs, setConvs] = useState<RecentConv[]>([])
  const [loading, setLoading] = useState(true)
  const sseRef = useRef<EventSource | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [openRes, allRes, botEventsRes] = await Promise.all([
        fetch('/api/chatwoot/conversations?status=open'),
        fetch('/api/chatwoot/conversations?status=resolved&page=1'),
        fetch('/api/chatwoot/conversations?status=open'),
      ])

      let openCount = 0
      let recentConvs: RecentConv[] = []

      if (openRes.ok) {
        const d = await openRes.json()
        const payload: any[] = d.data?.payload || []
        openCount = payload.length
        recentConvs = payload.slice(0, 8).map((c: any) => ({
          id: c.id,
          name: c.meta?.sender?.name || 'Client',
          preview: c.last_activity_at ? 'Conversation active' : '',
          time: c.last_activity_at || c.created_at,
          channel: c.inbox?.name || c.channel_type || '',
          unread: c.unread_count || 0,
        }))
      }

      let treatedToday = 0
      if (allRes.ok) {
        const d = await allRes.json()
        const payload: any[] = d.data?.payload || []
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        treatedToday = payload.filter((c: any) => {
          const updatedAt = new Date(c.updated_at * 1000)
          return updatedAt >= todayStart
        }).length
      }

      setStats({ openCount, treatedToday, handoversToday: 0 })
      setConvs(recentConvs)
    } catch (err) {
      console.error('[Accueil] fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    sseRef.current = new EventSource('/api/sse')
    sseRef.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_message' || data.type === 'conversation_update') {
          fetchData()
        }
      } catch {}
    }
    return () => sseRef.current?.close()
  }, [fetchData])

  const kpis = [
    {
      label: 'En attente',
      value: stats.openCount,
      sub: 'conversations ouvertes',
      icon: <Clock size={16} />,
      accent: '#F59E0B',
      onClick: () => router.push('/dashboard/messagerie'),
    },
    {
      label: 'Traités aujourd\'hui',
      value: stats.treatedToday,
      sub: 'conversations résolues',
      icon: <MessageSquare size={16} />,
      accent: '#10B981',
    },
    {
      label: 'Interventions humaines',
      value: stats.handoversToday,
      sub: 'transferts aujourd\'hui',
      icon: <Zap size={16} />,
      accent: '#3B82F6',
    },
  ]

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1080, margin: '0 auto', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(17px, 4vw, 22px)', fontWeight: 600, color: P.text, margin: 0, letterSpacing: '-0.02em' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: P.text3, marginTop: 4, margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${P.border}`, background: 'transparent',
            color: P.text3, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = P.border2
            ;(e.currentTarget as HTMLElement).style.color = P.text2
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = P.border
            ;(e.currentTarget as HTMLElement).style.color = P.text3
          }}
        >
          <RefreshCw size={13} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={kpi.onClick}
            style={{
              background: P.surface,
              border: `1px solid ${P.border}`,
              borderRadius: 12,
              padding: '20px 24px',
              cursor: kpi.onClick ? 'pointer' : 'default',
              transition: 'all 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              if (kpi.onClick) {
                (e.currentTarget as HTMLElement).style.borderColor = P.border2
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={e => {
              if (kpi.onClick) {
                (e.currentTarget as HTMLElement).style.borderColor = P.border
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: kpi.accent, borderRadius: '12px 12px 0 0',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: P.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {kpi.label}
              </span>
              <span style={{ color: kpi.accent }}>{kpi.icon}</span>
            </div>
            {loading
              ? <div style={{ height: 40, width: 64, background: P.border, borderRadius: 6, marginBottom: 8 }} />
              : <div style={{ fontSize: 40, fontWeight: 700, color: P.text, lineHeight: 1, marginBottom: 6 }}>
                  {kpi.value}
                </div>
            }
            <div style={{ fontSize: 12, color: P.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
              {kpi.sub}
              {kpi.onClick && <ArrowRight size={11} />}
            </div>
          </div>
        ))}
      </div>

      {/* Recent conversations */}
      <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${P.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: P.text }}>
            Activité récente
          </span>
          <button
            onClick={() => router.push('/dashboard/messagerie')}
            style={{
              fontSize: 12, color: '#3B82F6', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Voir tout <ArrowRight size={12} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: 'center', color: P.text3, fontSize: 13 }}>
            Chargement...
          </div>
        )}

        {!loading && convs.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <MessageSquare size={28} color={P.border} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: P.text3, margin: 0 }}>Aucune conversation pour le moment</p>
          </div>
        )}

        {!loading && convs.map((conv, i) => {
          const color = channelColor(conv.channel)
          const ini = initials(conv.name)
          return (
            <button
              key={conv.id}
              onClick={() => router.push('/dashboard/messagerie')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                border: 'none',
                borderBottom: i < convs.length - 1 ? `1px solid ${P.borderSub}` : 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.hoverBg}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${color}18`,
                border: `1.5px solid ${color}40`,
                color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>
                {ini}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: P.text, marginBottom: 2 }}>{conv.name}</div>
                <div style={{ fontSize: 12, color: P.text3 }}>{conv.channel || 'Conversation'}</div>
              </div>
              <div style={{ fontSize: 11, color: P.text3, flexShrink: 0 }}>{timeAgo(conv.time)}</div>
              {conv.unread > 0 && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#3B82F6', color: '#fff',
                  fontSize: 10, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {conv.unread}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
