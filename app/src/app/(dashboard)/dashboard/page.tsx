import { DashboardView } from '@/components/DashboardView'
import { requireBusinessSession } from '@/lib/auth'
import { getDashboardStats, getFollowUpConversations, getRecentConversations } from '@/lib/dashboard'

export default async function DashboardHomePage() {
  const session = await requireBusinessSession()
  const [stats, recentConversations, followUpConversations] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentConversations(session.user.id),
    getFollowUpConversations(session.user.id),
  ])

  return (
    <DashboardView
      stats={stats}
      recentConversations={recentConversations}
      followUpConversations={followUpConversations}
    />
  )
}
