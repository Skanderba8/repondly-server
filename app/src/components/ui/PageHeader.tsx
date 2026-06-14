import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="rp-page-header">
      <div className="min-w-0">
        {eyebrow ? <p className="rp-section-label">{eyebrow}</p> : null}
        <h1 className="rp-page-title">{title}</h1>
        {description ? <p className="rp-page-subtitle">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{actions}</div> : null}
    </section>
  )
}
