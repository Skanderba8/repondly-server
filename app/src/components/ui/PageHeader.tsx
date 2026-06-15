import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="nx-page-header">
      <div className="min-w-0">
        {eyebrow ? <p className="nx-section-label">{eyebrow}</p> : null}
        <h1 className="nx-page-title">{title}</h1>
        {description ? <p className="nx-page-sub">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{actions}</div> : null}
    </section>
  )
}
