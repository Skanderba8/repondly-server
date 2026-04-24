import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default function Dashboard() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome to Repondly</h1>
      <p>Dashboard coming soon.</p>
    </main>
  )
}
