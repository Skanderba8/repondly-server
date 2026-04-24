import { prisma } from '@/lib/prisma'
import ClientsTable from '@/components/admin/ClientsTable'
import ClientsHeader from './ClientsHeader'

export default async function AdminClientsPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={{ padding: '32px 36px', background: '#f4f7fb', minHeight: '100vh' }}>
      <ClientsHeader count={businesses.length} />
      <ClientsTable businesses={businesses} />
    </div>
  )
}
