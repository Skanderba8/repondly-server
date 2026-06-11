import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

function mapSectorToBusinessType(sector: string): string {
  switch (sector) {
    case 'beauty': return 'SALON'
    case 'medical': return 'CLINIC'
    case 'restaurant': return 'RESTAURANT'
    case 'boutique':
    case 'ecommerce':
      return 'BOUTIQUE'
    default: return 'OTHER'
  }
}

function mapSectorToBotMode(sector: string): string {
  switch (sector) {
    case 'beauty':
    case 'medical':
    case 'coaching':
    case 'garage':
      return 'APPOINTMENTS'
    case 'restaurant':
    case 'boutique':
    case 'ecommerce':
      return 'ORDERS'
    default:
      return 'INFO_ONLY'
  }
}

function mapLanguage(lang: string): string {
  switch (lang) {
    case 'darija': return 'DARIJA'
    case 'french':
    case 'mix':
    default:
      return 'FR'
  }
}

function mapPersonalityToTone(personality: string): string {
  switch (personality) {
    case 'warm': return 'chaleureux'
    case 'professional': return 'professionnel'
    case 'direct': return 'direct'
    default: return 'chaleureux'
  }
}

const DAY_MAP: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      sector,
      city,
      phone,
      language,
      services,
      schedule,
      faqs,
      botPersonality,
      botName,
    } = body

    if (!name || !sector || !city) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const businessId = session.user.id

    await prisma.$transaction(async (tx) => {
      // 1. Update Business
      await tx.business.update({
        where: { id: businessId },
        data: {
          name: name.trim(),
          phone: phone?.trim() || undefined,
          businessType: mapSectorToBusinessType(sector) as any,
        },
      })

      // 2. Upsert BotConfig
      await tx.botConfig.upsert({
        where: { businessId },
        update: {
          enabled: true,
        },
        create: {
          businessId,
          systemPrompt: '',
          fallbackMessage: '',
          handoverMessage: '',
          enabled: true,
        },
      })

      // 3. Replace Services
      await tx.service.deleteMany({ where: { businessId } })
      if (Array.isArray(services) && services.length > 0) {
        await tx.service.createMany({
          data: services.map((s: any) => ({
            businessId,
            name: s.name.trim(),
            price: s.price || 0,
            duration: 60,
            isActive: true,
          })),
        })
      }

      // 4. Replace Schedules
      await tx.schedule.deleteMany({ where: { businessId } })
      const scheduleEntries = Object.entries(schedule || {})
        .filter(([, day]: [string, any]) => day.open)
        .map(([key, day]: [string, any]) => ({
          businessId,
          dayOfWeek: DAY_MAP[key],
          openTime: day.from || '09:00',
          closeTime: day.to || '18:00',
          isClosed: false,
        }))
      if (scheduleEntries.length > 0) {
        await tx.schedule.createMany({ data: scheduleEntries })
      }

      // 5. Replace FAQs
      await tx.faq.deleteMany({ where: { businessId } })
      if (Array.isArray(faqs) && faqs.length > 0) {
        await tx.faq.createMany({
          data: faqs.map((f: any) => ({
            businessId,
            question: f.question.trim(),
            answer: f.answer?.trim() || 'Notre équipe vous répondra sous peu.',
          })),
        })
      }

      // 6. Mark onboarding complete
      await tx.onboardingProgress.upsert({
        where: { businessId },
        update: { stage: 'COMPLETE' },
        create: { businessId, stage: 'COMPLETE' },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Onboarding Complete] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}
