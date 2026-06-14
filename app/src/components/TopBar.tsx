import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  action?: ReactNode
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <header className="rp-topbar" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="rp-topbar-inner">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-primary)] text-[11px] font-semibold text-[color:var(--text-on-brand)]">
          R
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Répondly
          </p>
          <h1 className="truncate text-[14px] font-semibold leading-[1.1] text-[color:var(--text-primary)]">
            {title}
          </h1>
        </div>
        {action}
      </div>
    </header>
  )
}
