'use client'

import { useState, useEffect } from 'react'
import type { Business } from '@prisma/client'
import {
  PLAN_PRICES,
  calculateExpectedRevenue,
  calculateConfirmedRevenue,
  calculatePendingRevenue,
} from '@/lib/admin'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

export default function BillingPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/clients')
      .then(r => r.json())
      .then(data => { setBusinesses(data); setLoading(false) })
  }, [])

  async function togglePaid(id: string, paidThisMonth: boolean) {
    await fetch(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paidThisMonth }),
    })
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, paidThisMonth } : b))
  }

  async function resetPayments() {
    if (!confirm('Réinitialiser tous les paiements du mois ?')) return
    await Promise.all(
      businesses.map(b =>
        fetch(`/api/admin/clients/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paidThisMonth: false }),
        })
      )
    )
    setBusinesses(prev => prev.map(b => ({ ...b, paidThisMonth: false })))
  }

  const isLate = new Date().getDate() > 5

  const billable = businesses.filter(b => b.status === 'ACTIVE' || b.status === 'TRIAL')
  const expected = calculateExpectedRevenue(businesses)
  const confirmed = calculateConfirmedRevenue(businesses)
  const pending = calculatePendingRevenue(businesses)

  if (loading) {
    return (
      <div style={{ padding: 32, color: C.mid }}>Chargement...</div>
    )
  }

  return (
    <div style={{ padding: 32, background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
          Suivi de facturation
        </h1>
        <button
          onClick={resetPayments}
          style={{
            background: '#fff',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            color: C.mid,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Réinitialiser les paiements
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <SummaryCard label="Revenus attendus" amount={expected} color={C.blue} bg={C.blueLight} />
        <SummaryCard label="Revenus confirmés" amount={confirmed} color="#16a34a" bg="#dcfce7" />
        <SummaryCard label="En attente" amount={pending} color="#ea580c" bg="#ffedd5" />
      </div>

      {/* Billing table */}
      <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
              {['Entreprise', 'Plan', 'Montant mensuel', 'Statut', 'Méthode de paiement', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billable.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: C.mid }}>
                  Aucun client actif ou en essai.
                </td>
              </tr>
            )}
            {billable.map((b, i) => {
              const showLate = isLate && !b.paidThisMonth
              const waMessage = encodeURIComponent(`Bonjour, votre paiement mensuel Répondly est en attente. Merci de régulariser votre situation.`)
              const waLink = `https://wa.me/${b.phone?.replace(/\D/g, '')}?text=${waMessage}`

              return (
                <tr
                  key={b.id}
                  style={{
                    borderBottom: i < billable.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: showLate ? '#fff7f7' : C.bg,
                  }}
                >
                  {/* Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{b.name}</span>
                      {showLate && (
                        <span style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 99,
                          border: '1px solid #fca5a5',
                        }}>
                          En retard
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.mid, marginTop: 2 }}>{b.email}</div>
                  </td>

                  {/* Plan */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: C.blueLight,
                      color: C.blue,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 99,
                    }}>
                      {b.plan}
                    </span>
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: C.ink, fontSize: 14 }}>
                    {PLAN_PRICES[b.plan] ?? 0} DT
                  </td>

                  {/* Paid toggle */}
                  <td style={{ padding: '14px 16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={b.paidThisMonth}
                        onChange={e => togglePaid(b.id, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#16a34a' }}
                      />
                      <span style={{ fontSize: 13, color: b.paidThisMonth ? '#16a34a' : C.mid, fontWeight: b.paidThisMonth ? 600 : 400 }}>
                        {b.paidThisMonth ? 'Payé ✓' : 'En attente'}
                      </span>
                    </label>
                  </td>

                  {/* Payment method */}
                  <td style={{ padding: '14px 16px', fontSize: 13, color: b.paymentMethod ? C.ink : C.mid }}>
                    {b.paymentMethod ?? '—'}
                  </td>

                  {/* WhatsApp */}
                  <td style={{ padding: '14px 16px' }}>
                    {b.phone ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#dcfce7',
                          color: '#16a34a',
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '5px 11px',
                          borderRadius: 7,
                          textDecoration: 'none',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        📲 Rappel WhatsApp
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
    </div>
  )
}

function SummaryCard({ label, amount, color, bg }: { label: string; amount: number; color: string; bg: string }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>
        {amount} DT
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 99, background: bg }} />
    </div>
  )
}
