'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, MoreVertical } from 'lucide-react'
import { useState } from 'react'

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
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function channelColor(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return '#22C55E'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return '#EC4899'
  return 'var(--color-accent)'
}

export default function ConversationTopBar({ contact, channelType = '' }: ConversationTopBarProps) {
  const router = useRouter()
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
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      flexShrink: 0,
      zIndex: 10,
    }}>
      <button
        onClick={() => router.back()}
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-accent)',
          flexShrink: 0,
          borderRadius: 10,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

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
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {contact.name}
        </span>
      </div>

      <button
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-3)',
          flexShrink: 0,
          borderRadius: 8,
        }}
      >
        <MoreVertical size={18} />
      </button>
    </div>
  )
}
