import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const role = req.auth?.user?.role

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.redirect('https://app.repondly.com/auth/signin')
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
