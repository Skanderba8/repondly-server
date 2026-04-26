import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function MessageriePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: { email: true, chatwootAccountId: true },
  })

  const accountId = business?.chatwootAccountId
  const email = business?.email
  const chatwootUrl = accountId
    ? `https://inbox.repondly.com/app/accounts/${accountId}/dashboard`
    : 'https://inbox.repondly.com'

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Votre Messagerie</h1>
      <p style={{ color: '#444', marginBottom: '2rem' }}>
          Connectez-vous sur inbox.repondly.com avec votre adresse email Repondly.
      </p>
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>URL</div>
          <a href={chatwootUrl} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 600 }}>
              inbox.repondly.com
          </a>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>Email</div>
          <strong>{email}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        
        <a
          href={chatwootUrl}
          target="_blank"
          rel="noreferrer"
          style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
        >
          Ouvrir la messagerie
        </a>
        
        <a
          href="https://inbox.repondly.com/auth/password/new"
          target="_blank"
          rel="noreferrer"
          style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
        >
          Definir mon mot de passe
        </a>
      </div>
    </main>
  )
}
