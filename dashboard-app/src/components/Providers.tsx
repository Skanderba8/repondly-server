'use client'
import { SessionProvider } from 'next-auth/react'
import ThemeProvider from '@/components/providers/ThemeProvider'
import LoadingScreen from '@/components/ui/LoadingScreen'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LoadingScreen />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
