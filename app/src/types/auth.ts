import type { Plan } from '@prisma/client'

export type AuthenticatedBusiness = {
  id: string
  authUserId: string
  email: string
  name: string
  slug: string
  plan: Plan
}
