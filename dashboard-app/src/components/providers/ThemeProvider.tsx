'use client'

import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('rp_theme') as 'dark' | 'light' | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const theme = stored ?? preferred
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return <>{children}</>
}
