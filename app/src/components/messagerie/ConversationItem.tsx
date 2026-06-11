'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'

interface ConversationItemProps {
  id: number
  contactName: string
  channel: 'whatsapp' | 'facebook' | 'instagram'
  lastMessage: string
  timestamp: Date
  unreadCount: number
  needsHuman: boolean
  botActive: boolean
  isActive: boolean
  onClick: () => void
}

function formatTime(ts: Date): string {
  const d = ts
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return d.toLocaleDateString('fr-TN', { weekday: 'short' })
  return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' })
}

function channelColor(channel: string): string {
  if (channel === 'whatsapp') return '#22C55E'
  if (channel === 'facebook') return '#3B82F6'
  if (channel === 'instagram') return '#EC4899'
  return 'var(--brand-primary)'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function ChannelIcon({ channel }: { channel: string }) {
  const color = channelColor(channel)
  const size = 14

  if (channel === 'whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    )
  }
  if (channel === 'facebook') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>f</span>
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>Ig</span>
    </div>
  )
}

export default function ConversationItem({
  id,
  contactName,
  channel,
  lastMessage,
  timestamp,
  unreadCount,
  needsHuman,
  botActive,
  isActive,
  onClick,
}: ConversationItemProps) {
  const [imgError, setImgError] = useState(false)
  const color = channelColor(channel)
  const hasUnread = unreadCount > 0
  const preview = lastMessage || ''

  return (
    <motion.div
      layoutId={`conv-${id}`}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        minHeight: 72,
        background: isActive
          ? 'var(--brand-primary-soft)'
          : hasUnread
            ? 'rgba(108,99,255,0.04)'
            : 'transparent',
        borderLeft: `3px solid ${needsHuman ? 'var(--brand-danger)' : isActive ? 'var(--brand-primary)' : 'transparent'}`,
        borderBottom: '1px solid var(--surface-border)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {/* Avatar with channel badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${color}18`,
          border: `2px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color,
          overflow: 'hidden',
        }}>
          {initials(contactName)}
        </div>
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          background: 'var(--surface-0)',
          borderRadius: '50%',
          padding: 2,
          border: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ChannelIcon channel={channel} />
        </div>
        {needsHuman && (
          <div style={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--brand-danger)',
            border: '2px solid var(--surface-0)',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: hasUnread ? 700 : 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {contactName}
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: 'var(--text-muted)',
            flexShrink: 0,
            marginLeft: 8,
          }}>
            {formatTime(timestamp)}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: hasUnread ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontWeight: hasUnread ? 500 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {preview || <em style={{ color: 'var(--text-muted)' }}>Pas de message</em>}
          </span>
          {hasUnread && (
            <span style={{
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              background: 'var(--brand-primary)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              flexShrink: 0,
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {needsHuman && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--brand-danger)',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: 'var(--brand-danger)',
              fontWeight: 500,
            }}>
              En attente d&apos;un humain
            </span>
          </div>
        )}
        {!needsHuman && botActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--brand-success)',
              flexShrink: 0,
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: 'var(--brand-success)',
              fontWeight: 500,
            }}>
              Bot actif
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
