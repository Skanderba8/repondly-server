import type { ReactNode } from 'react'
import { DashboardShell } from '@/components/DashboardShell'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { requireBusinessSession, type BusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubscriptionState } from '@/lib/subscription'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session: BusinessSession = await requireBusinessSession()
  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      businessType: true,
      tone: true,
      plan: true,
      onboardingCompletedAt: true,
    },
  })

  const shellBusiness = {
    name: business?.name || session.user.name || 'Mon entreprise',
    plan: business?.plan || session.user.plan,
  }
  const subscription = await getSubscriptionState(session.user.id)

  return (
    <DashboardShell
      business={shellBusiness}
      subscription={subscription}
    >
      {!business?.onboardingCompletedAt ? (
        <OnboardingWizard
          initialBusiness={{
            name: shellBusiness.name,
            email: business?.email ?? session.user.email,
            phone: business?.phone ?? '',
            businessType: business?.businessType ?? '',
            tone: business?.tone ?? 'friendly',
            plan: shellBusiness.plan,
          }}
        />
      ) : null}
      {children}
    </DashboardShell>
  )
}
