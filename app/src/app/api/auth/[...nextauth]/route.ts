import { NextRequest, NextResponse } from 'next/server'
import { handlers } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export const { GET } = handlers

const originalPOST = handlers.POST

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const allowed = rateLimit(ip, 5, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  return originalPOST(req)
}
