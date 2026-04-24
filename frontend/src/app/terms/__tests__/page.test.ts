import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../page.tsx'), 'utf-8')

describe('Terms Page — content tests', () => {
  it('contains Auto-entrepreneur identification', () => {
    expect(source).toContain('Auto-entrepreneur')
  })

  it('contains contact@repondly.tn', () => {
    expect(source).toContain('contact@repondly.tn')
  })

  it('contains TEIF or El Fatoora billing system reference', () => {
    const hasTEIF = source.includes('TEIF')
    const hasElFatoora = source.includes('El Fatoora')
    expect(hasTEIF || hasElFatoora).toBe(true)
  })

  it('contains article 53 reference', () => {
    expect(source).toContain('article 53')
  })

  it('contains Konnect payment gateway reference', () => {
    expect(source).toContain('Konnect')
  })

  it('contains Starter plan price of 49 DT', () => {
    expect(source).toContain('49 DT')
  })

  it('contains Pro plan price of 99 DT', () => {
    expect(source).toContain('99 DT')
  })

  it('contains Business plan price of 199 DT', () => {
    expect(source).toContain('199 DT')
  })

  it('contains 10 jours ouvrables retractation period', () => {
    const has10JoursOuvrables = source.includes('10 jours ouvrables')
    const has10JoursOuvres = source.includes('10 jours ouvrés')
    expect(has10JoursOuvrables || has10JoursOuvres).toBe(true)
  })

  it('contains Résiliation section', () => {
    expect(source).toContain('Résiliation')
  })

  it('contains Propriété Intellectuelle section', () => {
    expect(source).toContain('Propriété Intellectuelle')
  })

  it('contains Tunis jurisdiction reference', () => {
    const hasTribunaux = source.includes('tribunaux compétents de Tunis')
    const hasTunis = source.includes('Tunis')
    expect(hasTribunaux || hasTunis).toBe(true)
  })
})
