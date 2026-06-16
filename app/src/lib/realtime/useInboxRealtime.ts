'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type MessageInsertPayload = {
  new: Record<string, unknown>
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function useInboxRealtime(
  businessId: string,
  onNewMessage: (conversationId: string, preview: string) => void,
) {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const onNewMessageRef = useRef(onNewMessage)

  useEffect(() => {
    onNewMessageRef.current = onNewMessage
  }, [onNewMessage])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`inbox-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `business_id=eq.${businessId}`,
        },
        (payload: MessageInsertPayload) => {
          const conversationId = readString(payload.new.conversation_id)
          const content = readString(payload.new.content)

          if (conversationId) {
            onNewMessageRef.current(conversationId, content)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    return () => {
      setConnected(false)
      void channel.unsubscribe()
    }
  }, [businessId, router])

  return { connected }
}
