import { BotConfigView } from '@/components/BotConfigView'
import { requireBusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function BotPage() {
  const session = await requireBusinessSession()
  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      botEnabled: true,
      botName: true,
      botLanguage: true,
      botMode: true,
      botWorkingHoursStart: true,
      botWorkingHoursEnd: true,
      botKnowledge: true,
      botHandoffKeywords: true,
    },
  })

  return (
    <BotConfigView
      config={{
        businessName: business?.name ?? session.user.name,
        botEnabled: business?.botEnabled ?? false,
        botName: business?.botName ?? '',
        botLanguage: business?.botLanguage ?? 'français',
        botMode: business?.botMode ?? 'professionnel',
        botWorkingHoursStart: business?.botWorkingHoursStart ?? '',
        botWorkingHoursEnd: business?.botWorkingHoursEnd ?? '',
        botKnowledge: business?.botKnowledge ?? '',
        botHandoffKeywords: business?.botHandoffKeywords ?? '',
      }}
    />
  )
}
