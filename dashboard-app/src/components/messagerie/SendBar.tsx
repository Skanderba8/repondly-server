'use client'

import { useRef } from 'react'
import { Send, Bot } from 'lucide-react'
import { motion } from 'framer-motion'

interface SendBarProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  botActive: boolean
  onPauseBot: () => void
}

export default function SendBar({
  value,
  onChange,
  onSend,
  disabled,
  botActive,
  onPauseBot,
}: SendBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    // Max ~4 rows at ~20px per row + padding
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Bot active notice */}
      {botActive && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand-primary-soft)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'var(--brand-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={14} />
            <span>Le bot répond automatiquement</span>
          </div>
          <button
            onClick={onPauseBot}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--brand-primary)',
              background: 'transparent',
              color: 'var(--brand-primary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Répondre manuellement
          </button>
        </motion.div>
      )}

      {/* Input row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        background: 'var(--surface-2)',
        borderRadius: 20,
        padding: '8px 8px 8px 16px',
        border: '1px solid var(--surface-border)',
      }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            lineHeight: 1.45,
            color: 'var(--text-primary)',
            overflowY: 'auto',
            maxHeight: 96,
            minHeight: 24,
          }}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            height: 34,
            borderRadius: 'var(--radius-pill)',
            background: canSend ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            flexShrink: 0,
            opacity: canSend ? 1 : 0.3,
            transition: 'opacity 0.15s, background 0.15s',
            padding: canSend && !isMobile ? '0 14px' : '0',
            width: canSend && !isMobile ? 'auto' : 34,
          }}
        >
          <Send size={16} color={canSend ? '#fff' : 'var(--text-muted)'} />
          {canSend && !isMobile && (
            <span style={{
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}>
              Envoyer
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
