import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()
  if (!name || !email || !password)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const exists = await prisma.business.findUnique({ where: { email } })
  if (exists)
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  const passwordHash = await bcrypt.hash(password, 12)
  const business = await prisma.business.create({
    data: { name, email, passwordHash },
  })
  return NextResponse.json({ id: business.id, email: business.email }, { status: 201 })
}
