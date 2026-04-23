'use client'
import { SessionProvider } from 'next-auth/react'
import { LangProvider } from '@/lib/LangContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LangProvider>{children}</LangProvider>
    </SessionProvider>
  )
}
