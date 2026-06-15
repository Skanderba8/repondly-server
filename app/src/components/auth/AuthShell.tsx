import Image from 'next/image'
import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="rp-auth-root">
      <section className="rp-auth-panel" aria-hidden="true">
        <div className="rp-auth-panel-content">
          <div className="rp-auth-brand">
            <Image src="/logo.png" alt="" width={26} height={26} priority className="rp-auth-logo-image" />
            <span>Répondly<em>.</em></span>
          </div>

          <div className="rp-auth-panel-copy">
            <p>Chaque client mérite une réponse rapide.</p>
            <p>Répondly centralise vos conversations et donne à votre équipe une file de travail claire, fiable et quotidienne.</p>
          </div>
        </div>
      </section>

      <section className="rp-auth-stage" aria-label="Authentification Répondly">
        <div className="rp-auth-mobile-brand" aria-hidden="true">
          <Image src="/logo.png" alt="" width={24} height={24} priority className="rp-auth-logo-image" />
          <span>Répondly<em>.</em></span>
        </div>

        <div className="rp-auth-card">
          <div className="rp-auth-card-header">
            <p className="rp-auth-eyebrow">Espace entreprise</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="rp-auth-card-body">{children}</div>
        </div>
      </section>
    </main>
  )
}
