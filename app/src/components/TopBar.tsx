'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Calendar, ChevronDown, CircleHelp, LogOut, Search, Settings, UserPlus } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'

interface TopBarProps {
  title: string
  businessName?: string
  plan?: string
}

function getDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())
}

export function TopBar({ title, businessName = 'Business', plan = 'Business' }: TopBarProps) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    document.title = `${title} | Répondly`
  }, [title])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const menu = menuRef.current

      if (!menu || !menu.open || !(event.target instanceof Node) || menu.contains(event.target)) return

      menu.open = false
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/auth/signin')
    router.refresh()
  }

  return (
    <header className="nx-topbar">
      <div className="nx-search">
        <Search className="h-3.5 w-3.5 shrink-0 text-[color:var(--text-muted)]" aria-hidden="true" />
        <input type="search" placeholder="Rechercher dans Répondly..." aria-label="Rechercher" />
      </div>
      <h1 className="nx-topbar-title">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button type="button" className="nx-date-pill" aria-label="Date du jour">
          <Calendar className="h-4 w-4" aria-hidden="true" />
          <span>{getDateLabel()}</span>
        </button>
        <button type="button" className="nx-topbar-icon" aria-label="Notifications">
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--danger)]" aria-hidden="true" />
        </button>
        <button type="button" className="nx-topbar-icon" aria-label="Aide">
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
        </button>
        <details ref={menuRef} className="nx-user-menu">
          <summary className="nx-user-block" aria-label="Menu du compte">
            <span className="nx-topbar-logo" aria-hidden="true">
              <img src="/logo.png" alt="" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold leading-tight text-[color:var(--text-primary)]">{businessName}</p>
              <p className="truncate text-[11px] leading-tight text-[color:var(--text-muted)]">Plan {plan}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-muted)]" aria-hidden="true" />
          </summary>
          <div className="nx-user-dropdown">
            <button type="button" className="nx-user-menu-item">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Inviter un membre
            </button>
            <Link href="/settings" className="nx-user-menu-item">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Paramètres
            </Link>
            <button
              type="button"
              className="nx-user-menu-item nx-user-menu-item-danger"
              onClick={() => {
                void handleSignOut()
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Déconnexion
            </button>
          </div>
        </details>
      </div>
    </header>
  )
}
