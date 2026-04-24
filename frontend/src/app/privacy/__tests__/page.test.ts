import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../page.tsx'), 'utf-8')

describe('Privacy Page — content tests', () => {
  it('contains Rôle de Sous-traitant section', () => {
    expect(source).toContain('Rôle de Sous-traitant')
  })

  it('contains exact data controller clause text', () => {
    expect(source).toContain(
      "Dans le cadre des services de messagerie et d'automatisation fournis par Répondly, le Client"
    )
    expect(source).toContain(
      'demeure le responsable du traitement au sens de la loi organique n° 2004-63 du 27 juillet 2004'
    )
  })

  it('contains Bouclier de Protection section', () => {
    expect(source).toContain('Bouclier de Protection')
  })

  it('contains aucune donnée médicale clause', () => {
    expect(source).toContain('aucune donnée médicale')
  })

  it('contains Transfert International section', () => {
    expect(source).toContain('Transfert International')
  })

  it('contains Contabo as hosting provider', () => {
    expect(source).toContain('Contabo')
  })

  it('contains INPDP reference', () => {
    expect(source).toContain('INPDP')
  })

  it('contains contact@repondly.tn', () => {
    expect(source).toContain('contact@repondly.tn')
  })

  it('contains 12 mois data retention period', () => {
    expect(source).toContain('12 mois')
  })

  it('contains WhatsApp Cloud (Meta) API reference', () => {
    expect(source).toContain('WhatsApp Cloud')
  })

  it('contains OpenAI reference', () => {
    expect(source).toContain('OpenAI')
  })

  it('contains right of access (accès)', () => {
    expect(source).toContain('accès')
  })

  it('contains right of rectification (rectification)', () => {
    expect(source).toContain('rectification')
  })

  it('contains right of deletion (suppression)', () => {
    expect(source).toContain('suppression')
  })

  it('contains right of opposition (opposition)', () => {
    expect(source).toContain('opposition')
  })
})
