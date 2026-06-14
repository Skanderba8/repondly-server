import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const AUTH_PAGES = ['/auth/signin', '/auth/signup']
const PROTECTED_PAGES = ['/dashboard', '/inbox', '/contacts', '/followups', '/settings', '/onboarding']
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/webhook']

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const isAuthenticated = Boolean(token?.businessId)
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isProtectedPage = matchesPrefix(pathname, PROTECTED_PAGES)
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicApiRoute = matchesPrefix(pathname, PUBLIC_API_PREFIXES)

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/inbox', request.url))
  }

  if (isProtectedPage && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
    return NextResponse.redirect(signInUrl)
  }

  if (isApiRoute && !isPublicApiRoute && !isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/signin',
    '/auth/signup',
    '/dashboard/:path*',
    '/inbox/:path*',
    '/contacts/:path*',
    '/followups/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/api/:path*',
  ],
}
