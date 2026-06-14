import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/api/((?!auth|webhook|health|internal|bot/test-message|webhook/test).)*',
  ],
}
