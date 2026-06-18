// Central AI configuration shared by Groq calls, prompt limits, history cleanup, and rate-limit guards.
// Edit this file when changing default models, token caps, timeout values, or bot usage thresholds.
export const AI_CONFIG = {
  REPLY_MODEL: process.env.GROQ_REPLY_MODEL || 'llama-3.3-70b-versatile',
  ROUTER_MODEL: process.env.GROQ_ROUTER_MODEL || 'llama-3.1-8b-instant',
  MAX_REPLY_TOKENS: Number(process.env.AI_MAX_REPLY_TOKENS || 180),
  MAX_INPUT_CHARS: Number(process.env.AI_MAX_INPUT_CHARS || 700),
  MAX_HISTORY_MESSAGES: Number(process.env.AI_MAX_HISTORY_MESSAGES || 6),
  MAX_SYSTEM_PROMPT_CHARS: Number(process.env.AI_MAX_SYSTEM_PROMPT_CHARS || 9000),
  MAX_BUSINESS_CONTEXT_CHARS: Number(process.env.AI_MAX_BUSINESS_CONTEXT_CHARS || 5000),
  TEMPERATURE: Number(process.env.AI_TEMPERATURE || 0.3),
  TOP_P: Number(process.env.AI_TOP_P || 0.9),
  FREE_DAILY_TOKEN_LIMIT: Number(process.env.AI_FREE_DAILY_TOKEN_LIMIT || 100000),
  REQUEST_TIMEOUT_MS: Number(process.env.AI_REQUEST_TIMEOUT_MS || 12000),
  MAX_HISTORY_MESSAGE_CHARS: 500,
  MAX_REPLY_CHARS: 900,
  MAX_CONVERSATION_REPLIES_PER_HOUR: 20,
  MAX_BUSINESS_REPLIES_PER_DAY: 300,
} as const

export type AiChatRole = 'user' | 'assistant'

export type AiChatMessage = {
  role: AiChatRole
  content: string
}

export function truncateText(value: string, limit: number) {
  const trimmed = value.trim()
  return trimmed.length > limit ? trimmed.slice(0, limit).trim() : trimmed
}
