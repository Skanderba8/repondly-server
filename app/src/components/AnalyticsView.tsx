'use client'

import { useRouter } from 'next/navigation'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  MessageStat,
  ResponseStats,
  TopContactStat,
  WeeklyConversationStat,
} from '@/lib/analytics'
import type { ConversationStatus } from '@/types'
import { cn } from '@/lib/utils'

type AnalyticsViewProps = {
  period: number
  messageStats: MessageStat[]
  previousMessageStats: MessageStat[]
  statusBreakdown: Record<ConversationStatus, number>
  weeklyConversations: WeeklyConversationStat[]
  topContacts: TopContactStat[]
  responseStats: ResponseStats
  previousResponseStats: ResponseStats
}

type ChartTooltipPayload = ReadonlyArray<{
  value?: number | string | ReadonlyArray<number | string>
  name?: number | string
  payload?: Record<string, unknown>
}>

type ChartTooltipProps = {
  active?: boolean
  payload?: ChartTooltipPayload
  label?: string | number
}

const PERIODS = [7, 30, 90]

const STATUS_META: Record<ConversationStatus, { label: string; color: string }> = {
  NEW: { label: 'Nouvelles', color: 'var(--brand)' },
  IN_PROGRESS: { label: 'En cours', color: 'var(--warning)' },
  CONFIRMED: { label: 'Confirmées', color: 'var(--teal)' },
  FOLLOW_UP: { label: 'Relances', color: 'var(--followup)' },
  RESOLVED: { label: 'Résolues', color: 'var(--success)' },
}

function sumCounts(items: Array<{ count: number }>) {
  return items.reduce((total, item) => total + item.count, 0)
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0

  return Math.round(((current - previous) / previous) * 100)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${value}T00:00:00`))
}

function formatWeek(value: string) {
  return `S.${value.split('W')[1] ?? value}`
}

function truncateLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}…` : value
}

function ChangePill({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const positive = value >= 0
  const label = suffix === ' pts'
    ? `${positive ? '+' : ''}${value}${suffix}`
    : `${positive ? '+' : ''}${value}${suffix}`

  return <span className={positive ? 'nx-kpi-change-up' : 'nx-kpi-change-dn'}>{label}</span>
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div className="nx-chart-tooltip">
      <span>{typeof label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(label) ? formatShortDate(label) : label}</span>
      <strong>{item.value}</strong>
    </div>
  )
}

export function AnalyticsView({
  period,
  messageStats,
  previousMessageStats,
  statusBreakdown,
  weeklyConversations,
  topContacts,
  responseStats,
  previousResponseStats,
}: AnalyticsViewProps) {
  const router = useRouter()
  const inboundCount = sumCounts(messageStats)
  const previousInboundCount = sumCounts(previousMessageStats)
  const inboundChange = getPercentChange(inboundCount, previousInboundCount)
  const rateChange = responseStats.rate - previousResponseStats.rate
  const activeConversations = Object.entries(statusBreakdown)
    .filter(([status]) => status !== 'RESOLVED')
    .reduce((total, [, count]) => total + count, 0)
  const statusData = Object.entries(statusBreakdown).map(([status, count]) => ({
    status: status as ConversationStatus,
    name: STATUS_META[status as ConversationStatus].label,
    value: count,
    color: STATUS_META[status as ConversationStatus].color,
  }))
  const totalConversations = statusData.reduce((total, item) => total + item.value, 0)

  return (
    <div className="nx-analytics">
      <div className="nx-analytics-toolbar">
        <div>
          <h1 className="nx-page-title">Analytiques</h1>
          <p className="nx-page-sub">Vue réelle des messages, conversations et contacts actifs.</p>
        </div>
        <div className="nx-analytics-periods" aria-label="Période">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              className={cn('nx-filter-chip', period === item && 'is-active')}
              onClick={() => router.push(`?period=${item}`)}
            >
              {item} jours
            </button>
          ))}
        </div>
      </div>

      <section className="nx-kpi-grid">
        <article className="nx-kpi-card">
          <div className="nx-kpi-topline">
            <p className="nx-kpi-label">Messages reçus</p>
            <ChangePill value={inboundChange} />
          </div>
          <strong className="nx-kpi-value">{inboundCount}</strong>
        </article>
        <article className="nx-kpi-card">
          <div className="nx-kpi-topline">
            <p className="nx-kpi-label">Taux de réponse</p>
            <ChangePill value={rateChange} suffix=" pts" />
          </div>
          <strong className="nx-kpi-value">{responseStats.rate}%</strong>
        </article>
        <article className="nx-kpi-card">
          <div className="nx-kpi-topline">
            <p className="nx-kpi-label">Conversations actives</p>
            <span className="nx-kpi-note">hors résolues</span>
          </div>
          <strong className="nx-kpi-value">{activeConversations}</strong>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 mt-2 md:grid-cols-2">
        <article className="nx-card nx-analytics-card p-5">
          <div className="nx-card-header">
            <h2 className="nx-card-title">Messages reçus</h2>
            <span className="nx-period-badge">{period} jours</span>
          </div>
          <div className="nx-chart-frame">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={messageStats} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
                <Area type="monotone" dataKey="count" stroke="var(--brand)" strokeWidth={2} fill="url(#brandGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="nx-card nx-analytics-card p-5">
          <div className="nx-card-header">
            <h2 className="nx-card-title">Statut des conversations</h2>
          </div>
          <div className="nx-donut-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {statusData.map((item) => (
                    <Cell key={item.status} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="nx-donut-center">
              <strong>{totalConversations}</strong>
              <span>Total</span>
            </div>
          </div>
          <div className="nx-chart-legend">
            {statusData.map((item) => (
              <span key={item.status}>
                <i style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </article>

        <article className="nx-card nx-analytics-card p-5">
          <div className="nx-card-header">
            <h2 className="nx-card-title">Conversations par semaine</h2>
          </div>
          <div className="nx-chart-frame">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyConversations} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tickFormatter={formatWeek} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--brand-soft)' }} />
                <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="nx-card nx-analytics-card p-5">
          <div className="nx-card-header">
            <h2 className="nx-card-title">Contacts les plus actifs</h2>
          </div>
          <div className="nx-chart-frame">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={topContacts} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={96} tickFormatter={truncateLabel} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--teal-soft)' }} />
                <Bar dataKey="totalConversations" fill="var(--teal)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
