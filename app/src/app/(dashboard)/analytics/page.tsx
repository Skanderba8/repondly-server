import { AnalyticsView } from '@/components/AnalyticsView'
import { requireBusinessSession } from '@/lib/auth'
import {
  getConversationStatusBreakdown,
  getMessageStats,
  getResponseStats,
  getTopContacts,
  getWeeklyConversations,
} from '@/lib/analytics'

type AnalyticsPageProps = {
  searchParams?: Promise<{ period?: string }>
}

const PERIODS = [7, 30, 90] as const

function parsePeriod(value?: string) {
  const period = Number(value)

  return PERIODS.find((item) => item === period) ?? 30
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await requireBusinessSession()
  const params = searchParams ? await searchParams : undefined
  const period = parsePeriod(params?.period)

  const [
    messageStats,
    previousMessageStats,
    statusBreakdown,
    weeklyConversations,
    topContacts,
    responseStats,
    previousResponseStats,
  ] = await Promise.all([
    getMessageStats(session.user.id, period),
    getMessageStats(session.user.id, period, period),
    getConversationStatusBreakdown(session.user.id),
    getWeeklyConversations(session.user.id),
    getTopContacts(session.user.id),
    getResponseStats(session.user.id, period),
    getResponseStats(session.user.id, period, period),
  ])

  return (
    <AnalyticsView
      period={period}
      messageStats={messageStats}
      previousMessageStats={previousMessageStats}
      statusBreakdown={statusBreakdown}
      weeklyConversations={weeklyConversations}
      topContacts={topContacts}
      responseStats={responseStats}
      previousResponseStats={previousResponseStats}
    />
  )
}
