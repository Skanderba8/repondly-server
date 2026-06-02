'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import BottomSheet from '@/components/ui/BottomSheet'
import ThemeToggle from '@/components/shell/ThemeToggle'

interface ProfileSheetProps {
  open: boolean
  onClose: () => void
}

export default function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? 'Mon Entreprise'
  const email = session?.user?.email ?? ''
  const initial = name.charAt(0).toUpperCase()

  return (
    <BottomSheet open={open} onClose={onClose}>
      {/* User info */}
      <div style={{
        padding: '12px 20px 16px',
        borderBottom: '1px solid var(--surface-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 0' }}>
        {/* Apparence */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}>
            🎨
          </div>
          <span style={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: 'var(--text-primary)',
          }}>
            Apparence
          </span>
          <ThemeToggle />
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 20px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onTouchStart={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.08)')}
          onTouchEnd={e => { setTimeout(() => { e.currentTarget.style.background = 'transparent' }, 150) }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,59,48,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <LogOut size={18} color="var(--brand-danger)" />
          </div>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: 'var(--brand-danger)',
          }}>
            Déconnexion
          </span>
        </button>
      </div>

      {/* Cancel */}
      <div style={{ padding: '4px 16px 8px' }}>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: 'var(--surface-2)',
            border: 'none',
            color: 'var(--text-primary)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </BottomSheet>
  )
}
