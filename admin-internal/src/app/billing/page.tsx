'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Business } from '@prisma/client'
import { PLAN_PRICES, calculateExpectedRevenue, calculateConfirmedRevenue, calculatePendingRevenue } from '@/lib/admin-utils'
import { TrendingUp, CheckCircle, Clock, RotateCcw, MessageCircle } from 'lucide-react'

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fff7ed',
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } }),
}

export default function BillingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/admin/clients').then(r => r.json()).then(data => { setBusinesses(data); setLoading(false) })
  }, [])

  async function togglePaid(id: string, paidThisMonth: boolean) {
    await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paidThisMonth }),
    })
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, paidThisMonth } : b))
  }

  async function resetPayments() {
    if (!confirm('Réinitialiser tous les paiements du mois ?')) return
    await Promise.all(businesses.map(b =>
      fetch(`/api/admin/clients/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidThisMonth: false }),
      })
    ))
    setBusinesses(prev => prev.map(b => ({ ...b, paidThisMonth: false })))
  }

  const isLate = new Date().getDate() > 5
  const billable = businesses.filter(b => b.status === 'ACTIVE' || b.status === 'TRIAL')
  const expected = calculateExpectedRevenue(businesses)
  const confirmed = calculateConfirmedRevenue(businesses)
  const pending = calculatePendingRevenue(businesses)
  const paidCount = billable.filter(b => b.paidThisMonth).length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Suivi de facturation</h1>
          <p style={{ fontSize: 13, color: C.mid, margin: '4px 0 0' }}>
            {paidCount}/{billable.length} clients payés ce mois
          </p>
        </div>
        <button
          onClick={resetPayments}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 16px', fontSize: 13, color: C.mid, cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.red; el.style.color = C.red }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.border; el.style.color = C.mid }}
        >
          <RotateCcw size={13} /> Réinitialiser les paiements
        </button>
      </motion.div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Revenus attendus', amount: expected, color: C.blue, bg: C.blueLight, icon: TrendingUp },
          { label: 'Revenus confirmés', amount: confirmed, color: C.green, bg: C.greenBg, icon: CheckCircle },
          { label: 'En attente', amount: pending, color: C.yellow, bg: C.yellowBg, icon: Clock },
        ].map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: s.color }}>{s.amount} DT</div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: s.bg }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Progression des paiements</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
            {expected > 0 ? Math.round((confirmed / expected) * 100) : 0}%
          </span>
        </div>
        <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${expected > 0 ? (confirmed / expected) * 100 : 0}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${C.green}, #22c55e)`, borderRadius: 99 }}
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
        <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                {['Entreprise', 'Plan', 'Montant', 'Statut paiement', 'Méthode', 'Action'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billable.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.mid }}>Aucun client actif ou en essai.</td></tr>
              )}
              {billable.map((b, i) => {
                const showLate = isLate && !b.paidThisMonth
                const waMessage = encodeURIComponent(`Bonjour, votre paiement mensuel Répondly est en attente. Merci de régulariser votre situation.`)
                const waLink = `https://wa.me/${b.phone?.replace(/\D/g, '')}?text=${waMessage}`

                return (
                  <tr
                    key={b.id}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      borderBottom: i < billable.length - 1 ? `1px solid ${C.border}` : 'none',
                      background: hoveredId === b.id ? C.bgAlt : showLate ? '#fff8f8' : C.bg,
                      transition: 'background 0.12s',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{b.name}</span>
                        {showLate && (
                          <span style={{ background: C.redBg, color: C.red, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
                            En retard
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{b.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
                        {b.plan}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: C.ink, fontSize: 15 }}>
                      {PLAN_PRICES[b.plan] ?? 0} DT
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                        <div
                          onClick={() => togglePaid(b.id, !b.paidThisMonth)}
                          style={{
                            width: 38, height: 22, borderRadius: 99,
                            background: b.paidThisMonth ? C.green : C.border,
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.2s', flexShrink: 0,
                          }}
                        >
                          <motion.div
                            animate={{ x: b.paidThisMonth ? 18 : 2 }}
                            transition={{ duration: 0.2 }}
                            style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                          />
                        </div>
                        <span style={{ fontSize: 13, color: b.paidThisMonth ? C.green : C.mid, fontWeight: b.paidThisMonth ? 700 : 400 }}>
                          {b.paidThisMonth ? 'Payé ✓' : 'En attente'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: b.paymentMethod ? C.ink : C.mid }}>
                      {b.paymentMethod ?? '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {b.phone ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: C.greenBg, color: C.green, fontSize: 12, fontWeight: 600,
                          padding: '5px 11px', borderRadius: 7, textDecoration: 'none',
                          border: '1px solid #bbf7d0', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = C.green; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = C.greenBg; (e.currentTarget as HTMLAnchorElement).style.color = C.green }}
                        >
                          <MessageCircle size={12} /> Rappel WA
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: C.mid }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
