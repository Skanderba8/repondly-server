'use client'

import { cn } from '@/lib/utils'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={cn(
            'inline-flex h-[30px] shrink-0 items-center whitespace-nowrap rounded-[var(--radius-pill)] border border-[color:var(--surface-border)] bg-[color:var(--surface-0)] px-3 text-[12px] font-medium text-[color:var(--text-secondary)] transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--transition-fast)]',
            'hover:border-[color:var(--surface-border-strong)] hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] active:scale-[0.98]',
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
