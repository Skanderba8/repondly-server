'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  MessageSquare, Bot, AlertCircle, CalendarDays,
  X, Send, Megaphone, Loader2, CheckCircle2, Trash2,
} from 'lucide-react'
import PageTransition from '@/components/ui/PageTransition'
import BottomSheet from '@/components/ui/BottomSheet'
import StatCard from '@/components/accueil/StatCard'
import QuickActionButton from '@/components/accueil/QuickActionButton'
import WeeklyChart from '@/components/accueil/WeeklyChart'
import { Skeleton } from '@/components/ui/skeleton'

interface TodayStats {
  messagesReceived: number
  messagesTrend: number
  botHandled: number
  botRate: number
  pendingHuman: number
  appointmentsToday: number
  appointmentsTrend: number
  unreadCount: number
}

interface WeeklyData {
  date: string
  count: number
}

interface ScheduleException {
  id: string
  type: string
  startDate: string
  endDate: string
  label: string
}

function formatDateInput(d: Date) {
  return d.toISOString().split('T')[0]
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function AccueilPage() {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [weekly, setWeekly] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(true)

  const [closureSheetOpen, setClosureSheetOpen] = useState(false)
  const [closureDate, setClosureDate] = useState(formatDateInput(new Date()))
  const [closureLoading, setClosureLoading] = useState(false)
  const [closureSuccess, setClosureSuccess] = useState(false)
  const [todayException, setTodayException] = useState<ScheduleException | null>(null)

  const [promoSheetOpen, setPromoSheetOpen] = useState(false)
  const [promoText, setPromoText] = useState('')
  const [promoService, setPromoService] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, weeklyRes, exceptionsRes] = await Promise.all([
        fetch('/api/stats/today'),
        fetch('/api/stats/weekly'),
        fetch('/api/schedule-exceptions'),
      ])

      const statsData = await statsRes.json()
      if (statsData.success) setStats(statsData.data)

      const weeklyData = await weeklyRes.json()
      if (weeklyData.success) setWeekly(weeklyData.data)

      const exceptionsData = await exceptionsRes.json()
      if (exceptionsData.success) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const active = exceptionsData.data.find((e: ScheduleException) => {
          const start = new Date(e.startDate)
          const end = new Date(e.endDate)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          return e.type === 'CLOSURE' && today >= start && today <= end
        })
        setTodayException(active || null)
        setClosureSuccess(!!active)
      }
    } catch (err) {
      console.error('[Accueil]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleClosureSubmit() {
    setClosureLoading(true)
    try {
      const start = parseLocalDate(closureDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)

      const res = await fetch('/api/schedule-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Fermé',
          type: 'CLOSURE',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          closedAllDay: true,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setClosureSuccess(true)
        setTodayException(data.data)
        setClosureSheetOpen(false)
        setToast({ msg: 'Le bot informera vos clients que vous êtes fermés.', type: 'success' })
      } else {
        setToast({ msg: data.error || 'Erreur', type: 'error' })
      }
    } catch (err) {
      setToast({ msg: 'Erreur réseau', type: 'error' })
    } finally {
      setClosureLoading(false)
    }
  }

  async function handleClosureUndo() {
    if (!todayException) return
    setClosureLoading(true)
    try {
      const res = await fetch(`/api/schedule-exceptions/${todayException.id}`, { method: 'DELETE' })
      if (res.ok) {
        setClosureSuccess(false)
        setTodayException(null)
        setToast({ msg: 'Fermeture annulée.', type: 'success' })
      } else {
        setToast({ msg: 'Impossible d\'annuler', type: 'error' })
      }
    } catch {
      setToast({ msg: 'Erreur réseau', type: 'error' })
    } finally {
      setClosureLoading(false)
    }
  }

  async function handlePromoSubmit() {
    if (!promoText.trim()) return
    setPromoLoading(true)
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      end.setHours(23, 59, 59, 999)

      const res = await fetch('/api/schedule-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: promoService ? `Promo: ${promoService}` : 'Annonce',
          type: 'PROMO',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          customMessage: promoText.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setPromoSheetOpen(false)
        setPromoText('')
        setPromoService('')
        setToast({ msg: 'Annonce enregistrée. Le bot la mentionnera aux clients.', type: 'success' })
      } else {
        setToast({ msg: data.error || 'Erreur', type: 'error' })
      }
    } catch {
      setToast({ msg: 'Erreur réseau', type: 'error' })
    } finally {
      setPromoLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <PageTransition>
      <div style={{ padding: 'clamp(16px, 5vw, 36px)', maxWidth: 960, margin: '0 auto', paddingBottom: 32 }}>

        {/* ── Header ── */}
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

        {/* ── Zone A: Today's Pulse ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-card)',
                padding: '18px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minHeight: 110,
              }}>
                <Skeleton style={{ width: 34, height: 34, borderRadius: 10 }} />
                <Skeleton style={{ width: 52, height: 34, borderRadius: 8 }} />
                <Skeleton style={{ width: '70%', height: 13, borderRadius: 6 }} />
                <Skeleton style={{ width: '50%', height: 11, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
            <StatCard
              value={stats?.messagesReceived ?? 0}
              label="Messages reçus"
              sublabel="Aujourd'hui"
              trend={stats?.messagesTrend}
              icon={<MessageSquare size={17} />}
            />
            <StatCard
              value={stats?.botHandled ?? 0}
              label="Gérés par le bot"
              sublabel={`${stats?.botRate ?? 0}% taux d'automatisation`}
              icon={<Bot size={17} />}
            />
            <StatCard
              value={stats?.pendingHuman ?? 0}
              label="En attente de vous"
              sublabel="Conversations"
              alert={(stats?.pendingHuman ?? 0) > 0}
              href="/dashboard/messagerie?filter=pending"
              icon={<AlertCircle size={17} />}
            />
            <StatCard
              value={stats?.appointmentsToday ?? 0}
              label="Rendez-vous"
              sublabel="Aujourd'hui"
              trend={stats?.appointmentsTrend}
              href="/dashboard/rendez-vous"
              icon={<CalendarDays size={17} />}
            />
          </div>
        )}

        {/* ── Zone B: Quick Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {loading ? (
            <>
              <Skeleton style={{ width: '100%', height: 56, borderRadius: 'var(--radius-md)' }} />
              <Skeleton style={{ width: '100%', height: 56, borderRadius: 'var(--radius-md)' }} />
            </>
          ) : (
            <>
              {closureSuccess ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 18px',
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--brand-success)',
                  background: 'var(--brand-success-soft)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--brand-success)',
                }}>
                  <CheckCircle2 size={20} />
                  <span style={{ flex: 1 }}>Vous êtes marqué fermé aujourd'hui</span>
                  <button
                    onClick={handleClosureUndo}
                    disabled={closureLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-success)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      opacity: closureLoading ? 0.5 : 1,
                    }}
                  >
                    {closureLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                    Annuler
                  </button>
                </div>
              ) : (
                <QuickActionButton
                  icon={<X size={20} />}
                  label="Marquer fermé"
                  onClick={() => setClosureSheetOpen(true)}
                />
              )}
              <QuickActionButton
                icon={<Megaphone size={20} />}
                label="Envoyer une annonce"
                onClick={() => setPromoSheetOpen(true)}
              />
            </>
          )}
        </div>

        {/* ── Zone C: Weekly Trend ── */}
        {loading ? (
          <div style={{
            background: 'var(--surface-0)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-card)',
            padding: '20px 16px 16px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <Skeleton style={{ width: 140, height: 16, borderRadius: 6, marginBottom: 16 }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Skeleton style={{ width: '100%', maxWidth: 32, height: `${20 + Math.random() * 80}%`, borderRadius: '6px 6px 2px 2px' }} />
                  <Skeleton style={{ width: 20, height: 10, borderRadius: 5 }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <WeeklyChart data={weekly} />
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--surface-0)', border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-elevated)',
          maxWidth: 360,
        }}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} color="var(--brand-success)" />
            : <AlertCircle size={16} color="var(--brand-danger)" />}
          <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Closure Bottom Sheet ── */}
      <BottomSheet open={closureSheetOpen} onClose={() => setClosureSheetOpen(false)}>
        <div style={{ padding: '8px 20px 28px' }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}>
            Marquer fermé
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 16px',
            lineHeight: 1.5,
          }}>
            Sélectionnez la date de fermeture. Le bot informera automatiquement vos clients.
          </p>

          <label style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}>
            Date
          </label>
          <input
            type="date"
            value={closureDate}
            onChange={e => setClosureDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <button
            onClick={handleClosureSubmit}
            disabled={closureLoading}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: closureLoading ? 'not-allowed' : 'pointer',
              opacity: closureLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {closureLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={18} />}
            Confirmer la fermeture
          </button>
        </div>
      </BottomSheet>

      {/* ── Promo Bottom Sheet ── */}
      <BottomSheet open={promoSheetOpen} onClose={() => setPromoSheetOpen(false)}>
        <div style={{ padding: '8px 20px 28px' }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}>
            Envoyer une annonce
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: 'var(--text-secondary)',
            margin: '0 0 16px',
            lineHeight: 1.5,
          }}>
            Le bot mentionnera cette annonce aux clients pendant 7 jours.
          </p>

          <label style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}>
            Message de l'annonce
          </label>
          <textarea
            value={promoText}
            onChange={e => setPromoText(e.target.value)}
            placeholder="Ex: -20% sur tous les services cette semaine !"
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              resize: 'none',
              marginBottom: 12,
            }}
          />

          <label style={{
            display: 'block',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}>
            Service concerné (optionnel)
          </label>
          <input
            type="text"
            value={promoService}
            onChange={e => setPromoService(e.target.value)}
            placeholder="Ex: Coiffure, Massage..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              marginBottom: 20,
            }}
          />

          <button
            onClick={handlePromoSubmit}
            disabled={promoLoading || !promoText.trim()}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--brand-primary)',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: promoLoading || !promoText.trim() ? 'not-allowed' : 'pointer',
              opacity: promoLoading || !promoText.trim() ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {promoLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            Diffuser l'annonce
          </button>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </PageTransition>
  )
}
