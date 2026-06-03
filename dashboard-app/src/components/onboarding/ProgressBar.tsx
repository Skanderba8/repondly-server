'use client'

import { cn } from '@/lib/utils'

const STEP_LABELS = [
  'Identité',
  'Offres',
  'Horaires',
  'FAQs',
  'Personnalité',
]

interface ProgressBarProps {
  currentStep: number // 1-based
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const totalSteps = STEP_LABELS.length

  return (
    <div className="border-b border-[var(--surface-border)] bg-[var(--surface-0)] px-5 py-3">
      {/* Mobile: compact pill + dot bar */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Étape {currentStep} sur {totalSteps}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {STEP_LABELS[currentStep - 1]}
        </span>
      </div>

      {/* Mobile dots */}
      <div className="mt-2 flex items-center gap-1.5 sm:hidden">
        {STEP_LABELS.map((_, i) => {
          const stepNum = i + 1
          const isCurrent = stepNum === currentStep
          const isPast = stepNum < currentStep
          return (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                isPast
                  ? 'bg-[var(--brand-primary)]'
                  : isCurrent
                    ? 'bg-[var(--brand-primary)]'
                    : 'bg-[var(--surface-border)]'
              )}
              style={{ opacity: isCurrent ? 1 : isPast ? 0.6 : 1 }}
            />
          )
        })}
      </div>

      {/* Desktop: labeled step indicators */}
      <div className="hidden sm:flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isCurrent = stepNum === currentStep
          const isPast = stepNum < currentStep
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                  isPast || isCurrent
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                )}
              >
                {isPast ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-xs transition-colors',
                  isCurrent
                    ? 'font-semibold text-[var(--text-primary)]'
                    : isPast
                      ? 'text-[var(--text-secondary)]'
                      : 'text-[var(--text-muted)]'
                )}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-px w-4 shrink-0',
                    isPast
                      ? 'bg-[var(--brand-primary)]'
                      : 'bg-[var(--surface-border)]'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
