import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthenticated = !!session?.user
  const role = session?.user?.role

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
  
  if (pathname === '/auth/signin' && isAuthenticated) {
    const target = role === 'SUPER_ADMIN' || role === 'ADMIN' ? 'https://admin.repondly.com' : '/dashboard'
    return NextResponse.redirect(new URL(target, req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/auth/signin'],
}