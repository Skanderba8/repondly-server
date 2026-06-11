import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const clients = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        planStatus: true,
        createdAt: true,
      }
    })
    return NextResponse.json({ clients })
  } catch (err) {
    console.error('Error fetching clients:', err)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, plan, planStatus, trialEndsAt } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    const validPlan = ['TRIAL', 'STARTER', 'PRO', 'ENTERPRISE'].includes(plan?.toUpperCase()) ? plan.toUpperCase() : 'TRIAL'
    const validStatus = ['ACTIVE', 'SUSPENDED', 'CANCELLED'].includes(planStatus?.toUpperCase()) ? planStatus.toUpperCase() : 'ACTIVE'

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)

    const newClient = await prisma.business.create({
      data: {
        name,
        email,
        phone: '',
        slug,
        passwordHash: await bcrypt.hash(password, 12),
        plan: validPlan,
        planStatus: validStatus,
        onboardingStage: 'LEAD',
        botLanguage: 'FR',
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      client: newClient,
    })
  } catch (err) {
    console.error('Error creating client:', err)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
