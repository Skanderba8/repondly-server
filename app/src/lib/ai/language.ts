// Lightweight output-language policy used for fallbacks and template selection.
// The bot replies in French by default, and in Arabic only for pure Arabic-script input.
export type CustomerLanguage = 'FR' | 'AR'

const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06ff]/
const LATIN_SCRIPT_PATTERN = /[a-z]/i

export function detectCustomerLanguage(text: string): CustomerLanguage {
  const trimmed = text.trim()
  if (!trimmed) return 'FR'

  const hasArabic = ARABIC_SCRIPT_PATTERN.test(trimmed)
  const hasLatin = LATIN_SCRIPT_PATTERN.test(trimmed)
  const hasLettersOrNumbers = /[\p{L}\p{N}]/u.test(trimmed)

  if (hasArabic && !hasLatin && hasLettersOrNumbers) return 'AR'
  return 'FR'
}

export function getFallbackReply(language: CustomerLanguage) {
  if (language === 'AR') return 'سيتواصل معك فريقنا في أقرب وقت لمساعدتك.'
  return 'Notre equipe vous repondra dans les plus brefs delais.'
}
