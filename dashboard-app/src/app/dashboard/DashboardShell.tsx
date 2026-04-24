'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f8' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', border: '2px solid #e5e5e3', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f9f8', fontFamily: "'Geist', 'DM Sans', sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar session={session} />
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
