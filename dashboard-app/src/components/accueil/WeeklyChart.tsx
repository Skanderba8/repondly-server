'use client'

import { useEffect, useState } from 'react'

interface DayData {
  date: string
  count: number
}

interface WeeklyChartProps {
  data: DayData[]
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function WeeklyChart({ data }: WeeklyChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{
      background: 'var(--surface-0)',
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-card)',
      padding: '20px 16px 16px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: 16,
        letterSpacing: '-0.01em',
      }}>
        Tendance hebdomadaire
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
        {data.map((day, i) => {
          const dayIndex = new Date(day.date).getDay()
          const heightPct = (day.count / maxCount) * 100
          return (
            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {/* Count label */}
              {day.count > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 0.3s ease ${i * 0.05}s`,
                }}>
                  {day.count}
                </span>
              )}

              {/* Bar */}
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '100%',
                  maxWidth: 32,
                  height: mounted ? `${Math.max(heightPct, 4)}%` : '0%',
                  background: i >= data.length - 7 ? 'var(--brand-primary)' : 'var(--surface-2)',
                  borderRadius: '6px 6px 2px 2px',
                  transition: `height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s`,
                  minHeight: day.count > 0 ? 4 : 0,
                }} />
              </div>

              {/* Day label */}
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}>
                {DAY_LABELS[dayIndex]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
