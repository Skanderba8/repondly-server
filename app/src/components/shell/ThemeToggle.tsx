'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const dark = useTheme()

  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    localStorage.setItem('rp_theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <button
      onClick={toggle}
      style={{
        width: 44,
        height: 28,
        borderRadius: 14,
        border: '1.5px solid var(--surface-border)',
        background: dark ? 'var(--surface-2)' : 'var(--brand-primary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        position: 'relative',
        flexShrink: 0,
      }}
      aria-label="Changer le thème"
    >
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: dark ? 'var(--text-muted)' : '#fff',
        transform: dark ? 'translateX(0)' : 'translateX(16px)',
        transition: 'transform 0.2s, background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {dark
          ? <Moon size={11} color="var(--surface-1)" />
          : <Sun size={11} color="var(--brand-primary)" />
        }
      </div>
    </button>
  )
}
