'use client'

import { ChevronLeft, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface Contact {
  id: number
  name: string
  phone_number: string | null
  email: string | null
  avatar_url: string | null
}

interface ConversationTopBarProps {
  contact: Contact
  channelType?: string
  botEnabled?: boolean
  onToggleBot?: () => void
  onBack?: () => void
  onMenu?: () => void
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function channelColor(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return '#22C55E'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return '#EC4899'
  return 'var(--brand-primary)'
}

export default function ConversationTopBar({
  contact,
  channelType = '',
  botEnabled = true,
  onToggleBot,
  onBack,
  onMenu,
}: ConversationTopBarProps) {
  const [imgError, setImgError] = useState(false)
  const color = channelColor(channelType)

  return (
    <div style={{
      height: 'var(--topbar-height)',
      paddingTop: 'env(safe-area-inset-top)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 4,
      paddingRight: 12,
      gap: 8,
      background: 'var(--surface-0)',
      borderBottom: '1px solid var(--surface-border)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--brand-primary)',
            flexShrink: 0,
            borderRadius: 10,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {contact.avatar_url && !imgError ? (
          <img
            src={contact.avatar_url}
            alt={contact.name}
            onError={() => setImgError(true)}
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `${color}20`,
            border: `2px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 600, color,
            flexShrink: 0,
          }}>
            {initials(contact.name)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}>
            {contact.name}
          </span>
        </div>
      </div>

      {/* Bot toggle */}
      {onToggleBot && (
        <button
          onClick={onToggleBot}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--surface-border)',
            background: botEnabled ? 'var(--brand-success-soft)' : 'var(--brand-warning-soft)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: botEnabled ? 'var(--brand-success)' : 'var(--brand-warning)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: botEnabled ? 'var(--brand-success)' : 'var(--brand-warning)',
            whiteSpace: 'nowrap',
          }}>
            {botEnabled ? 'Bot actif' : 'Bot en pause'}
          </span>
        </button>
      )}

      {onMenu && (
        <button
          onClick={onMenu}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            flexShrink: 0,
            borderRadius: 8,
          }}
        >
          <MoreVertical size={18} />
        </button>
      )}
    </div>
  )
}
