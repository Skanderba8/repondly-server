// Focused tests for pure AI helpers. Keep these aligned with the Tunisian bot architecture.
import { Prisma } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import { validateOrderAction } from '@/lib/ai/actions'
import { cleanHistory, shouldHandover } from '@/lib/ai/groq'
import { detectCustomerLanguage, getFallbackReply } from '@/lib/ai/language'
import { parseAiResponse, truncateReply } from '@/lib/ai/parser'
import { buildSystemPrompt, parseKnowledgeConfig } from '@/lib/ai/promptBuilder'
import {
  extractOrderSlots,
  getMissingSlots,
  getNextMissingSlot,
  hasRepeatedComplaint,
  isExplicitOrderConfirmation,
  mergeOrderSlots,
  normalizeOrderSlots,
  withNextMissingSlot,
  withSummaryShown,
} from '@/lib/ai/slots'
import { getTemplate } from '@/lib/ai/templates'

const product = {
  type: 'PRODUCT',
  name: 'Pack A',
  description: 'Pack complet',
  price: new Prisma.Decimal(25),
  deliveryFee: new Prisma.Decimal(7),
  stock: 4,
  fournisseur: null,
  variants: [],
  images: [],
}

const business = {
  name: 'Repondly Shop',
  businessType: 'ecom',
  tone: 'professionnel',
  botName: 'Nour',
  botKnowledge: null,
  botHandoffKeywords: 'humain',
}

