'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  value: number
  label: string
  sublabel?: string
  trend?: number
  alert?: boolean
  href?: string
  icon?: React.ReactNode
}

export default function StatCard({ value, label, sublabel, trend, alert, href, icon }: StatCardProps) {
  const color = alert ? 'var(--brand-danger)' : 'var(--brand-primary)'
  const bgSoft = alert ? 'var(--brand-danger-soft)' : 'var(--brand-primary-soft)'

  const inner = (
    <div
      style={{
        background: 'var(--surface-0)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-card)',
        padding: '18px 16px 16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 110,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Icon chip */}
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: bgSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}>
          {icon}
        </div>
      )}

      {/* Number */}
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 32, fontWeight: 800,
        color: alert ? 'var(--brand-danger)' : 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}>
        {value}
      </span>

      {/* Label */}
      <div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
            {sublabel}
            {href && <ArrowUpRight size={10} />}
          </div>
        )}
        {trend !== undefined && trend !== 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 4,
            fontSize: 11, fontWeight: 600,
            color: trend > 0 ? 'var(--brand-success)' : 'var(--brand-danger)',
          }}>
            {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}% vs hier
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {inner}
      </Link>
    )
  }

  return inner
}
