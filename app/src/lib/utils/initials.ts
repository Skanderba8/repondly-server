export function buildInitials(name?: string, phone?: string) {
  const source = name?.trim() || phone?.trim() || 'Contact'
  const parts = source.split(/\s+/).filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return initials || 'CT'
}
