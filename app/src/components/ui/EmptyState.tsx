import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="rp-empty-state">
      <div className="max-w-[320px]">
        {icon ? <div className="rp-empty-icon">{icon}</div> : null}
        <p className="text-[13px] font-semibold text-[color:var(--text-primary)]">{title}</p>
        <p className="mt-1 text-[12.5px] leading-[1.5] text-[color:var(--text-secondary)]">{description}</p>
      </div>
    </div>
  )
}
