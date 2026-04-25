'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users, TrendingUp, AlertTriangle, Settings2,
  Bot, Globe, ArrowRight, Activity, Workflow, MessageSquare, Megaphone, LayoutDashboard,
} from 'lucide-react'

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
  green: '#16a34a',
  greenBg: '#dcfce7',
  red: '#dc2626',
  redBg: '#fee2e2',
  yellow: '#d97706',
  yellowBg: '#fef3c7',
}

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  FREE:     { bg: '#f1f5f9', color: '#5a6a80' },
  STARTER:  { bg: '#e2e8f0', color: '#475569' },
  PRO:      { bg: C.blueLight, color: C.blue },
  BUSINESS: { bg: C.ink, color: '#ffffff' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
}

type Props = {
  stats: {
    totalClients: number
    activeClients: number
    trialClients: number
    mrr: number
    trialsExpiring: number
    pendingConfig: number
  }
  services: {
    botOnline: boolean
    appOnline: boolean
    n8nOnline: boolean
    chatwootOnline: boolean
    marketingOnline: boolean
    dashboardOnline: boolean
  }
  globalStatus: 'ok' | 'degraded' | 'critical'
  recentActivity: Array<{ id: string; businessName: string; action: string; createdAt: string }>
  planBreakdown: Record<string, number>
}

export default function AdminOverviewClient({ stats, services, globalStatus, recentActivity, planBreakdown }: Props) {
  const statCards = [
    {
      label: 'Total clients',
      value: stats.totalClients,
      sub: `${stats.activeClients} actifs · ${stats.trialClients} essais`,
      icon: Users,
      color: C.blue,
      bg: C.blueLight,
      href: '/admin/clients',
    },
    {
      label: 'MRR',
      value: `${stats.mrr} DT`,
      sub: 'revenus mensuels récurrents',
      icon: TrendingUp,
      color: C.green,
      bg: C.greenBg,
      href: '/admin/billing',
    },
    {
      label: 'Essais expirant',
      value: stats.trialsExpiring,
      sub: 'dans les 7 prochains jours',
      icon: AlertTriangle,
      color: stats.trialsExpiring > 0 ? C.yellow : C.mid,
      bg: stats.trialsExpiring > 0 ? C.yellowBg : C.bgAlt,
      href: '/admin/clients',
    },
    {
      label: 'Config en attente',
      value: stats.pendingConfig,
      sub: 'clients à configurer',
      icon: Settings2,
      color: stats.pendingConfig > 0 ? C.yellow : C.mid,
      bg: stats.pendingConfig > 0 ? C.yellowBg : C.bgAlt,
      href: '/admin/onboarding',
    },
  ]

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Vue d&apos;ensemble</h1>
            <p style={{ fontSize: 13, color: C.mid, margin: '4px 0 0' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
            background: globalStatus === 'ok' ? C.greenBg : globalStatus === 'degraded' ? C.yellowBg : C.redBg,
            color: globalStatus === 'ok' ? C.green : globalStatus === 'degraded' ? C.yellow : C.red,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {globalStatus === 'ok' ? 'Tous les systèmes opérationnels' : globalStatus === 'degraded' ? 'Système dégradé' : 'Système critique'}
          </span>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Link href={s.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = '0 8px 24px rgba(26,107,255,0.1)'
                  el.style.transform = 'translateY(-2px)'
                  el.style.borderColor = s.color + '40'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.boxShadow = 'none'
                  el.style.transform = 'translateY(0)'
                  el.style.borderColor = C.border
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 80, height: 80,
                  background: s.bg,
                  borderRadius: '0 14px 0 80px',
                  opacity: 0.6,
                }} />
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: s.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: C.mid }}>{s.sub}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Services + Plan breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Services */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Services
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Bot WhatsApp', online: services.botOnline, icon: Bot, href: '/admin/bot' },
                { label: 'app.repondly.com', online: services.appOnline, icon: Globe, href: '/admin/system' },
                { label: 'n8n', online: services.n8nOnline, icon: Workflow, href: '/admin/n8n' },
                { label: 'Chatwoot', online: services.chatwootOnline, icon: MessageSquare, href: '/admin/chatwoot' },
                { label: 'Marketing', online: services.marketingOnline, icon: Megaphone, href: '/admin/system' },
                { label: 'Dashboard', online: services.dashboardOnline, icon: LayoutDashboard, href: '/admin/system' },
              ].map(svc => (
                <Link key={svc.label} href={svc.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: C.bgAlt,
                    borderRadius: 10,
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#eef2ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = C.bgAlt }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: svc.online ? C.greenBg : C.redBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svc.icon size={15} color={svc.online ? C.green : C.red} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{svc.label}</div>
                        <div style={{ fontSize: 11, color: svc.online ? C.green : C.red, fontWeight: 600 }}>
                          {svc.online ? '● En ligne' : '● Hors ligne'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} color={C.mid} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Plan breakdown */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Répartition des plans
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(planBreakdown).map(([plan, count]) => {
                const total = Object.values(planBreakdown).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const style = PLAN_COLORS[plan] ?? { bg: C.bgAlt, color: C.mid }
                return (
                  <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 99, background: style.bg, color: style.color,
                      minWidth: 64, textAlign: 'center',
                    }}>
                      {plan}
                    </span>
                    <div style={{ flex: 1, background: C.border, borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ height: '100%', background: style.color === '#ffffff' ? C.ink : style.color, borderRadius: 99 }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, minWidth: 20, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent activity */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 22px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color={C.mid} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Activité récente</span>
            </div>
            <Link href="/admin/clients" style={{ fontSize: 12, color: C.blue, textDecoration: 'none', fontWeight: 500 }}>
              Voir tout →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '32px 22px', color: C.mid, fontSize: 13, textAlign: 'center' }}>
              Aucune activité récente.
            </div>
          ) : (
            recentActivity.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.25 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 22px',
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.bgAlt }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.blue, flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, color: C.ink, fontSize: 13 }}>{entry.businessName}</span>
                  <span style={{ color: C.mid, fontSize: 13 }}>{entry.action}</span>
                </div>
                <span style={{ fontSize: 11, color: C.mid, whiteSpace: 'nowrap' }}>
                  {timeAgo(entry.createdAt)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
