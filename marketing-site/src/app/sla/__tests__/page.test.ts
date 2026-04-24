import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../page.tsx'), 'utf-8')

describe('SLA Page — content tests', () => {
  it('contains 99 % uptime commitment', () => {
    expect(source).toContain('99 %')
  })

  it('contains 24 heures ouvrées support SLA for Starter/Pro', () => {
    expect(source).toContain('24 heures ouvrées')
  })

  it('contains 8 heures ouvrées support SLA for Business', () => {
    expect(source).toContain('8 heures ouvrées')
  })

  it('contains 48 heures maintenance notice', () => {
    expect(source).toContain('48 heures')
  })

  it('contains obligation de moyens clause', () => {
    expect(source).toContain('Répondly fournit ses services selon une obligation de moyens')
  })

  it('contains 3 mois liability cap', () => {
    expect(source).toContain('3 mois')
  })

  it('contains Meta exclusion', () => {
    expect(source).toContain('Meta')
  })

  it('contains Contabo exclusion', () => {
    expect(source).toContain('Contabo')
  })

  it('contains force majeure clause', () => {
    expect(source).toContain('Force majeure')
  })

  it('contains qualité reference for data dependency', () => {
    expect(source).toContain('qualité')
  })

  it('contains données fournies par le client reference', () => {
    expect(source).toContain('données fournies par le client')
  })
})
