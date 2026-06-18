'use client'

import { useEffect } from 'react'
import type { Direction, Message } from '@/types'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

type RealtimeMessage = {
  id: string
  content: string
  direction: Direction
  createdAt: string
  type?: Message['type']
  mediaUrl?: string
  mediaType?: string
}

type MessageInsertPayload = {
  new: Record<string, unknown>
}

const DIRECTIONS = new Set<Direction>(['INBOUND', 'OUTBOUND'])
const MESSAGE_TYPES = new Set<NonNullable<Message['type']>>(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'REACTION', 'SYSTEM', 'UNSUPPORTED'])

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readDirection(value: unknown): Direction {
  return typeof value === 'string' && DIRECTIONS.has(value as Direction) ? (value as Direction) : 'INBOUND'
}

function readMessageType(value: unknown): Message['type'] {
  return typeof value === 'string' && MESSAGE_TYPES.has(value as NonNullable<Message['type']>) ? (value as Message['type']) : undefined
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
          const mediaUrl = readString(payload.new.media_url)
          const mediaType = readString(payload.new.media_type)

          if (!id) {
            return
          }

          onNewMessage({
            id,
            content,
            direction: readDirection(payload.new.direction),
            createdAt: createdAt || new Date().toISOString(),
            type: readMessageType(payload.new.type),
            mediaUrl: mediaUrl || undefined,
            mediaType: mediaType || undefined,
          })
        },
      )
      .subscribe()

    return () => {
      void channel.unsubscribe()
    }
  }, [conversationId, onNewMessage])
}
