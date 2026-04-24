'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLang } from '@/lib/LangContext'

export default function Sidebar() {
  const path = usePathname()
  const { tr } = useLang()

  const nav = [
    { href: '/dashboard', label: tr.sidebarOverview, icon: <GridIcon /> },
    { href: '/dashboard/rules', label: tr.sidebarRules, icon: <ZapIcon /> },
    { href: '/dashboard/reminders', label: tr.sidebarReminders, icon: <BellIcon /> },
    { href: '/dashboard/bookings', label: tr.sidebarBookings, icon: <CalendarIcon /> },
    { href: '/dashboard/settings', label: tr.sidebarSettings, icon: <SettingsIcon /> },
  ]

  return (
    <aside style={{ width: '220px', minHeight: '100vh', background: '#ffffff', borderRight: '1px solid #ebebea', display: 'flex', flexDirection: 'column', padding: '0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #ebebea' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Repondly" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.15rem', color: '#111110', letterSpacing: '-0.02em' }}>
            Répondly<span style={{ color: '#2563eb' }}>.</span>
          </span>
        </Link>
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {nav.map((item) => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', marginBottom: '2px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 500 : 400, color: active ? '#111110' : '#6b6b67', background: active ? '#f3f3f1' : 'transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f9f9f8' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ color: active ? '#2563eb' : '#9b9b97', display: 'flex' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 10px', borderTop: '1px solid #ebebea' }}>
        <Link href="https://app.repondly.com" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', color: '#6b6b67', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9f9f8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span style={{ color: '#9b9b97', display: 'flex' }}><InboxIcon /></span>
          {tr.sidebarInbox}
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#c4c4c0' }}>↗</span>
        </Link>
      </div>
    </aside>
  )
}

function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function ZapIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> }
function BellIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function InboxIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> }
