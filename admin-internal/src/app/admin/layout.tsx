import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!role || !['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    redirect('/auth/signin')
  }

  // Fetch fresh AdminUser from DB to get up-to-date name and role
  const email = session?.user?.email ?? ''
  const dbUser = email
    ? await prisma.adminUser.findUnique({ where: { email }, select: { name: true, role: true } }).catch(() => null)
    : null

  const adminUser = {
    email,
    name: dbUser?.name ?? session?.user?.name ?? '',
    role: (dbUser?.role ?? role ?? 'ADMIN') as 'SUPER_ADMIN' | 'ADMIN',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb' }}>
      <AdminSidebar adminUser={adminUser} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
