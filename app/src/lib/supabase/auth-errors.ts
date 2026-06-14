const FALLBACK_ERROR_MESSAGE = 'Une erreur est survenue. Réessayez dans un instant.'

export function mapSupabaseAuthErrorMessage(message: string | null | undefined, fallback = FALLBACK_ERROR_MESSAGE) {
  const normalizedMessage = message?.toLowerCase() ?? ''

  if (
    normalizedMessage.includes('invalid login credentials') ||
    normalizedMessage.includes('email not confirmed') ||
    normalizedMessage.includes('invalid credentials')
  ) {
    return 'Email ou mot de passe invalide.'
  }

  if (
    normalizedMessage.includes('user already registered') ||
    normalizedMessage.includes('already been registered')
  ) {
    return 'Un compte existe déjà avec cette adresse email.'
  }

  if (normalizedMessage.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }

  if (normalizedMessage.includes('signup is disabled')) {
    return "La création de compte est temporairement indisponible."
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'Trop de tentatives pour le moment. Réessayez dans quelques minutes.'
  }

  return fallback
}
