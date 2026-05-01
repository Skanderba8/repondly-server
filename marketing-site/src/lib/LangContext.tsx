'use client'
import { createContext, useContext, useState, ReactNode, useSyncExternalStore } from 'react'
import { Lang, t } from './i18n'

type LangCtx = { lang: Lang; tr: typeof t['fr']; toggle: () => void }
const LangContext = createContext<LangCtx>({ lang: 'fr', tr: t.fr, toggle: () => {} })

// Safe localStorage access
function getStoredLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const saved = localStorage.getItem('repondly-lang') as Lang | null
  return saved === 'en' ? 'en' : 'fr'
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<Lang>(
    subscribe,
    getStoredLang,
    () => 'fr'
  )

  const [, setTick] = useState(0)

  const toggle = () => {
    const newLang: Lang = lang === 'fr' ? 'en' : 'fr'
    localStorage.setItem('repondly-lang', newLang)
    setTick(t => t + 1) // Force re-render
  }

  return <LangContext.Provider value={{ lang, tr: t[lang], toggle }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
