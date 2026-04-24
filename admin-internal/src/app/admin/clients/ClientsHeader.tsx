'use client'

import Link from 'next/link'
import { UserPlus } from 'lucide-react'

export default function ClientsHeader({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0d1b2e', margin: 0 }}>Clients</h1>
        <p style={{ fontSize: 13, color: '#5a6a80', margin: '4px 0 0' }}>
          {count} client{count !== 1 ? 's' : ''} au total
        </p>
      </div>
      <Link
        href="/admin/clients/new"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#1a6bff', color: '#fff',
          padding: '9px 18px', borderRadius: 9,
          textDecoration: 'none', fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(26,107,255,0.3)',
          transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.background = '#0047cc'
          el.style.boxShadow = '0 4px 16px rgba(26,107,255,0.4)'
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.background = '#1a6bff'
          el.style.boxShadow = '0 2px 8px rgba(26,107,255,0.3)'
          el.style.transform = 'translateY(0)'
        }}
      >
        <UserPlus size={15} />
        Ajouter un client
      </Link>
    </div>
  )
}
