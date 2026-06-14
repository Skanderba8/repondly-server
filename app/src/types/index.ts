export type ConversationStatus = 'NEW' | 'IN_PROGRESS' | 'CONFIRMED' | 'FOLLOW_UP' | 'RESOLVED'
export type Intent = 'RDV' | 'PRIX' | 'COMMANDE' | 'RÉCLAMATION' | 'AUTRE'
export type Direction = 'INBOUND' | 'OUTBOUND'
export type Plan = 'TRIAL' | 'STARTER' | 'PRO' | 'AGENCY'

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
