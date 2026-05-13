import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        chatwootAccountId: true,
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
    const { name, email, plan, status } = body
    
    const newClient = await prisma.business.create({
      data: {
        name,
        email,
        passwordHash: '', // Placeholder since this is created from admin
        plan: plan || 'FREE',
        status: status || 'TRIAL',
      }
    })
    
    return NextResponse.json({ success: true, client: newClient })
  } catch (err) {
    console.error('Error creating client:', err)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
