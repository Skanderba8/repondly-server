'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConversationCard } from '@/components/ConversationCard'
import { mockConversations, mockFollowUps } from '@/lib/mock'

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function isThisWeek(date: Date, today: Date) {
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
  return date >= today && date <= endOfWeek
}

export default function FollowupsPage() {
  const [completedIds, setCompletedIds] = useState<string[]>([])

  const sections = useMemo(() => {
    const today = new Date()
    const visibleFollowUps = mockFollowUps.filter((followUp) => !completedIds.includes(followUp.id))

    const overdue = visibleFollowUps.filter((followUp) => followUp.overdue)
    const todayItems = visibleFollowUps.filter((followUp) => {
      const date = new Date(followUp.followUpAt)
      return !followUp.overdue && getDateKey(date) === getDateKey(today)
    })
    const weekItems = visibleFollowUps.filter((followUp) => {
      const date = new Date(followUp.followUpAt)
      return !followUp.overdue && getDateKey(date) !== getDateKey(today) && isThisWeek(date, today)
    })

    return [
      { title: 'En retard', items: overdue },
      { title: 'Aujourdhui', items: todayItems },
      { title: 'Cette semaine', items: weekItems },
    ]
  }, [completedIds])

  return (
    <div className="rp-page !gap-4">
      <section className="rp-page-header">
        <div>
          <p className="rp-section-label">Suivi client</p>
          <h1 className="rp-page-title">Relances</h1>
        </div>
      </section>

      <div className="space-y-4">
        {sections.map((section) => {
          if (section.items.length === 0) {
            return null
          }

          return (
            <section key={section.title} className="rp-panel overflow-hidden p-0">
              <div className="border-b border-[color:var(--surface-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                {section.title}
              </div>
              <div className="space-y-1 p-2">
                {section.items.map((followUp) => {
                  const conversation =
                    mockConversations.find((item) => item.contact.id === followUp.contact.id) ??
                    mockConversations[0]

                  return (
                    <div key={followUp.id} className="flex flex-col gap-2 rounded-[4px] md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <ConversationCard
                          conversation={conversation}
                          isSelected={false}
                          onClick={() => undefined}
                        />
                      </div>
                      <div className="px-3 pb-3 md:px-0 md:pb-0 md:pr-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full md:w-auto"
                          onClick={() => setCompletedIds((current) => [...current, followUp.id])}
                        >
                          Marquer fait
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
