'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard, MessageSquare, ShoppingBag, Settings,
  Sun, Moon, LogOut, X,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

const NAV = [
  { href: '/dashboard/accueil',       label: 'Accueil',       icon: LayoutDashboard },
  { href: '/dashboard/messagerie',    label: 'Messagerie',    icon: MessageSquare },
  { href: '/dashboard/commandes',     label: 'Commandes',     icon: ShoppingBag },
  { href: '/dashboard/configuration', label: 'Config',        icon: Settings },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/accueil':       'Accueil',
  '/dashboard/messagerie':    'Messagerie',
  '/dashboard/commandes':     'Commandes',
  '/dashboard/configuration': 'Configuration',
}

function useThemeToggle() {
  const dark = useTheme()
  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    localStorage.setItem('rp_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }
  return { dark, toggle }
}

export default function MobileShell({ children, unreadCount }: {
  children: React.ReactNode
  unreadCount: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { dark, toggle } = useThemeToggle()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const isMessagerie = pathname === '/dashboard/messagerie'

  const businessName = session?.user?.name ?? 'Répondly'
  const initial = businessName.charAt(0).toUpperCase()
  const pageTitle = PAGE_TITLES[pathname] ?? 'Répondly'

  const bg        = dark ? 'rgba(10,10,15,0.88)'   : 'rgba(248,250,252,0.88)'
  const border    = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
  const textPrimary = dark ? '#F1F5F9' : '#0F172A'
  const textMuted   = dark ? '#64748B' : '#94A3B8'
  const navBg       = dark ? 'rgba(18,18,26,0.90)'  : 'rgba(255,255,255,0.90)'
  const navBorder   = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const activePill  = dark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)'
  const sheetBg     = dark ? '#111118' : '#FFFFFF'
  const sheetBorder = dark ? '#1E1E2E' : '#E2E8F0'

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', background: dark ? '#0A0A0F' : '#F8FAFC',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Top Header (hidden on messagerie — it owns its own) ── */}
      {!isMessagerie && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          paddingTop: 'env(safe-area-inset-top)',
          background: bg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: `1px solid ${border}`,
        }}>
          <div style={{
            height: 52, display: 'flex', alignItems: 'center',
            paddingLeft: 16, paddingRight: 16, gap: 12,
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Image src="/logo.png" alt="R" width={24} height={24} style={{ borderRadius: 6 }} />
            </div>

            {/* Page title — center */}
            <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700, color: textPrimary, letterSpacing: '-0.02em' }}>
              {pageTitle}
            </div>

            {/* Avatar — opens profile sheet */}
            <div ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {initial}
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#EF4444', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${dark ? '#0A0A0F' : '#F8FAFC'}`,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{
        flex: 1,
        paddingTop: isMessagerie ? 0 : `calc(52px + env(safe-area-inset-top))`,
        paddingBottom: isMessagerie ? 0 : `calc(72px + env(safe-area-inset-bottom))`,
        overflow: isMessagerie ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        overscrollBehavior: 'contain',
        height: '100%',
      }}>
        {children}
      </div>

      {/* ── Bottom Nav Island (hidden on messagerie) ── */}
      {!isMessagerie && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          padding: '8px 20px',
          paddingBottom: `calc(8px + env(safe-area-inset-bottom))`,
          pointerEvents: 'none',
        }}>
          <div style={{
            background: navBg,
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            border: `1px solid ${navBorder}`,
            borderRadius: 28,
            display: 'flex', alignItems: 'center',
            padding: '6px 8px',
            boxShadow: dark
              ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
            pointerEvents: 'all',
            gap: 4,
          }}>
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 3, padding: '8px 4px',
                    borderRadius: 20, border: 'none', background: 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative', minWidth: 0,
                  }}
                >
                  {/* Active indicator pill */}
                  <div style={{
                    position: 'absolute', top: 4,
                    width: isActive ? 36 : 0,
                    height: 36, borderRadius: 18,
                    background: activePill,
                    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                  }} />

                  {/* Icon + badge */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <Icon
                      size={22}
                      color={isActive ? '#3B82F6' : textMuted}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    {label === 'Messagerie' && unreadCount > 0 && !isActive && (
                      <span style={{
                        position: 'absolute', top: -4, right: -6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#EF4444', color: '#fff',
                        fontSize: 9, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span style={{
                    fontSize: 10, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#3B82F6' : textMuted,
                    letterSpacing: isActive ? '-0.01em' : 0,
                    zIndex: 1, lineHeight: 1,
                  }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Profile bottom sheet ── */}
      {profileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setProfileOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
            background: sheetBg,
            borderRadius: '20px 20px 0 0',
            border: `1px solid ${sheetBorder}`,
            borderBottom: 'none',
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}>
            <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: dark ? '#334155' : '#CBD5E1' }} />
            </div>

            {/* User info */}
            <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${sheetBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff',
                }}>
                  {initial}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>{businessName}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>{session?.user?.email}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '8px 0' }}>
              {/* Theme toggle */}
              <button
                onClick={toggle}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  color: textPrimary, fontSize: 15, cursor: 'pointer',
                  transition: 'background 0.15s', textAlign: 'left',
                }}
                onTouchStart={e => (e.currentTarget as HTMLElement).style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                onTouchEnd={e => { setTimeout(() => { (e.currentTarget as HTMLElement).style.background = 'transparent' }, 150) }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? '#1E1E2E' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#6366F1" />}
                </div>
                {dark ? 'Mode clair' : 'Mode sombre'}
              </button>

              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', border: 'none', background: 'transparent',
                  color: '#EF4444', fontSize: 15, cursor: 'pointer',
                  transition: 'background 0.15s', textAlign: 'left',
                }}
                onTouchStart={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                onTouchEnd={e => { setTimeout(() => { (e.currentTarget as HTMLElement).style.background = 'transparent' }, 150) }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={18} color="#EF4444" />
                </div>
                Déconnexion
              </button>
            </div>

            {/* Cancel */}
            <div style={{ padding: '4px 16px 8px' }}>
              <button
                onClick={() => setProfileOpen(false)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  background: dark ? '#1E1E2E' : '#F1F5F9',
                  border: 'none', color: textPrimary,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
