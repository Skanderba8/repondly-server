'use client'

import { cn } from '@/lib/utils'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={cn(
            'inline-flex h-8 items-center rounded-[4px] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-3 text-xs font-medium text-[color:var(--text-secondary)] shadow-[var(--shadow-card)] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'hover:-translate-y-[1px] hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text-primary)]',
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
