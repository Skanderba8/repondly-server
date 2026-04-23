import { auth } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const adminEmail = session?.user?.email ?? ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb' }}>
      <AdminSidebar adminEmail={adminEmail} />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
