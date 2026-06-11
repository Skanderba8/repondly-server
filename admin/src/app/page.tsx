import { prisma } from "@/lib/prisma"

const C = {
  bg: '#ffffff', bgAlt: '#f4f7fb', blue: '#1a6bff', blueLight: '#e8f0ff',
  ink: '#0d1b2e', mid: '#5a6a80', border: '#e2e8f0',
  green: '#16a34a', greenBg: '#dcfce7', red: '#dc2626', redBg: '#fee2e2',
  yellow: '#d97706', yellowBg: '#fef3c7',
}

export default async function AdminDashboardPage() {
  let totalClients = 0
  let activeClients = 0
  let trialClients = 0

  try {
    totalClients = await prisma.business.count()
    activeClients = await prisma.business.count({ where: { planStatus: 'ACTIVE' } })
    trialClients = await prisma.business.count({ where: { planStatus: 'ACTIVE', isPaid: false } })
  } catch (error) {
    console.error("Error fetching overview stats:", error)
  }

  return (
    <div style={{ padding: '32px 36px', background: C.bgAlt, minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>Vue d&apos;ensemble</h1>
        <p style={{ fontSize: 13, color: C.mid, margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total clients', value: totalClients, color: C.blue, bg: C.blueLight },
          { label: 'Clients actifs', value: activeClients, color: C.green, bg: C.greenBg },
          { label: 'En essai', value: trialClients, color: C.yellow, bg: C.yellowBg },
          { label: 'En attente', value: Math.max(0, totalClients - activeClients - trialClients), color: C.mid, bg: C.bgAlt },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.mid, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
