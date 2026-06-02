'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import TopBar from '@/components/shell/TopBar'
import IslandNav from '@/components/shell/IslandNav'
import Sidebar from '@/components/shell/Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [waConnected, setWaConnected] = useState(false)
  const [fbConnected, setFbConnected] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

  const isThreadView = /^\/dashboard\/messagerie\/.+/.test(pathname)
  const isMsg = pathname.startsWith('/dashboard/messagerie')

  // SSE for real-time unread count
  useEffect(() => {
    let es: EventSource
    let retryTimeout: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource('/api/sse')
      sseRef.current = es

      es.addEventListener('message_created', () => {
        setUnreadCount((prev) => prev + 1)
      })
      es.addEventListener('conversation_updated', () => {
        setUnreadCount((prev) => prev + 1)
      })

      es.onerror = () => {
        es.close()
        retryTimeout = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      es.close()
      clearTimeout(retryTimeout)
      sseRef.current = null
    }
  }, [])

  // Channel status
  useEffect(() => {
    Promise.all([
      fetch('/api/whatsapp/status').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/meta/pages').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([wa, meta]) => {
        if (wa) setWaConnected(!!wa.whatsappConnected)
        if (meta)
          setFbConnected(
            (meta.pages ?? []).some(
              (p: { channel: string }) =>
                p.channel === 'FACEBOOK' || p.channel === 'INSTAGRAM'
            )
          )
      })
      .catch(() => {})
  }, [])

  return (
    <div className="rp-shell">
      {/* Desktop sidebar */}
      <Sidebar
        unreadCount={unreadCount}
        waConnected={waConnected}
        fbConnected={fbConnected}
      />

      {/* Mobile top bar */}
      {!isThreadView && <TopBar unreadCount={unreadCount} />}

      {/* Content area */}
      <main
        className={`rp-content${isMsg && !isThreadView ? ' rp-msg' : ''}${isThreadView ? ' rp-fullscreen' : ''}`}
        style={{ marginLeft: 0, background: 'var(--surface-1)' }}
      >
        <style>{`@media (min-width: 768px) { .rp-content { margin-left: var(--shell-sidebar-width) !important; } }`}</style>
        {children}
      </main>

      {/* Mobile island nav */}
      {!isThreadView && (
        <div className="rp-mobile-nav">
          <IslandNav unreadCount={unreadCount} />
        </div>
      )}
    </div>
  )
}
