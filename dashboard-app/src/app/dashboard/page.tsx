import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Bonjour, {session.user.name}
      </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{session.user.email}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <a
          href="/api/messagerie"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            background: '#4f46e5',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            gap: '0.5rem',
          }}
        >
          Messagerie
        </a>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          background: '#f3f4f6',
          color: '#9ca3af',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '1rem',
          gap: '0.5rem',
        }}>
          Reservations (bientot)
        </div>
      </div>
    </main>
  )
}
