import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  action?: ReactNode
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b border-[color:var(--surface-border)] bg-[color:var(--surface-0)]/88 backdrop-blur md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center gap-3 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] text-[11px] font-semibold text-[color:var(--brand)] shadow-[var(--shadow-card)]">
          R.
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Répondly</p>
          <h1 className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  )
}
