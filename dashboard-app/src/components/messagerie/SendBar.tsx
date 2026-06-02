'use client'

import { useRef } from 'react'
import { Send } from 'lucide-react'

interface SendBarProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
}

export default function SendBar({ value, onChange, onSend, disabled }: SendBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--surface-0)',
      borderTop: '1px solid var(--surface-border)',
      padding: '10px 16px',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
      zIndex: 10,
    }}>
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
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: canSend ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: canSend ? 1 : 0.3,
            transition: 'opacity 0.15s, background 0.15s',
          }}
        >
          <Send size={16} color={canSend ? '#fff' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  )
}
