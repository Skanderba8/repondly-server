import type { PaymentStatus, OrderStatus } from '@/types'

export const ORDER_STATUS_VALUES: OrderStatus[] = ['NOUVEAU', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE', 'LIVRE', 'ANNULE']
export const PAYMENT_STATUS_VALUES: PaymentStatus[] = ['PAS_ENCORE', 'ACOMPTE', 'RECU']

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NOUVEAU: 'Nouveau',
  CONFIRME: 'Confirme',
  EN_PREPARATION: 'En preparation',
  EXPEDIE: 'Expedie',
  LIVRE: 'Livre',
  ANNULE: 'Annule',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAS_ENCORE: 'Pas encore',
  ACOMPTE: 'Acompte',
  RECU: 'Recu',
}
