'use client'

import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

interface Message {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number
  sender?: { id: number; name: string; type: string; avatar_url?: string }
  status?: string
  error_message?: string
  isBot?: boolean
}

interface MessageBubbleProps {
  msg: Message
  isFirst?: boolean
  isLast?: boolean
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ msg, isFirst = true, isLast = true }: MessageBubbleProps) {
  const isOut = msg.message_type === 1
  const isActivity = msg.message_type === 2
  const isOptimistic = msg.status === 'sending' || (!msg.status && msg.id > 1_000_000_000_000)

  if (isActivity) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'var(--surface-2)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--surface-border)',
        }}>
          {msg.content}
        </span>
      </div>
    )
  }

  // Styling per variant
  let bg: string
  let color: string
  let radius: string

  if (isOut && msg.isBot) {
    // Bot message
    bg = 'var(--brand-primary-soft)'
    color = 'var(--brand-primary)'
    radius = isFirst && isLast
      ? 'var(--radius-bubble) var(--radius-bubble) 4px var(--radius-bubble)'
      : isFirst
        ? 'var(--radius-bubble) var(--radius-bubble) 4px 4px'
        : isLast
          ? '4px 4px 4px var(--radius-bubble)'
          : '4px 4px 4px 4px'
  } else if (isOut) {
    // Human/owner message
    bg = 'var(--brand-primary)'
    color = '#fff'
    radius = isFirst && isLast
      ? 'var(--radius-bubble) var(--radius-bubble) 4px var(--radius-bubble)'
      : isFirst
        ? 'var(--radius-bubble) var(--radius-bubble) 4px 4px'
        : isLast
          ? '4px 4px 4px var(--radius-bubble)'
          : '4px 4px 4px 4px'
  } else {
    // Customer message
    bg = 'var(--surface-1)'
    color = 'var(--text-primary)'
    radius = isFirst && isLast
      ? 'var(--radius-bubble) var(--radius-bubble) var(--radius-bubble) 4px'
      : isFirst
        ? 'var(--radius-bubble) var(--radius-bubble) 4px 4px'
        : isLast
          ? '4px 4px var(--radius-bubble) 4px'
          : '4px 4px 4px 4px'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{
        display: 'flex',
        flexDirection: isOut ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 2,
        opacity: isOptimistic ? 0.6 : 1,
      }}
    >
      <div style={{
        maxWidth: '80%',
        background: bg,
        color: color,
        borderRadius: radius,
        padding: '10px 14px 8px',
        boxShadow: 'var(--shadow-card)',
      }}>
        {isOut && msg.isBot && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 4,
            opacity: 0.7,
          }}>
            <Bot size={10} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              Bot
            </span>
          </div>
        )}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          lineHeight: 1.45,
          margin: 0,
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </p>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          marginTop: 4,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: isOut && !msg.isBot ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
            lineHeight: 1,
          }}>
            {formatTime(msg.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
