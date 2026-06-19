// Focused tests for pure AI helpers: language policy, fallback text, JSON parsing, prompt caps, history cleanup, templates, and action validation.
// Connected to the files in this folder. Edit this file when bot behavior changes need regression coverage.
import { Prisma } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import { validateOrderAction } from '@/lib/ai/actions'
import { cleanHistory, shouldHandover } from '@/lib/ai/groq'
import { detectCustomerLanguage, getFallbackReply } from '@/lib/ai/language'
import { parseAiResponse, truncateReply } from '@/lib/ai/parser'
import { buildSystemPrompt, parseKnowledgeConfig } from '@/lib/ai/promptBuilder'
import {
  extractOrderSlots,
  getNextMissingSlot,
  hasRepeatedComplaint,
  isExplicitOrderConfirmation,
  mergeOrderSlots,
  normalizeOrderSlots,
  withNextMissingSlot,
  withSummaryShown,
} from '@/lib/ai/slots'
import { getTemplate } from '@/lib/ai/templates'

describe('AI language helpers', () => {
  it('uses French for Arabizi input', () => {
    expect(detectCustomerLanguage('chnowa les prix?')).toBe('FR')
  })

  it('uses Arabic only for pure Arabic script', () => {
    expect(detectCustomerLanguage('كم سعر التوصيل؟')).toBe('AR')
  })

  it('uses French for mixed Arabic and Latin input', () => {
    expect(detectCustomerLanguage('كم prix livraison?')).toBe('FR')
  })

  it('uses French fallback except for Arabic output policy', () => {
    expect(getFallbackReply('FR')).toContain('Notre equipe')
    expect(getFallbackReply('AR')).toContain('فريقنا')
  })
})

describe('AI parser', () => {
  it('parses direct JSON payloads', () => {
    const parsed = parseAiResponse('{"reply":"La livraison est a 7 DT.","action":null,"extraction":{}}', '9adeh livraison?')

    expect(parsed.reply).toBe('La livraison est a 7 DT.')
    expect(parsed.action).toBeNull()
  })

  it('extracts the first JSON object from noisy output', () => {
    const parsed = parseAiResponse('text {"reply":"Je transmets a l equipe.","action":{"type":"human_handover"},"extraction":{"reason":"human"}} tail', 'humain svp')

    expect(parsed.reply).toBe('Je transmets a l equipe.')
    expect(parsed.action?.type).toBe('human_handover')
    expect(parsed.extraction.reason).toBe('human')
  })

  it('uses raw text as reply when JSON parsing fails', () => {
    const parsed = parseAiResponse('Raw assistant text', 'hello')

    expect(parsed.reply).toBe('Raw assistant text')
    expect(parsed.action).toBeNull()
  })

  it('truncates long replies at a sentence boundary', () => {
    const reply = truncateReply(`${'A'.repeat(200)}. ${'B'.repeat(1000)}`, 300)

    expect(reply.endsWith('.')).toBe(true)
    expect(reply.length).toBeLessThanOrEqual(300)
  })
})

describe('AI prompt and history helpers', () => {
  it('caps prompt output and uses French-first language rules', () => {
    const prompt = buildSystemPrompt(
      {
        name: 'Repondly Shop',
        businessType: 'ecom',
        tone: 'friendly',
        botName: 'Nour',
        botKnowledge: JSON.stringify({ version: 2, customInstructions: 'x'.repeat(12000) }),
        botHandoffKeywords: 'humain',
      },
      Array.from({ length: 20 }, (_, index) => ({
        type: 'PRODUCT',
        name: `Produit ${index}`,
        description: 'description '.repeat(80),
        price: new Prisma.Decimal(10),
        deliveryFee: new Prisma.Decimal(7),
        stock: 3,
        fournisseur: null,
        variants: [],
        images: [],
      })),
    )

    expect(prompt.length).toBeLessThanOrEqual(9000)
    expect(prompt).toContain('JSON output contract')
    expect(prompt).toContain('francais clair')
    expect(prompt).not.toContain('Tunisian Derja')
    expect(prompt).not.toContain('Arabizi naturel autorise')
  })

  it('cleans history to the configured shape', () => {
    const history = cleanHistory([
      { role: 'user', content: 'old' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'x'.repeat(700) },
    ])

    expect(history).toHaveLength(3)
    expect(history[2].content.length).toBe(500)
  })
})

