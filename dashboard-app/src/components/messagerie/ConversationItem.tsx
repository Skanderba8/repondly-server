'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Contact {
  id: number
  name: string
  phone_number: string | null
  email: string | null
  avatar_url: string | null
}

interface ConversationItemData {
  id: number
  unread_count: number
  last_activity_at: number
  inbox: { id: number; name: string; channel_type: string }
  meta: { sender: Contact }
  last_non_activity_message?: {
    content: string
    created_at: number
    message_type: number
  }
}

interface ConversationItemProps {
  conv: ConversationItemData
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7)  return d.toLocaleDateString('fr-TN', { weekday: 'short' })
  return d.toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit' })
}

function channelColor(channelType: string): string {
  if (channelType === 'Channel::Whatsapp') return '#22C55E'
  if (channelType === 'Channel::FacebookPage' || channelType === 'Channel::Instagram') return '#EC4899'
  return 'var(--brand-primary)'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function ChannelBadge({ channelType }: { channelType: string }) {
  const color = channelColor(channelType)
  const size = 14

  if (channelType === 'Channel::Whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>f</span>
    </div>
  )
}

export default function ConversationItem({ conv }: ConversationItemProps) {
  const contact = conv.meta.sender
  const preview = conv.last_non_activity_message?.content || ''
  const ts = conv.last_non_activity_message?.created_at || conv.last_activity_at
  const isOut = conv.last_non_activity_message?.message_type === 1
  const hasUnread = conv.unread_count > 0
  const color = channelColor(conv.inbox?.channel_type)
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/dashboard/messagerie/${conv.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          height: 72,
          background: hasUnread ? 'var(--brand-primary-soft)' : 'transparent',
          borderLeft: `3px solid ${hasUnread ? 'var(--brand-primary)' : 'transparent'}`,
          borderBottom: '1px solid var(--surface-border)',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {/* Avatar with channel badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {contact.avatar_url && !imgError ? (
            <img
              src={contact.avatar_url}
              alt={contact.name}
              onError={() => setImgError(true)}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: `${color}20`,
              border: `2px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color,
            }}>
              {initials(contact.name)}
            </div>
          )}
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
            <ChannelBadge channelType={conv.inbox?.channel_type} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: hasUnread ? 600 : 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {contact.name}
            </span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: 'var(--text-muted)',
              flexShrink: 0,
              marginLeft: 8,
            }}>
              {formatTime(ts)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
              {isOut && <span style={{ color: 'var(--brand-primary)', marginRight: 4 }}>↗</span>}
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
                {conv.unread_count > 99 ? '99+' : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
