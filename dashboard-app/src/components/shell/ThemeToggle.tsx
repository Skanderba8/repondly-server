'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const dark = useTheme()

  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    localStorage.setItem('rp_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      style={{
        width: 44,
        height: 28,
        borderRadius: 14,
        border: '1.5px solid var(--color-border)',
        background: dark ? 'var(--color-surface-2)' : 'var(--color-accent)',
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
        background: dark ? 'var(--color-text-3)' : '#fff',
        transform: dark ? 'translateX(0)' : 'translateX(16px)',
        transition: 'transform 0.2s, background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {dark
          ? <Moon size={11} color="var(--color-bg)" />
          : <Sun size={11} color="var(--color-accent)" />
        }
      </div>
    </button>
  )
}