describe('AI templates', () => {
  const business = {
    name: 'Repondly Shop',
    businessType: 'ecom',
    tone: 'professionnel',
    botName: 'Nour',
    botKnowledge: null,
    botHandoffKeywords: 'humain',
  }

  const products = [{
    type: 'PRODUCT',
    name: 'Pack A',
    description: 'Pack complet',
    price: new Prisma.Decimal(25),
    deliveryFee: new Prisma.Decimal(7),
    stock: 4,
    fournisseur: null,
    variants: [],
    images: [],
  }]

  it('returns structured French price templates', () => {
    const reply = getTemplate(
      'price_inquiry',
      { productName: 'Pack A' },
      { business, products, knowledge: parseKnowledgeConfig(null), outputLanguage: 'FR' },
    )

    expect(reply).toContain('Pack A')
    expect(reply).toContain('25.00 DT')
  })

  it('returns structured French delivery and order templates', () => {
    const knowledge = parseKnowledgeConfig(JSON.stringify({
      version: 2,
      delivery: {
        enabled: true,
        zones: [{ location: 'Grand Tunis', enabled: true, price: '7', condition: '' }],
      },
    }))
    const delivery = getTemplate('delivery_inquiry', {}, { business, products, knowledge, outputLanguage: 'FR' })
    const order = getTemplate('order_start', { productName: 'Pack A' }, { business, products, knowledge, outputLanguage: 'FR' })

    expect(delivery).toContain('Informations livraison')
    expect(order).toContain('nom complet')
  })

  it('returns Arabic templates for Arabic output policy', () => {
    const reply = getTemplate(
      'price_inquiry',
      { productName: 'Pack A' },
      { business, products, knowledge: parseKnowledgeConfig(null), outputLanguage: 'AR' },
    )

    expect(reply).toContain('السعر')
    expect(reply).toContain('Pack A')
  })

  it('filters product inquiries using Tunisian color synonyms', () => {
    const reply = getTemplate(
      'product_inquiry',
      { productName: 'robe zarka' },
      {
        business,
        products: [
          { ...products[0], name: 'robe bleu ciel' },
          { ...products[0], name: 'robe gold' },
          { ...products[0], name: 'robe bleu' },
        ],
        knowledge: parseKnowledgeConfig(null),
        outputLanguage: 'FR',
      },
    )

    expect(reply).toContain('robe bleu ciel')
    expect(reply).toContain('robe bleu')
    expect(reply).not.toContain('robe gold')
  })
})

describe('AI order slots', () => {
  const products = [{
    type: 'PRODUCT',
    name: 'Robe bleue',
    description: 'Robe ete',
    price: new Prisma.Decimal(55),
    deliveryFee: new Prisma.Decimal(7),
    stock: 4,
    fournisseur: null,
    variants: [{ name: 'Taille', values: ['S', 'M', 'L'] }],
    images: [],
  }]

  it('persists product and phone collected in separate messages', () => {
    const first = mergeOrderSlots(normalizeOrderSlots(null), extractOrderSlots('je veux la robe bleue', products, normalizeOrderSlots(null)))
    const second = mergeOrderSlots(first, extractOrderSlots('55123456', products, first))

    expect(second.productName).toBe('Robe bleue')
    expect(second.phone).toBe('55123456')
  })

  it('asks for name after product, variant, and phone are known', () => {
    const slots = normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
      phone: '55123456',
    })

    expect(getNextMissingSlot(slots, products[0])).toBe('customerName')
  })

  it('asks variant before confirmation when the product has variants', () => {
    const slots = normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      customerName: 'Sarra',
      phone: '55123456',
    })

    expect(getNextMissingSlot(slots, products[0])).toBe('variant')
  })

  it('does not accept short confirmation before the summary was shown', () => {
    const slots = normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
      customerName: 'Sarra',
      phone: '55123456',
    })

    expect(isExplicitOrderConfirmation('oui', slots)).toBe(false)
  })

  it('accepts explicit confirmation after summary was shown', () => {
    const slots = withSummaryShown(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
      customerName: 'Sarra',
      phone: '55123456',
    }))

    expect(isExplicitOrderConfirmation('oui', slots)).toBe(true)
  })

  it('extracts a name only when the bot asked for it', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({ phase: 'collecting', productName: 'Robe bleue' }), 'customerName')
    const extracted = extractOrderSlots('Sarra Ben Ali', products, slots)

    expect(extracted.customerName).toBe('Sarra Ben Ali')
  })
})

describe('AI handover routing', () => {
  it('does not hand over negotiation immediately', () => {
    expect(shouldHandover('negotiation', [], 'c est cher')).toBe(false)
  })

  it('hands over repeated complaints', () => {
    const history = [{ role: 'user' as const, content: 'j ai un probleme avec ma commande' }]

    expect(hasRepeatedComplaint(history, 'toujours pas resolu ce probleme')).toBe(true)
    expect(shouldHandover('complaint', history, 'toujours pas resolu ce probleme')).toBe(true)
  })
})

describe('AI action validation', () => {
  it('blocks incomplete order actions', () => {
    const missing = validateOrderAction({
      type: 'order_complete',
      customerName: 'Sarra',
      items: [{ productName: 'Pack A', quantity: 1 }],
    })

    expect(missing).toContain('telephone')
  })
})
