'use client'

const STEP_LABELS = [
  'Identité',
  'Services',
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
    <div
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--surface-border)',
        background: 'var(--surface-0)',
      }}
    >
      {/* Mobile: compact pill */}
      <div className="flex items-center justify-between sm:hidden">
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Étape {currentStep} sur {totalSteps}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {STEP_LABELS[currentStep - 1]}
        </span>
      </div>

      {/* Mobile dots */}
      <div className="mt-2 flex items-center gap-2 sm:hidden">
        {STEP_LABELS.map((_, i) => {
          const stepNum = i + 1
          const isCurrent = stepNum === currentStep
          const isPast = stepNum < currentStep
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: isPast
                  ? 'var(--brand-primary)'
                  : isCurrent
                    ? 'var(--brand-primary)'
                    : 'var(--surface-border)',
                opacity: isCurrent ? 1 : isPast ? 0.6 : 1,
                transition: 'background 0.2s',
              }}
            />
          )
        })}
      </div>

      {/* Desktop: labeled step indicators */}
      <div className="hidden sm:flex items-center gap-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isCurrent = stepNum === currentStep
          const isPast = stepNum < currentStep
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isPast
                    ? 'var(--brand-primary)'
                    : isCurrent
                      ? 'var(--brand-primary)'
                      : 'var(--surface-2)',
                  color: isPast || isCurrent ? '#fff' : 'var(--text-muted)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {isPast ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent
                    ? 'var(--text-primary)'
                    : isPast
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div
                  style={{
                    width: 16,
                    height: 1,
                    background: isPast
                      ? 'var(--brand-primary)'
                      : 'var(--surface-border)',
                    marginLeft: 4,
                    marginRight: 4,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
