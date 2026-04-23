'use client'
import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

export default function Topbar({ session }: { session: Session }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { tr, lang, toggle } = useLang()
  const initials = session.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

  return (
    <header style={{ height: '56px', background: '#ffffff', borderBottom: '1px solid #ebebea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <button onClick={toggle} style={{ background: 'transparent', border: '1px solid #ebebea', color: '#6b6b67', padding: '5px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>

        <a href="https://app.repondly.com" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#6b6b67', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ebebea', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4d3ce' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ebebea' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
          {tr.topbarInbox}
        </a>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
            {initials}
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', top: '40px', right: 0, background: '#ffffff', border: '1px solid #ebebea', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: '180px', padding: '6px', zIndex: 100 }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #ebebea', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#111110' }}>{session.user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9b9b97', marginTop: '2px' }}>{session.user?.email}</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#dc2626', borderRadius: '6px', fontFamily: 'inherit', transition: 'background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                {tr.topbarSignout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
