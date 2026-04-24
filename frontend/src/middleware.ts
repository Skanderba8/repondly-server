import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL

  // ── /admin/* ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Not logged in at all → signin
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    // Logged in but not admin → back to their dashboard
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── /dashboard/* ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    return NextResponse.next()
  }

  // ── /auth/* ───────────────────────────────────────────────────────────────
  // Already signed in → redirect away from auth pages
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/register')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/auth/signin', '/auth/register'],
}
