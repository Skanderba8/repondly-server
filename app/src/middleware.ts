import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSupabaseAuthenticated, updateSupabaseSession } from '@/lib/supabase/middleware'

const AUTH_PAGES = ['/auth/signin', '/auth/signup']
const PROTECTED_PAGES = ['/dashboard', '/inbox', '/contacts', '/followups', '/settings', '/onboarding']

const PUBLIC_API_PREFIXES = [
  '/api/auth/register',
  '/api/webhook',
  '/api/meta/webhooks',
]

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function withSupabaseCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  return target
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const { response, user } = await updateSupabaseSession(request)
  const isAuthenticated = isSupabaseAuthenticated(user)
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isProtectedPage = matchesPrefix(pathname, PROTECTED_PAGES)
  const isApiRoute = pathname.startsWith('/api/')
  const isPublicApiRoute = matchesPrefix(pathname, PUBLIC_API_PREFIXES)

  if (isAuthPage) {
    return response
  }

  if (isProtectedPage && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', `${pathname}${search}`)
    return withSupabaseCookies(NextResponse.redirect(signInUrl), response)
  }

  if (isApiRoute && !isPublicApiRoute && !isAuthenticated) {
    return withSupabaseCookies(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      response,
    )
  }

  return response
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