import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  action?: ReactNode
}

export function TopBar({ title, action }: TopBarProps) {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center border-b border-[var(--border)] bg-white px-4 md:hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <h1 className="flex-1 text-sm font-semibold text-[var(--text-primary)]">{title}</h1>
      {action}
    </header>
  )
}
