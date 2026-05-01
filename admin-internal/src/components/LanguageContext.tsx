'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'fr' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    'nav.overview': "Vue d'ensemble",
    'nav.clients': 'Clients',
    'nav.onboarding': 'Onboarding',
    'nav.bot': 'Bot Monitor',
    'nav.billing': 'Facturation',
    'nav.system': 'Système',
    'nav.n8n': 'n8n',
    'nav.chatwoot': 'Chatwoot',
    'nav.database': 'Base de données',
    'nav.access': 'Accès',
    'nav.logout': 'Se déconnecter',
    'role.superAdmin': 'Super Admin',
    'role.admin': 'Administrateur',
    'sidebar.collapse': 'Réduire',
    'sidebar.expand': 'Développer',
  },
  en: {
    'nav.overview': 'Overview',
    'nav.clients': 'Clients',
    'nav.onboarding': 'Onboarding',
    'nav.bot': 'Bot Monitor',
    'nav.billing': 'Billing',
    'nav.system': 'System',
    'nav.n8n': 'n8n',
    'nav.chatwoot': 'Chatwoot',
    'nav.database': 'Database',
    'nav.access': 'Access',
    'nav.logout': 'Log out',
    'role.superAdmin': 'Super Admin',
    'role.admin': 'Administrator',
    'sidebar.collapse': 'Collapse',
    'sidebar.expand': 'Expand',
  },
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLanguage(saved)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}