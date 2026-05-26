'use client'

import ConversationList from '@/components/messagerie/ConversationList'
import PageTransition from '@/components/ui/PageTransition'

export default function MessageriePage() {
  return (
    <PageTransition>
      <ConversationList />
    </PageTransition>
  )
}
