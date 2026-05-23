'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.getAttribute('data-theme') !== 'light')
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  return dark
}

export function palette(dark: boolean) {
  return {
    bg:          dark ? '#0A0A0F'  : '#F8FAFC',
    surface:     dark ? '#111118'  : '#FFFFFF',
    surface2:    dark ? '#161622'  : '#F1F5F9',
    border:      dark ? '#1E1E2E'  : '#E2E8F0',
    border2:     dark ? '#334155'  : '#CBD5E1',
    borderSub:   dark ? '#1A1A26'  : '#F1F5F9',
    text:        dark ? '#F1F5F9'  : '#0F172A',
    text2:       dark ? '#94A3B8'  : '#475569',
    text3:       dark ? '#64748B'  : '#94A3B8',
    accent:      '#3B82F6',
    success:     '#10B981',
    danger:      '#EF4444',
    warning:     '#F59E0B',
    hoverBg:     dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    activeBg:    dark ? 'rgba(59,130,246,0.1)'   : 'rgba(59,130,246,0.07)',
  }
}
