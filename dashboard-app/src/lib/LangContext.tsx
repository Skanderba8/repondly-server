'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { Lang, t } from './i18n'

type LangCtx = { lang: Lang; tr: typeof t['fr']; toggle: () => void }
const LangContext = createContext<LangCtx>({ lang: 'fr', tr: t.fr, toggle: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  const toggle = () => setLang(l => l === 'fr' ? 'en' : 'fr')
  return <LangContext.Provider value={{ lang, tr: t[lang], toggle }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
