import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[color:var(--surface-1)] px-6 py-10 text-center">
      <section className="rp-panel w-full max-w-[380px] p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">404</p>
        <h1 className="mt-3 text-[22px] font-semibold text-[color:var(--text-primary)]">Page introuvable</h1>
        <p className="mt-2 text-sm leading-[1.55] text-[color:var(--text-secondary)]">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/inbox" className="mt-5 inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-primary)] bg-[color:var(--brand-primary)] px-3.5 text-[13px] font-semibold text-[color:var(--text-on-brand)] transition-colors duration-[var(--transition-fast)] hover:bg-[color:var(--brand-primary-hover)]">
          Retour à l'inbox
        </Link>
      </section>
    </main>
  )
}
