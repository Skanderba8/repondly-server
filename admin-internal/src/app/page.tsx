import { prisma } from "@/lib/prisma"
import AdminOverviewClient from "./OverviewClient"

export default async function AdminDashboardPage() {
  // Fetch actual data from Prisma where possible, fallback to defaults
  let totalClients = 0;
  
  try {
    totalClients = await prisma.client.count();
  } catch (error) {
    console.error("Error fetching overview stats:", error);
  }

  const mockServices = {
    botOnline: true,
    appOnline: true,
    chatwootOnline: true,
    marketingOnline: true,
    dashboardOnline: true,
  }

  return (
    <AdminOverviewClient
      stats={{
        totalClients,
        activeClients: 0,
        trialClients: 0,
        mrr: 0,
        trialsExpiring: 0,
        pendingConfig: 0,
      }}
      services={mockServices}
      globalStatus="ok"
      recentActivity={[]}
      planBreakdown={{ FREE: 0, PRO: 0, BUSINESS: 0 }}
    />
  )
}
