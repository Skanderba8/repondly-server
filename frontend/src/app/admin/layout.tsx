import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/admin'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Second layer — middleware is the first, this catches any edge cases
  if (!isAdmin(session)) {
    redirect(session?.user ? '/dashboard' : '/auth/signin')
  }

  const adminEmail = session?.user?.email ?? ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb' }}>
      <AdminSidebar adminEmail={adminEmail} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
