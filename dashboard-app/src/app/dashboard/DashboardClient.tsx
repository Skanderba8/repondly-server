'use client'

import dynamic from 'next/dynamic'

const DashboardShell = dynamic(() => import('./DashboardShell'), { ssr: false })

export default function DashboardClient() {
  return <DashboardShell />
}
