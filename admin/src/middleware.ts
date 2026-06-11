import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const role = req.auth?.user?.role

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    const signInUrl = new URL('/auth/signin', req.nextUrl.origin)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Only run middleware on page routes, NOT on:
  // - /api/* (API routes have their own requireAdmin check)
  // - /_next/* (static assets, chunks, images)
  // - /auth/* (signin page — would cause redirect loops)
  // - /favicon.ico, /robots.txt, etc.
  matcher: [
    '/((?!api|_next/static|_next/image|auth|favicon\\.ico|robots\\.txt).*)',
  ],
}
