import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const session = req.auth
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin')

  if (isAdminPath) {
    if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
