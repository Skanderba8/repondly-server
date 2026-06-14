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
      { title: 'EN RETARD', items: overdue },
      { title: "AUJOURD'HUI", items: todayItems },
      { title: 'CETTE SEMAINE', items: weekItems },
    ]
  }, [completedIds])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-1)]">
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Relances</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sections.map((section) => {
          if (section.items.length === 0) {
            return null
          }

          return (
            <section key={section.title}>
              <div className="sticky top-0 z-10 bg-[var(--surface-1)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                {section.title}
              </div>
              <div className="divide-y divide-[var(--border)] border-y border-[var(--border)] bg-white">
                {section.items.map((followUp) => {
                  const conversation =
                    mockConversations.find((item) => item.contact.id === followUp.contact.id) ?? mockConversations[0]

                  return (
                    <div key={followUp.id} className="flex items-center gap-2 pr-3">
                      <div className="min-w-0 flex-1">
                        <ConversationCard
                          conversation={conversation}
                          isSelected={false}
                          onClick={() => undefined}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs text-[var(--text-secondary)]"
                        onClick={() => setCompletedIds((current) => [...current, followUp.id])}
                      >
                        Marquer fait
                      </Button>
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
