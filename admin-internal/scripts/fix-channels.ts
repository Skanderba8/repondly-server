import { prisma } from '../src/lib/prisma'

async function main() {
  const business = await prisma.business.findUnique({
    where: { email: 'repondly.tn@gmail.com' },
    select: {
      id: true,
      name: true,
      email: true,
      whatsappConnected: true,
      facebookConnected: true,
      instagramConnected: true,
      whatsappInboxId: true,
      facebookInboxId: true,
      instagramInboxId: true,
      repondlyPassword: true,
    }
  })

  console.log('Current business data:', JSON.stringify(business, null, 2))

  if (business) {
    // Update to mark all channels as connected (since user says they are all connected)
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        whatsappConnected: true,
        facebookConnected: true,
        instagramConnected: true,
        repondlyPassword: business.repondlyPassword || 'TempPass123!',
      }
    })
    console.log('Updated business:', JSON.stringify(updated, null, 2))
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
