import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthenticated = !!session?.user

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  if ((pathname === '/auth/signin' || pathname === '/auth/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/auth/signin', '/auth/register'],
}
