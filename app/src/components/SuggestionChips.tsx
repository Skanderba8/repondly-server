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
            'cursor-pointer rounded border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors duration-100',
            'hover:bg-[var(--surface-2)]',
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
