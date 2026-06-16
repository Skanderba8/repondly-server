import { InboxView } from '@/components/InboxView'
import { requireBusinessSession } from '@/lib/auth'
import { getInboxConversations } from '@/lib/inbox'

export default async function InboxPage() {
  const session = await requireBusinessSession()
  const conversations = await getInboxConversations(session.user.id)

  return <InboxView businessId={session.user.id} conversations={conversations} />
}
