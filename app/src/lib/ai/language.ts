// Customer language policy for Tunisian business chat.
// The runtime mirrors Tunisian Arabizi and Arabic-script customers instead of forcing French.
export type CustomerLanguage = 'tn_arabizi' | 'tn_arabic' | 'fr' | 'mixed' | 'en'

const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06ff]/
const LATIN_SCRIPT_PATTERN = /[a-z]/i

const TUNISIAN_ARABIZI_PATTERN = /\b(salem|salam|3andi|3andek|3andkom|3la|3lech|5ater|7aja|7keya|9adeh|9addeh|ch7al|chniya|chnowa|chnouwa|fama|mawjoud|mawjouda|nheb|n7eb|ncommandi|tawsil|tou9sel|tnajmou|behi|ey|barcha|souma|soum|mte3|mta3|win|wa9tech|kifeh|kifesh|bellehi|barsha|hedha|hedhi|louled|chkoun)\b/i
const FRENCH_PATTERN = /\b(bonjour|salut|merci|commande|commander|livraison|prix|combien|taille|adresse|telephone|paiement|produit|service|disponible|possible|svp|s il vous plait)\b/i
const ENGLISH_PATTERN = /\b(hello|hi|price|order|delivery|available|how much|payment|phone|address|product|service)\b/i

export function detectCustomerLanguage(text: string): CustomerLanguage {
  const trimmed = text.trim()
  if (!trimmed) return 'fr'

  const hasArabic = ARABIC_SCRIPT_PATTERN.test(trimmed)
  const hasLatin = LATIN_SCRIPT_PATTERN.test(trimmed)

  if (hasArabic && hasLatin) return 'mixed'
  if (hasArabic) return 'tn_arabic'
  if (TUNISIAN_ARABIZI_PATTERN.test(trimmed)) return 'tn_arabizi'
  if (ENGLISH_PATTERN.test(trimmed) && !FRENCH_PATTERN.test(trimmed)) return 'en'
  return 'fr'
}

export function isTunisianLanguage(language: CustomerLanguage) {
  return language === 'tn_arabizi' || language === 'tn_arabic' || language === 'mixed'
}

export function getFallbackReply(language: CustomerLanguage) {
  if (isTunisianLanguage(language)) return 'Behi, taw l equipe tarja3lek b reponse claire fi a9reb wa9t.'
  if (language === 'en') return 'Our team will get back to you shortly.'
  return 'Notre equipe vous repondra dans les plus brefs delais.'
}
