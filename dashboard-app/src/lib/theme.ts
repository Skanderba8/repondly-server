'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  return dark
}

export function palette() {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      bg: '#F8F8FA',
      surface: '#FFFFFF',
      surface2: '#F0F0F5',
      border: '#E4E4EF',
      border2: '#E4E4EF',
      borderSub: '#F0F0F5',
      text: '#0F0F14',
      text2: '#6B6B80',
      text3: '#A0A0B4',
      accent: '#6C63FF',
      success: '#22C55E',
      danger: '#EF4444',
      warning: '#F59E0B',
      hoverBg: 'rgba(0,0,0,0.03)',
      activeBg: 'rgba(108,99,255,0.07)',
    }
  }

  const style = getComputedStyle(document.documentElement)
  return {
    bg: style.getPropertyValue('--surface-1').trim() || '#F8F8FA',
    surface: style.getPropertyValue('--surface-0').trim() || '#FFFFFF',
    surface2: style.getPropertyValue('--surface-2').trim() || '#F0F0F5',
    border: style.getPropertyValue('--surface-border').trim() || '#E4E4EF',
    border2: style.getPropertyValue('--surface-border').trim() || '#E4E4EF',
    borderSub: style.getPropertyValue('--surface-2').trim() || '#F0F0F5',
    text: style.getPropertyValue('--text-primary').trim() || '#0F0F14',
    text2: style.getPropertyValue('--text-secondary').trim() || '#6B6B80',
    text3: style.getPropertyValue('--text-muted').trim() || '#A0A0B4',
    accent: style.getPropertyValue('--brand-primary').trim() || '#6C63FF',
    success: style.getPropertyValue('--brand-success').trim() || '#22C55E',
    danger: style.getPropertyValue('--brand-danger').trim() || '#EF4444',
    warning: style.getPropertyValue('--brand-warning').trim() || '#F59E0B',
    hoverBg: document.documentElement.classList.contains('dark')
      ? 'rgba(255,255,255,0.03)'
      : 'rgba(0,0,0,0.03)',
    activeBg: document.documentElement.classList.contains('dark')
      ? 'rgba(108,99,255,0.10)'
      : 'rgba(108,99,255,0.07)',
  }
}
