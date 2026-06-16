'use client'

import { useEffect } from 'react'
import type { Direction } from '@/types'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type RealtimeMessage = {
  id: string
  content: string
  direction: Direction
  createdAt: string
}

type MessageInsertPayload = {
  new: Record<string, unknown>
}

const DIRECTIONS = new Set<Direction>(['INBOUND', 'OUTBOUND'])

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readDirection(value: unknown): Direction {
  return typeof value === 'string' && DIRECTIONS.has(value as Direction) ? (value as Direction) : 'INBOUND'
}

export function useMessageRealtime(
  conversationId: string,
  onNewMessage: (msg: RealtimeMessage) => void,
) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: MessageInsertPayload) => {
          const id = readString(payload.new.id)
          const content = readString(payload.new.content)
          const createdAt = readString(payload.new.created_at)

          if (!id) {
            return
          }

          onNewMessage({
            id,
            content,
            direction: readDirection(payload.new.direction),
            createdAt: createdAt || new Date().toISOString(),
          })
        },
      )
      .subscribe()

    return () => {
      void channel.unsubscribe()
    }
  }, [conversationId, onNewMessage])
}
