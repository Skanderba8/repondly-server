import { prisma } from '@/lib/prisma'
import ClientsTable from '@/components/admin/ClientsTable'
import Link from 'next/link'

export default async function AdminClientsPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0d1b2e' }}>Clients</h1>
        <Link
          href="/admin/clients/new"
          style={{
            background: '#1a6bff',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Ajouter un client
        </Link>
      </div>
      <ClientsTable businesses={businesses} />
    </div>
  )
}
