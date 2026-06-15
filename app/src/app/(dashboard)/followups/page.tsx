import { FollowupsView } from '@/components/FollowupsView'
import { requireBusinessSession } from '@/lib/auth'
import { getFollowUps } from '@/lib/followups'

export default async function FollowupsPage() {
  const session = await requireBusinessSession()
  const followUps = await getFollowUps(session.user.id)

  return <FollowupsView followUps={followUps} />
}