describe('AI language helpers', () => {
  it('detects Tunisian Arabizi input', () => {
    expect(detectCustomerLanguage('chnowa les prix?')).toBe('tn_arabizi')
    expect(detectCustomerLanguage('salem prix robe bleu ciel')).toBe('tn_arabizi')
  })

  it('detects Arabic-script input', () => {
    expect(detectCustomerLanguage('كم سعر التوصيل؟')).toBe('tn_arabic')
  })

  it('detects mixed Arabic and Latin input', () => {
    expect(detectCustomerLanguage('كم prix livraison?')).toBe('mixed')
  })

  it('uses localized fallbacks', () => {
    expect(getFallbackReply('fr')).toContain('Notre equipe')
    expect(getFallbackReply('tn_arabizi')).toContain('taw')
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

  it('truncates long replies at a sentence boundary', () => {
    const reply = truncateReply(`${'A'.repeat(200)}. ${'B'.repeat(1000)}`, 300)

    expect(reply.endsWith('.')).toBe(true)
    expect(reply.length).toBeLessThanOrEqual(300)
  })
})

describe('AI prompt and history helpers', () => {
  it('caps prompt output and uses Tunisian-aware language rules', () => {
    const prompt = buildSystemPrompt(
      {
        ...business,
        botKnowledge: JSON.stringify({ version: 2, customInstructions: 'x'.repeat(12000) }),
      },
      Array.from({ length: 20 }, (_, index) => ({
        ...product,
        name: `Produit ${index}`,
        description: 'description '.repeat(80),
      })),
    )

    expect(prompt.length).toBeLessThanOrEqual(9000)
    expect(prompt).toContain('JSON output contract')
    expect(prompt).toContain('Tunisien Arabizi')
    expect(prompt).toContain('miroir du style client')
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
  it('returns structured French price templates', () => {
    const reply = getTemplate(
      'price_inquiry',
      { productName: 'Pack A' },
      { business, products: [product], knowledge: parseKnowledgeConfig(null), outputLanguage: 'fr' },
    )

    expect(reply).toContain('Pack A')
    expect(reply).toContain('25.00 DT')
  })

  it('returns Tunisian delivery and order templates', () => {
    const knowledge = parseKnowledgeConfig(JSON.stringify({
      version: 2,
      delivery: {
        enabled: true,
        zones: [{ location: 'Grand Tunis', enabled: true, price: '7', condition: '' }],
      },
    }))
    const delivery = getTemplate('delivery_inquiry', {}, { business, products: [product], knowledge, outputLanguage: 'tn_arabizi' })
    const order = getTemplate('order_start', { productName: 'Pack A' }, { business, products: [product], knowledge, outputLanguage: 'tn_arabizi' })

    expect(delivery).toContain('Livraison')
    expect(order).toContain('esm el client')
  })

  it('filters product inquiries using Tunisian color synonyms', () => {
    const reply = getTemplate(
      'product_inquiry',
      { productName: 'robe zarka' },
      {
        business,
        products: [
          { ...product, name: 'robe bleu ciel' },
          { ...product, name: 'robe gold' },
          { ...product, name: 'robe bleu' },
        ],
        knowledge: parseKnowledgeConfig(null),
        outputLanguage: 'fr',
      },
    )

    expect(reply).toContain('robe bleu ciel')
    expect(reply).toContain('robe bleu')
    expect(reply).not.toContain('robe gold')
  })
})

describe('AI order slots', () => {
  const products = [{
    ...product,
    name: 'Robe bleue',
    description: 'Robe ete',
    price: new Prisma.Decimal(55),
    variants: [{ name: 'Taille', values: ['S', 'M', 'L'] }],
  }]

  it('persists product and phone collected in separate messages', () => {
    const first = mergeOrderSlots(normalizeOrderSlots(null), extractOrderSlots('je veux la robe bleue', products, normalizeOrderSlots(null)))
    const second = mergeOrderSlots(first, extractOrderSlots('55123456', products, first))

    expect(second.productName).toBe('Robe bleue')
    expect(second.phone).toBe('55123456')
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

  it('captures an answered variant and moves to the next missing slot', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
    }), 'variant')
    const merged = mergeOrderSlots(slots, extractOrderSlots('taille M', products, slots))

    expect(merged.variantNotes).toBe('Taille: M')
    expect(getNextMissingSlot(merged, products[0])).toBe('customerName')
  })

  it('accepts a short phone-like reply instead of asking again', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
      customerName: 'Skander Ben Abdallah',
    }), 'phone')
    const merged = mergeOrderSlots(slots, extractOrderSlots('5877770', products, slots))

    expect(merged.phone).toBe('5877770')
    expect(getNextMissingSlot(merged, products[0])).toBeNull()
  })

  it('captures name and phone when the customer sends both together', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
    }), 'customerName')
    const merged = mergeOrderSlots(slots, extractOrderSlots('Skander Ben Abdallah 5877770', products, slots))

    expect(merged.customerName).toBe('Skander Ben Abdallah')
    expect(merged.phone).toBe('5877770')
    expect(getNextMissingSlot(merged, products[0])).toBeNull()
  })

  it('captures phone before name when the bot asked for identity details', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
    }), 'customerName')
    const merged = mergeOrderSlots(slots, extractOrderSlots('58777770 Skander Ben Abdallah', products, slots))

    expect(merged.phone).toBe('58777770')
    expect(merged.customerName).toBe('Skander Ben Abdallah')
  })

  it('does not include the product name in the customer name', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({
      phase: 'collecting',
    }), 'customerName')
    const merged = mergeOrderSlots(slots, extractOrderSlots('robe bleue Skander Ben Abdallah 5877770', products, slots))

    expect(merged.productName).toBe('Robe bleue')
    expect(merged.customerName).toBe('Skander Ben Abdallah')
    expect(merged.phone).toBe('5877770')
  })

  it('honors configured required delivery address and disabled variant', () => {
    const slots = normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      customerName: 'Skander Ben Abdallah',
      phone: '5877770',
    })

    expect(getMissingSlots(slots, products[0], ['productOrService', 'name', 'phone', 'deliveryAddress'])).toEqual(['deliveryAddress'])
  })

  it('captures product, name, phone, and address from one sales reply', () => {
    const slots = withNextMissingSlot(normalizeOrderSlots({ phase: 'collecting' }), 'product')
    const merged = mergeOrderSlots(slots, extractOrderSlots('robe bleue Skander Ben Abdallah 5877770 Lac 2', products, slots))

    expect(merged.productName).toBe('Robe bleue')
    expect(merged.customerName).toBe('Skander Ben Abdallah')
    expect(merged.phone).toBe('5877770')
    expect(merged.deliveryAddress).toBe('Lac 2')
    expect(getMissingSlots(merged, products[0], ['productOrService', 'name', 'phone', 'deliveryAddress'])).toEqual([])
  })

  it('accepts explicit Tunisian confirmation after summary was shown', () => {
    const slots = withSummaryShown(normalizeOrderSlots({
      phase: 'collecting',
      productName: 'Robe bleue',
      variantNotes: 'Taille: M',
      customerName: 'Sarra',
      phone: '55123456',
    }))

    expect(isExplicitOrderConfirmation('ey', slots)).toBe(true)
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
    const history = [{ role: 'user' as const, content: '3andi mochkla fi commande' }]

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
