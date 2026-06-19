import { Plan } from '@prisma/client'
import { NextResponse } from 'next/server'
import { requireBusinessApiSession } from '@/lib/auth'
import { activateManualSubscription, getSubscriptionState } from '@/lib/subscription'

type PlanBody = {
  plan?: Plan
}

function isPaidPlan(value: unknown): value is Plan {
  return typeof value === 'string' && Object.values(Plan).includes(value as Plan)
}

export async function GET() {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const subscription = await getSubscriptionState(session.user.id)

  if (!subscription) {
    return NextResponse.json({ success: false, error: 'Entreprise introuvable.' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: subscription })
}

export async function POST(request: Request) {
  const { response, session } = await requireBusinessApiSession()

  if (response || !session) {
    return response
  }

  const body = await request.json() as PlanBody

  if (!isPaidPlan(body.plan)) {
    return NextResponse.json({ success: false, error: 'Plan invalide.' }, { status: 400 })
  }

  const subscription = await activateManualSubscription(session.user.id, body.plan)

  return NextResponse.json({ success: true, data: subscription })
}
