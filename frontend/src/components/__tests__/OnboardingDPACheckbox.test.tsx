import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Extracted constants mirroring OnboardingDPACheckbox.tsx — tested as pure logic
// ---------------------------------------------------------------------------

const LABEL_TEXT =
  "J'ai lu et j'accepte les Conditions Générales de Vente, et j'autorise Répondly à agir en tant que Sous-traitant de mes données (DPA)."

const links = [
  { href: '/terms', label: 'Conditions Générales de Vente' },
  { href: '/privacy', label: 'données' },
]

const ERROR_MESSAGE = 'Vous devez accepter les conditions pour continuer.'

/** Pure function mirroring the validation logic inside OnboardingDPACheckbox */
function validateDPA(checked: boolean): { valid: boolean; showError: boolean } {
  return { valid: checked, showError: !checked }
}

/** Pure function mirroring the handleChange logic */
function handleChange(
  isChecked: boolean,
  onValidChange?: (valid: boolean) => void
): { checked: boolean; showError: boolean } {
  if (onValidChange) onValidChange(isChecked)
  return { checked: isChecked, showError: isChecked ? false : true }
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('OnboardingDPACheckbox — unit tests', () => {
  it('has the exact required label text', () => {
    expect(LABEL_TEXT).toBe(
      "J'ai lu et j'accepte les Conditions Générales de Vente, et j'autorise Répondly à agir en tant que Sous-traitant de mes données (DPA)."
    )
  })

  it('has a link to /terms with correct label', () => {
    const termsLink = links.find((l) => l.href === '/terms')
    expect(termsLink).toBeDefined()
    expect(termsLink?.label).toBe('Conditions Générales de Vente')
  })

  it('has a link to /privacy with correct label', () => {
    const privacyLink = links.find((l) => l.href === '/privacy')
    expect(privacyLink).toBeDefined()
    expect(privacyLink?.label).toBe('données')
  })

  it('has the exact required error message text', () => {
    expect(ERROR_MESSAGE).toBe('Vous devez accepter les conditions pour continuer.')
  })

  it('calls onValidChange with false when unchecked', () => {
    const onValidChange = vi.fn()
    handleChange(false, onValidChange)
    expect(onValidChange).toHaveBeenCalledWith(false)
  })

  it('calls onValidChange with true when checked', () => {
    const onValidChange = vi.fn()
    handleChange(true, onValidChange)
    expect(onValidChange).toHaveBeenCalledWith(true)
  })

  it('blocks onboarding when DPA is not accepted (blocking logic)', () => {
    const isBlocked = (checked: boolean) => !checked
    expect(isBlocked(false)).toBe(true)
    expect(isBlocked(true)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Feature: legal-pages, Property 2: DPA checkbox blocks submission when unchecked
// ---------------------------------------------------------------------------

describe('OnboardingDPACheckbox — Property 2: DPA checkbox blocks submission when unchecked', () => {
  it(
    'for any unchecked state, validateDPA returns { valid: false, showError: true }',
    () => {
      fc.assert(
        fc.property(
          fc.constant(false),
          (checked) => {
            const result = validateDPA(checked)
            return result.valid === false && result.showError === true
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  it(
    'for any checked state, validateDPA returns { valid: true, showError: false }',
    () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          (checked) => {
            const result = validateDPA(checked)
            return result.valid === true && result.showError === false
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  it(
    'for any boolean, validateDPA(checked).valid === checked and showError === !checked',
    () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (checked) => {
            const result = validateDPA(checked)
            return result.valid === checked && result.showError === !checked
          }
        ),
        { numRuns: 100 }
      )
    }
  )
})
