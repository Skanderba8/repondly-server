'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import ConversationList from '@/components/messagerie/ConversationList'
import ThreadView from '@/components/messagerie/ThreadView'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

interface MessagerieClientProps {
  selectedId?: number | null
}

export default function MessagerieClient({ selectedId: initialSelectedId }: MessagerieClientProps) {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId || null)

  // Sync prop changes (e.g. URL navigation)
  useEffect(() => {
    setSelectedId(initialSelectedId || null)
  }, [initialSelectedId])

  const handleSelect = useCallback(
    (id: number) => {
      if (isDesktop) {
        setSelectedId(id)
      } else {
        router.push(`/dashboard/messagerie/${id}`)
      }
    },
    [isDesktop, router]
  )

  const handleBack = useCallback(() => {
    if (isDesktop) {
      setSelectedId(null)
    } else {
      router.push('/dashboard/messagerie')
    }
  }, [isDesktop, router])

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      background: 'var(--surface-1)',
    }}>
      {/* Left pane: Conversation list */}
      <div style={{
        width: isDesktop ? 360 : '100%',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
        borderRight: isDesktop ? '1px solid var(--surface-border)' : 'none',
        display: isDesktop || !selectedId ? 'flex' : 'none',
        flexDirection: 'column',
      }}>
        <ConversationList
          activeId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Right pane: Thread or empty state */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        overflow: 'hidden',
        display: isDesktop ? 'flex' : selectedId ? 'flex' : 'none',
        flexDirection: 'column',
      }}>
        <AnimatePresence mode="wait">
          {selectedId ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <ThreadView
                conversationId={selectedId}
                onBack={handleBack}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 32,
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--brand-primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquare size={28} color="var(--brand-primary)" />
              </div>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>
                Sélectionnez une conversation
              </span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}>
                Choisissez un contact dans la liste pour voir vos messages
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
