'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, StickyNote } from 'lucide-react'

const STAGES = [
  'DEMO_BOOKED',
  'SETUP_IN_PROGRESS',
  'CHANNELS_CONNECTED',
  'BOT_CONFIGURED',
  'LIVE',
  'PAYING',
] as const

const STAGE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DEMO_BOOKED:        { label: 'Démo réservée',    color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  SETUP_IN_PROGRESS:  { label: 'Config en cours',  color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  CHANNELS_CONNECTED: { label: 'Canaux connectés', color: '#0891b2', bg: '#ecfeff', dot: '#06b6d4' },
  BOT_CONFIGURED:     { label: 'Bot configuré',    color: '#1a6bff', bg: '#e8f0ff', dot: '#1a6bff' },
  LIVE:               { label: 'En ligne',          color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  PAYING:             { label: 'Payant',            color: '#0d1b2e', bg: '#f1f5f9', dot: '#0d1b2e' },
}

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  FREE:     { bg: '#f1f5f9', color: '#5a6a80' },
  STARTER:  { bg: '#e2e8f0', color: '#475569' },
  PRO:      { bg: '#e8f0ff', color: '#1a6bff' },
  BUSINESS: { bg: '#0d1b2e', color: '#ffffff' },
}

type Business = {
  id: string
  name: string
  plan: string
  createdAt: string | Date
  onboarding: { stage: string } | null
  adminNotes: Array<{ content: string }>
}

export default function KanbanBoard({ businesses }: { businesses: Business[] }) {
  const router = useRouter()

  async function advanceStage(businessId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`/api/admin/clients/${businessId}/stage`, { method: 'PATCH' })
    router.refresh()
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <div style={{ display: 'flex', gap: 14, minWidth: 'max-content', alignItems: 'flex-start' }}>
        {STAGES.map((stage, colIdx) => {
          const meta = STAGE_META[stage]
          const cards = businesses.filter(b => (b.onboarding?.stage ?? 'DEMO_BOOKED') === stage)
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIdx * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: 248, flexShrink: 0 }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 10, padding: '0 2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: meta.dot, display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#0d1b2e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {meta.label}
                  </span>
                </div>
                <span style={{
                  background: meta.bg, color: meta.color,
                  borderRadius: 99, fontSize: 11, fontWeight: 700,
                  padding: '2px 9px', border: `1px solid ${meta.color}20`,
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Column body */}
              <div style={{
                background: '#f4f7fb',
                borderRadius: 12,
                padding: 10,
                minHeight: 80,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cards.length === 0 && (
                    <div style={{
                      padding: '20px 12px', textAlign: 'center',
                      color: '#94a3b8', fontSize: 12,
                      border: '1.5px dashed #e2e8f0', borderRadius: 8,
                    }}>
                      Aucun client
                    </div>
                  )}
                  {cards.map((b, cardIdx) => {
                    const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000)
                    const lastNote = b.adminNotes[0]?.content ?? ''
                    const isLastStage = stage === 'PAYING'
                    const planStyle = PLAN_BADGE[b.plan] ?? { bg: '#f1f5f9', color: '#5a6a80' }

                    return (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: colIdx * 0.07 + cardIdx * 0.04, duration: 0.25 }}
                        whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(13,27,46,0.1)' }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: 12,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(13,27,46,0.05)',
                        }}
                      >
                        <Link href={`/admin/clients/${b.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0d1b2e', marginBottom: 6 }}>
                            {b.name}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: lastNote ? 8 : 0 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 99,
                              background: planStyle.bg, color: planStyle.color,
                            }}>
                              {b.plan}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#5a6a80' }}>
                              <Clock size={10} />
                              J+{daysSince}
                            </span>
                          </div>
                          {lastNote && (
                            <div style={{
                              display: 'flex', alignItems: 'flex-start', gap: 5,
                              fontSize: 11, color: '#5a6a80', fontStyle: 'italic',
                              background: '#f8faff', borderRadius: 6, padding: '5px 8px',
                            }}>
                              <StickyNote size={10} style={{ flexShrink: 0, marginTop: 1 }} />
                              <span>{lastNote.slice(0, 55)}{lastNote.length > 55 ? '…' : ''}</span>
                            </div>
                          )}
                        </Link>

                        {!isLastStage && (
                          <button
                            onClick={e => advanceStage(b.id, e)}
                            style={{
                              marginTop: 10, width: '100%',
                              padding: '6px 0',
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.color}30`,
                              borderRadius: 7,
                              fontSize: 11, fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.background = meta.color
                              el.style.color = '#fff'
                            }}
                            onMouseLeave={e => {
                              const el = e.currentTarget as HTMLButtonElement
                              el.style.background = meta.bg
                              el.style.color = meta.color
                            }}
                          >
                            Étape suivante <ArrowRight size={11} />
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
