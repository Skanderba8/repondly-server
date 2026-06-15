import type { Plan } from '@/types'

export type AuthenticatedBusiness = {
  id: string
  authUserId: string
  email: string
  name: string
  slug: string
  plan: Plan
}
