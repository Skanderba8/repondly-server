'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface Message {
  id: number
  content: string
  content_type: string
  created_at: number
  message_type: number
  sender?: { id: number; name: string; type: string; avatar_url?: string }
  status?: string
  error_message?: string
}

interface MessageBubbleProps {
  msg: Message
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ msg }: MessageBubbleProps) {
  const isOut = msg.message_type === 1
  const isActivity = msg.message_type === 2
  const isOptimistic = msg.status === 'sending' || (!msg.status && msg.id > 1_000_000_000_000)

  if (isActivity) {
    return (
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: 'var(--color-text-3)',
          background: 'var(--color-surface-2)',
          padding: '4px 12px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--color-border)',
        }}>
          {msg.content}
        </span>
      </div>
    )
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
        marginBottom: 6,
        opacity: isOptimistic ? 0.6 : 1,
      }}
    >
      <div style={{
        maxWidth: '80%',
        background: isOut ? 'var(--color-accent)' : 'var(--color-surface-2)',
        color: isOut ? '#fff' : 'var(--color-text)',
        borderRadius: isOut
          ? 'var(--radius-bubble) var(--radius-bubble) 4px var(--radius-bubble)'
          : 'var(--radius-bubble) var(--radius-bubble) var(--radius-bubble) 4px',
        padding: '10px 14px 8px',
        boxShadow: 'var(--shadow-card)',
      }}>
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
          {isOptimistic && <Clock size={10} color={isOut ? 'rgba(255,255,255,0.7)' : 'var(--color-text-3)'} />}
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: isOut ? 'rgba(255,255,255,0.7)' : 'var(--color-text-3)',
            lineHeight: 1,
          }}>
            {formatTime(msg.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
