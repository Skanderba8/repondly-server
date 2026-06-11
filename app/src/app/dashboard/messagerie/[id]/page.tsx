'use client'

import { use } from 'react'
import MessagerieClient from '@/components/messagerie/MessagerieClient'

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const convId = parseInt(id, 10)

  if (isNaN(convId)) {
    return <MessagerieClient selectedId={null} />
  }

  return <MessagerieClient selectedId={convId} />
}
