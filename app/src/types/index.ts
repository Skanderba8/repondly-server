export type ConversationStatus = 'NEW' | 'IN_PROGRESS' | 'CONFIRMED' | 'FOLLOW_UP' | 'RESOLVED'
export type Intent = 'RDV' | 'PRIX' | 'COMMANDE' | 'RÉCLAMATION' | 'AUTRE'
export type Direction = 'INBOUND' | 'OUTBOUND'
export type Plan = 'ESSENTIEL' | 'BUSINESS' | 'BUSINESS_PLUS' | 'GROWTH'
export type OrderStatus = 'NOUVEAU' | 'CONFIRME' | 'EN_PREPARATION' | 'EXPEDIE' | 'LIVRE' | 'ANNULE'
export type PaymentStatus = 'PAS_ENCORE' | 'ACOMPTE' | 'RECU'
export type ProductType = 'PRODUCT' | 'SERVICE'

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
  type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'STICKER' | 'REACTION' | 'SYSTEM' | 'UNSUPPORTED'
  mediaUrl?: string
  mediaType?: string
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
  type: ProductType
  name: string
  description?: string
  price: string
  deliveryFee: string
  stock?: number | null
  fournisseur?: string
  variants: ProductVariant[]
  images: ProductImage[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  name: string
  values: string[]
}

export interface ProductImage {
  id?: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  position: number
}

export interface BusinessImage {
  id?: string
  category: string
  dataUrl: string
  mimeType: string
  sizeBytes: number
  position: number
}

export interface BotConfig {
  botEnabled: boolean
  botName: string
  botMode: string
  botWorkingHoursStart: string
  botWorkingHoursEnd: string
  botKnowledge: string
  botHandoffKeywords: string
  businessName: string
}
