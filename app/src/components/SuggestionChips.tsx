'use client'

interface SuggestionChipsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="nx-no-scrollbar flex gap-2 overflow-x-auto">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="nx-btn nx-btn-ghost nx-btn-sm shrink-0"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
