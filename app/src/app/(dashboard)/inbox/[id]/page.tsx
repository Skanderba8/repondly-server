import { notFound } from 'next/navigation'
import { InboxThread } from '@/components/InboxThread'
import { mockConversations } from '@/lib/mock'

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const conversation = mockConversations.find((item) => item.id === id)

  if (!conversation) {
    notFound()
  }

  return <InboxThread conversation={conversation} showBackButton />
}
