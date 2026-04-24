import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const session = req.auth
  const isAuthenticated = !!session?.user
  const isAdminUser = session?.user?.email === process.env.ADMIN_EMAIL

  if (!isAuthenticated) {
    return NextResponse.redirect('https://app.repondly.com/auth/signin')
  }
  if (!isAdminUser) {
    return NextResponse.redirect('https://app.repondly.com/dashboard')
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/:path*'],
}
