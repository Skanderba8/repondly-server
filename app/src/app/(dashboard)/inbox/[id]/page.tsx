import { notFound } from 'next/navigation'
import { InboxThread } from '@/components/InboxThread'
import { requireBusinessSession } from '@/lib/auth'
import { getInboxConversationById } from '@/lib/inbox'

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireBusinessSession()
  const { id } = await params
  const conversation = await getInboxConversationById(session.user.id, id)

  if (!conversation) {
    notFound()
  }

  return <InboxThread conversation={conversation} showBackButton />
}
