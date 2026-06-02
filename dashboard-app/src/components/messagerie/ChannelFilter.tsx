'use client'

import { motion } from 'framer-motion'

type ChannelFilterValue = 'all' | 'whatsapp' | 'facebook'

interface ChannelFilterProps {
  value: ChannelFilterValue
  onChange: (v: ChannelFilterValue) => void
  counts: { whatsapp: number; facebook_instagram: number; all: number }
}

const TABS: { value: ChannelFilterValue; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook & Instagram' },
]

export default function ChannelFilter({ value, onChange, counts }: ChannelFilterProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '10px 16px',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
      scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--surface-border)',
      flexShrink: 0,
    }}>
      {TABS.map(tab => {
        const isActive = value === tab.value
        const count = tab.value === 'all' ? counts.all : tab.value === 'whatsapp' ? counts.whatsapp : counts.facebook_instagram
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="channel-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--brand-primary)',
                  zIndex: 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
            )}
            {!isActive && (
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--surface-2)',
                zIndex: 0,
              }} />
            )}
            <span style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#fff' : 'var(--text-muted)',
            }}>
              {tab.label}
            </span>
            {count > 0 && (
              <span style={{
                position: 'relative',
                zIndex: 1,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--brand-primary-soft)',
                color: isActive ? '#fff' : 'var(--brand-primary)',
                fontSize: 10,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
