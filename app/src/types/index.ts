export type ConversationStatus = 'NEW' | 'IN_PROGRESS' | 'CONFIRMED' | 'FOLLOW_UP' | 'RESOLVED'
export type Intent = 'RDV' | 'PRIX' | 'COMMANDE' | 'RÉCLAMATION' | 'AUTRE'
export type Direction = 'INBOUND' | 'OUTBOUND'
export type Plan = 'TRIAL' | 'STARTER' | 'PRO' | 'AGENCY'
export type OrderStatus = 'NOUVEAU' | 'CONFIRME' | 'EN_PREPARATION' | 'EXPEDIE' | 'LIVRE' | 'ANNULE'
export type PaymentStatus = 'PAS_ENCORE' | 'ACOMPTE' | 'RECU'

export interface Contact {
  id: string
  name?: string
  phone?: string
  initials: string
  totalConversations: number
  tags: string[]
  notes?: string
  lastSeen?: string
}

export interface ContactSearchResult {
  id: string
  name?: string
  phone?: string
  initials: string
}

export interface Message {
  id: string
  content: string
  direction: Direction
  timestamp: string
}

export interface Conversation {
  id: string
  contact: Contact
  status: ConversationStatus
  intent: Intent
  lastMessage: string
  time: string
  unread: boolean
  messages?: Message[]
  needsFollowUp?: boolean
  followUpAt?: string
  summary?: string
}

export interface FollowUp {
  id: string
  contact: Contact
  intent: Intent
  followUpAt: string
  overdue: boolean
}

export interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: string
  totalPrice: string
}

export interface Order {
  id: string
  contactId: string
  orderNumber: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  deliveryMethod?: string
  deliveryAddress?: string
  notes?: string
  totalAmount: string
  createdAt: string
  updatedAt: string
  contact: Contact
  items: OrderItem[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: string
  deliveryFee: string
  stock?: number | null
  fournisseur?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BotConfig {
  botEnabled: boolean
  botName: string
  botLanguage: string
  botMode: string
  botWorkingHoursStart: string
  botWorkingHoursEnd: string
  botKnowledge: string
  botHandoffKeywords: string
  businessName: string
}
