import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-page)] px-6 py-10 text-center">
      <section className="nx-card w-full max-w-[380px] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">404</p>
        <h1 className="mt-3 text-[22px] font-semibold text-[color:var(--text-primary)]">Page introuvable</h1>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-[color:var(--text-secondary)]">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/inbox" className="nx-btn nx-btn-primary mt-5">
          Retour à l'inbox
        </Link>
      </section>
    </main>
  )
}
