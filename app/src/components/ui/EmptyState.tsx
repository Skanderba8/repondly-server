import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rp-empty-state">
      <div className="max-w-[320px]">
        {icon ? <div className="rp-empty-icon">{icon}</div> : null}
        <p className="text-[13px] font-semibold text-[color:var(--color-text-primary)]">{title}</p>
        <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[color:var(--color-text-muted)]">{description}</p>
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  )
}
