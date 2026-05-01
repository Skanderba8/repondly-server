"use client"

import { useState, useImperativeHandle, forwardRef } from 'react'
import Link from 'next/link'

interface OnboardingDPACheckboxProps {
  onValidChange?: (valid: boolean) => void
}

export interface OnboardingDPACheckboxRef {
  validate: () => boolean
}

const OnboardingDPACheckbox = forwardRef<OnboardingDPACheckboxRef, OnboardingDPACheckboxProps>(
  function OnboardingDPACheckbox({ onValidChange }, ref) {
    const [checked, setChecked] = useState(false)
    const [showError, setShowError] = useState(false)

    useImperativeHandle(ref, () => ({
      validate() {
        if (!checked) {
          setShowError(true)
          return false
        }
        return true
      },
    }))

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const isChecked = e.target.checked
      setChecked(isChecked)
      if (isChecked) setShowError(false)
      onValidChange?.(isChecked)
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer',
            color: '#0d1b2e',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            style={{
              marginTop: '2px',
              width: '16px',
              height: '16px',
              accentColor: '#1a6bff',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <span>
            {"J'ai lu et j'accepte les "}
            <Link
              href="/terms"
              style={{ color: '#1a6bff', textDecoration: 'underline' }}
            >
              Conditions Générales de Vente
            </Link>
            {", et j'autorise Répondly à agir en tant que Sous-traitant de mes "}
            <Link
              href="/privacy"
              style={{ color: '#1a6bff', textDecoration: 'underline' }}
            >
              données
            </Link>
            {' (DPA).'}
          </span>
        </label>

        {showError && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#e53e3e',
              paddingLeft: '26px',
            }}
          >
            Vous devez accepter les conditions pour continuer.
          </p>
        )}
      </div>
    )
  }
)

export default OnboardingDPACheckbox
