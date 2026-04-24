'use client'

import { useState } from 'react'
import KanbanBoard from '@/components/admin/KanbanBoard'
import OnboardingDPACheckbox from '@/components/OnboardingDPACheckbox'
import type { Business, OnboardingStage, AdminNote } from '@prisma/client'

type BusinessWithRelations = Business & {
  onboarding: OnboardingStage | null
  adminNotes: AdminNote[]
}

interface OnboardingClientProps {
  businesses: BusinessWithRelations[]
}

export default function OnboardingClient({ businesses }: OnboardingClientProps) {
  const [dpaValid, setDpaValid] = useState(false)

  return (
    <>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
        }}
      >
        <OnboardingDPACheckbox onValidChange={setDpaValid} />
      </div>

      <div style={{ position: 'relative' }}>
        <KanbanBoard businesses={businesses} />

        {!dpaValid && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(244, 247, 251, 0.85)',
              backdropFilter: 'blur(2px)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: '#5a6a80',
                fontWeight: 500,
                textAlign: 'center',
                maxWidth: 360,
                margin: 0,
                padding: '0 16px',
              }}
            >
              Veuillez accepter les conditions pour accéder au tableau de bord.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
