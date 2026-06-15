import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[color:var(--color-canvas)] px-6 py-10 text-center">
      <section className="rp-panel w-full max-w-[380px] p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[color:var(--color-text-muted)]">404</p>
        <h1 className="mt-3 text-[22px] font-semibold text-[color:var(--color-text-primary)]">Page introuvable</h1>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-[color:var(--color-text-secondary)]">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/inbox" className="mt-5 inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--color-accent)] bg-[color:var(--color-accent)] px-3.5 text-[13px] font-medium text-[color:var(--color-text-inverse)] transition-colors duration-[var(--ease-fast)] hover:bg-[color:var(--color-accent-hover)]">
          Retour à l'inbox
        </Link>
      </section>
    </main>
  )
}
