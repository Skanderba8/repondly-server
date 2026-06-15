'use client'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="rp-no-scrollbar flex gap-2 overflow-x-auto">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="inline-flex h-7 shrink-0 items-center rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-subtle)] px-3 text-[12px] font-medium text-[color:var(--color-text-secondary)] transition-[background-color,color,border-color,transform] duration-[var(--ease-fast)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-primary)] active:translate-y-px"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
