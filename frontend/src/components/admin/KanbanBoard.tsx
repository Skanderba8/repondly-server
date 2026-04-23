'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGES = [
  'DEMO_BOOKED',
  'SETUP_IN_PROGRESS',
  'CHANNELS_CONNECTED',
  'BOT_CONFIGURED',
  'LIVE',
  'PAYING',
] as const

const STAGE_LABELS: Record<string, string> = {
  DEMO_BOOKED: 'Démo réservée',
  SETUP_IN_PROGRESS: 'Config en cours',
  CHANNELS_CONNECTED: 'Canaux connectés',
  BOT_CONFIGURED: 'Bot configuré',
  LIVE: 'En ligne',
  PAYING: 'Payant',
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

  async function advanceStage(businessId: string) {
    await fetch(`/api/admin/clients/${businessId}/stage`, { method: 'PATCH' })
    router.refresh()
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <div style={{ display: 'flex', gap: 16, minWidth: 'max-content' }}>
        {STAGES.map(stage => {
          const cards = businesses.filter(b => (b.onboarding?.stage ?? 'DEMO_BOOKED') === stage)
          return (
            <div
              key={stage}
              style={{
                width: 240,
                background: '#f4f7fb',
                borderRadius: 10,
                padding: 12,
                flexShrink: 0,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#0d1b2e' }}>
                  {STAGE_LABELS[stage]}
                </span>
                <span style={{
                  background: '#e2e8f0',
                  color: '#5a6a80',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map(b => {
                  const daysSince = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000)
                  const lastNote = b.adminNotes[0]?.content ?? ''
                  const isLastStage = stage === 'PAYING'

                  return (
                    <div
                      key={b.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <Link
                        href={`/admin/clients/${b.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: b.plan === 'PRO' ? '#e8f0ff' : b.plan === 'BUSINESS' ? '#0d1b2e' : '#f1f5f9',
                            color: b.plan === 'PRO' ? '#1a6bff' : b.plan === 'BUSINESS' ? '#fff' : '#5a6a80',
                          }}>
                            {b.plan}
                          </span>
                          <span style={{ fontSize: 11, color: '#5a6a80' }}>J+{daysSince}</span>
                        </div>
                        {lastNote && (
                          <div style={{ fontSize: 11, color: '#5a6a80', fontStyle: 'italic' }}>
                            {lastNote.slice(0, 60)}{lastNote.length > 60 ? '…' : ''}
                          </div>
                        )}
                      </Link>
                      {!isLastStage && (
                        <button
                          onClick={() => advanceStage(b.id)}
                          style={{
                            marginTop: 8,
                            width: '100%',
                            padding: '4px 0',
                            background: '#e8f0ff',
                            color: '#1a6bff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          → Étape suivante
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
