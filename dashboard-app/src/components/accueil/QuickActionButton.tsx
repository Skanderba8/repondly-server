'use client'

import { Loader2, CheckCircle2 } from 'lucide-react'

interface QuickActionButtonProps {
  icon: React.ReactNode
  label: string
  successLabel?: string
  success?: boolean
  loading?: boolean
  onClick: () => void
  variant?: 'default' | 'danger'
}

export default function QuickActionButton({
  icon,
  label,
  successLabel,
  success,
  loading,
  onClick,
  variant = 'default',
}: QuickActionButtonProps) {
  const isSuccess = success && successLabel
  const bg = isSuccess
    ? 'var(--brand-success-soft)'
    : variant === 'danger'
      ? 'var(--brand-danger-soft)'
      : 'var(--brand-primary-soft)'
  const border = isSuccess
    ? 'var(--brand-success)'
    : variant === 'danger'
      ? 'var(--brand-danger)'
      : 'var(--brand-primary)'
  const text = isSuccess
    ? 'var(--brand-success)'
    : variant === 'danger'
      ? 'var(--brand-danger)'
      : 'var(--brand-primary)'

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%',
        height: 56,
        borderRadius: 'var(--radius-md)',
        border: `1.5px solid ${border}`,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 18px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.25s ease',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        color: text,
      }}
    >
      {loading ? (
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
      ) : isSuccess ? (
        <CheckCircle2 size={20} />
      ) : (
        icon
      )}
      <span style={{ flex: 1, textAlign: 'left' }}>
        {isSuccess ? successLabel : label}
      </span>
    </button>
  )
}
