'use client'

import { motion } from 'framer-motion'
import { sslColor } from '@/lib/system-utils'

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatuses = {
  bot:        { online: boolean; latency: number | null }
  app:        { online: boolean; latency: number | null }
  n8n:        { online: boolean; latency: number | null }
  chatwoot:   { online: boolean; latency: number | null }
  marketing:  { online: boolean; latency: number | null }
  dashboard:  { online: boolean; latency: number | null }
  prismaDb:   { connected: boolean; latency: number | null }
  chatwootDb: { connected: boolean; latency: number | null }
  redis:      { connected: boolean; latency: number | null }
}

export type RoutingMapProps = {
  services: ServiceStatuses
  ssl: Record<string, number | null>
}

// ─── Routing rule definition ──────────────────────────────────────────────────

type ServiceKey = keyof ServiceStatuses | null

type RoutingRule = {
  id: string
  /** Source domain(s) shown on the left */
  sources: string[]
  /** Source path (empty string = all paths) */
  path: string
  /** Target label shown on the right */
  target: string
  /** Target port */
  port: number | null
  /** Key into ServiceStatuses to derive online/offline badge */
  serviceKey: ServiceKey
  /** SSL domain to look up in the ssl prop */
  sslDomain: string | null
  /** True for the HTTP→HTTPS redirect card */
  isRedirect?: boolean
}

const ROUTING_RULES: RoutingRule[] = [
  {
    id: 'http-redirect',
    sources: ['*:80 (tous domaines)'],
    path: '',
    target: 'HTTPS 301 redirect',
    port: 443,
    serviceKey: null,
    sslDomain: null,
    isRedirect: true,
  },
  {
    id: 'marketing',
    sources: ['repondly.com', 'www.repondly.com'],
    path: '/',
    target: 'marketing-site',
    port: 3005,
    serviceKey: 'marketing',
    sslDomain: 'repondly.com',
  },
  {
    id: 'admin',
    sources: ['app.repondly.com'],
    path: '/admin',
    target: 'admin-internal',
    port: 3006,
    serviceKey: 'app',
    sslDomain: 'app.repondly.com',
  },
  {
    id: 'bot',
    sources: ['app.repondly.com'],
    path: '/bot/',
    target: 'bot',
    port: 3001,
    serviceKey: 'bot',
    sslDomain: 'app.repondly.com',
  },
  {
    id: 'chatwoot-webhook',
    sources: ['app.repondly.com'],
    path: '/chatwoot-webhook',
    target: 'bot',
    port: 3001,
    serviceKey: 'bot',
    sslDomain: 'app.repondly.com',
  },
  {
    id: 'dashboard',
    sources: ['app.repondly.com'],
    path: '/',
    target: 'dashboard-app',
    port: 3004,
    serviceKey: 'dashboard',
    sslDomain: 'app.repondly.com',
  },
  {
    id: 'chatwoot',
    sources: ['inbox.repondly.com'],
    path: '/',
    target: 'chatwoot',
    port: 3000,
    serviceKey: 'chatwoot',
    sslDomain: 'inbox.repondly.com',
  },
  {
    id: 'n8n',
    sources: ['n8n.repondly.com'],
    path: '/',
    target: 'n8n',
    port: 5678,
    serviceKey: 'n8n',
    sslDomain: 'n8n.repondly.com',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalise a service entry to a simple `online` boolean.
 * Services that use `connected` (db/redis) are mapped to `online`.
 */
function isOnline(services: ServiceStatuses, key: ServiceKey): boolean {
  if (key === null) return false
  const svc = services[key] as { online?: boolean; connected?: boolean }
  if ('online' in svc) return svc.online ?? false
  if ('connected' in svc) return svc.connected ?? false
  return false
}

/** Returns the hex color for an SSL badge. */
function sslBadgeColor(days: number | null | undefined): string {
  if (days == null) return C.mid
  const level = sslColor(days)
  if (level === 'green') return '#16a34a'
  if (level === 'yellow') return '#d97706'
  return '#dc2626'
}

/** Returns a human-readable SSL label. */
function sslLabel(days: number | null | undefined): string {
  if (days == null) return 'SSL inconnu'
  if (days <= 0) return 'SSL expiré'
  if (days <= 7) return `SSL ${days}j ⚠`
  if (days <= 30) return `SSL ${days}j`
  return `SSL ${days}j ✓`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ServiceBadge({ online }: { online: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: online ? '#16a34a' : '#dc2626',
        background: online ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${online ? '#bbf7d0' : '#fecaca'}`,
        borderRadius: 20,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 8 }}>●</span>
      {online ? 'En ligne' : 'Hors ligne'}
    </span>
  )
}

function SslBadge({ days }: { days: number | null | undefined }) {
  const color = sslBadgeColor(days)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {sslLabel(days)}
    </span>
  )
}

// ─── Routing card ─────────────────────────────────────────────────────────────

function RoutingCard({
  rule,
  services,
  ssl,
  index,
}: {
  rule: RoutingRule
  services: ServiceStatuses
  ssl: Record<string, number | null>
  index: number
}) {
  const online = rule.serviceKey ? isOnline(services, rule.serviceKey) : null
  const sslDays = rule.sslDomain ? ssl[rule.sslDomain] : null

  const isSpecial = rule.isRedirect

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: isSpecial ? C.bgAlt : C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      {/* Source */}
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rule.sources.map((src) => (
            <span
              key={src}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.ink,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {src}
            </span>
          ))}
          {rule.path && rule.path !== '/' && (
            <span
              style={{
                fontSize: 11,
                color: C.blue,
                fontFamily: 'monospace',
                fontWeight: 500,
              }}
            >
              {rule.path}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        style={{
          color: C.mid,
          fontSize: 16,
          fontWeight: 300,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        →
      </div>

      {/* Target */}
      <div style={{ flex: '1 1 160px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isSpecial ? C.mid : C.ink,
              fontFamily: 'monospace',
            }}
          >
            {rule.target}
            {rule.port && !isSpecial ? (
              <span style={{ color: C.blue }}> :{rule.port}</span>
            ) : null}
          </span>
          {isSpecial && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#7c3aed',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: 20,
                padding: '2px 8px',
              }}
            >
              301 redirect
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {online !== null && <ServiceBadge online={online} />}
        {rule.sslDomain && <SslBadge days={sslDays} />}
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RoutingMap({ services, ssl }: RoutingMapProps) {
  return (
    <section>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{ marginBottom: 14 }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: C.ink,
            margin: 0,
            marginBottom: 2,
          }}
        >
          Carte de routage nginx
        </h2>
        <p style={{ fontSize: 12, color: C.mid, margin: 0 }}>
          Configuration des règles de proxy inverse — {ROUTING_RULES.length} règles actives
        </p>
      </motion.div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ROUTING_RULES.map((rule, i) => (
          <RoutingCard
            key={rule.id}
            rule={rule}
            services={services}
            ssl={ssl}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
