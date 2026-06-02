'use client'

import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('rp_theme') as 'dark' | 'light' | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const theme = stored ?? preferred
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  return <>{children}</>
}
