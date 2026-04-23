import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateMRR,
  filterBusinesses,
  getNextStage,
  groupNoRuleEvents,
  calculateExpectedRevenue,
  calculateConfirmedRevenue,
  calculatePendingRevenue,
  PLAN_PRICES,
  ONBOARDING_STAGES,
} from '../admin'

describe('Admin Dashboard — Property-Based Tests', () => {

  // Feature: admin-dashboard, Property 1: database round-trip
  it.skip('Property 1: database round-trip (requires running DB)', () => {
    // This property requires a live database connection.
    // Run manually with: npx vitest --run src/lib/__tests__/admin.properties.test.ts
    // Property: for any AdminNote created, reading it back returns identical data
  })

  // Feature: admin-dashboard, Property 2: admin guard universelle
  it.skip('Property 2: admin guard universelle (requires running server)', () => {
    // This property requires a running Next.js server.
    // Property: for any email !== ADMIN_EMAIL, /api/admin/* returns 403
  })

  // Feature: admin-dashboard, Property 3: MRR invariant de somme
  it('Property 3: calculateMRR equals sum of active plan prices', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        plan: fc.constantFrom('STARTER', 'PRO', 'BUSINESS', 'FREE'),
        status: fc.constantFrom('ACTIVE', 'TRIAL', 'SUSPENDED'),
      })),
      (businesses) => {
        const expected = businesses
          .filter(b => b.status === 'ACTIVE')
          .reduce((sum, b) => sum + (PLAN_PRICES[b.plan] ?? 0), 0)
        return calculateMRR(businesses) === expected
      }
    ), { numRuns: 100 })
  })

  // Feature: admin-dashboard, Property 4: filtrage clients sous-ensemble
  it('Property 4: filterBusinesses returns a subset of input', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.string({ minLength: 5, maxLength: 50 }),
        plan: fc.constantFrom('FREE', 'STARTER', 'PRO', 'BUSINESS'),
      })),
      fc.string({ maxLength: 20 }),
      (businesses, query) => {
        const filtered = filterBusinesses(businesses, query)
        return filtered.every(b => businesses.includes(b))
      }
    ), { numRuns: 100 })
  })

  // Feature: admin-dashboard, Property 5: onboarding ordre strict
  it('Property 5: getNextStage always advances to the immediately next stage', () => {
    fc.assert(fc.property(
      fc.constantFrom(...ONBOARDING_STAGES.slice(0, -1)),
      (stage) => {
        const next = getNextStage(stage)
        const currentIdx = ONBOARDING_STAGES.indexOf(stage as typeof ONBOARDING_STAGES[number])
        const nextIdx = ONBOARDING_STAGES.indexOf(next as typeof ONBOARDING_STAGES[number])
        return nextIdx === currentIdx + 1
      }
    ), { numRuns: 100 })
  })

  // Feature: admin-dashboard, Property 5b: getNextStage at final stage returns same stage
  it('Property 5b: getNextStage at PAYING returns PAYING', () => {
    expect(getNextStage('PAYING')).toBe('PAYING')
  })

  // Feature: admin-dashboard, Property 6: conservation du compte sans règle
  it('Property 6: groupNoRuleEvents total count equals no-rule events count', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        ruleMatched: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
        message: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
      })),
      (events) => {
        const noRuleTotal = events.filter(e => e.ruleMatched === null).length
        const grouped = groupNoRuleEvents(events)
        const groupedTotal = grouped.reduce((sum, g) => sum + g.count, 0)
        return groupedTotal === noRuleTotal
      }
    ), { numRuns: 100 })
  })

  // Feature: admin-dashboard, Property 7: invariant de somme facturation
  it('Property 7: confirmed + pending === expected revenue', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        plan: fc.constantFrom('STARTER', 'PRO', 'BUSINESS', 'FREE'),
        status: fc.constantFrom('ACTIVE', 'TRIAL', 'SUSPENDED'),
        paidThisMonth: fc.boolean(),
      })),
      (businesses) => {
        const expected = calculateExpectedRevenue(businesses)
        const confirmed = calculateConfirmedRevenue(businesses)
        const pending = calculatePendingRevenue(businesses)
        return confirmed + pending === expected
      }
    ), { numRuns: 100 })
  })

  // Feature: admin-dashboard, Property 8: sécurité endpoint interne
  it.skip('Property 8: sécurité endpoint interne (requires running server)', () => {
    // This property requires a running Next.js server.
    // Property: for any x-internal-secret !== INTERNAL_SECRET, /api/internal/bot-event returns 401
  })

  // Feature: admin-dashboard, Property 3b: MRR with empty list is 0
  it('Property 3b: calculateMRR with empty list returns 0', () => {
    expect(calculateMRR([])).toBe(0)
  })

  // Feature: admin-dashboard, Property 4b: filterBusinesses with empty query returns all
  it('Property 4b: filterBusinesses with empty query returns all businesses', () => {
    fc.assert(fc.property(
      fc.array(fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.string({ minLength: 5, maxLength: 50 }),
        plan: fc.constantFrom('FREE', 'STARTER', 'PRO', 'BUSINESS'),
      })),
      (businesses) => {
        const filtered = filterBusinesses(businesses, '')
        return filtered.length === businesses.length
      }
    ), { numRuns: 100 })
  })

})
