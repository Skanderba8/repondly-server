'use server'

// Server Actions for client mutations (Requirements 4.7, 8.1, 8.2)

type BusinessInfo = {
  aiPrompt?: string
  aiTone?: string
  aiFaqs?: Array<{ q: string; a: string }>
  routingRules?: Array<{ condition: string; action: string }>
  welcomeMessage?: string
  fallbackResponse?: string
}

export async function updateCredentials(
  clientId: string,
  data: {
    chatwootAccountId?: number | null
    chatwootApiToken?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {}
    if (data.chatwootAccountId !== undefined) {
      updateData.chatwootAccountId = data.chatwootAccountId
    }
    if (data.chatwootApiToken !== undefined) {
      updateData.chatwootApiToken = data.chatwootApiToken
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
    
    if (!res.ok) {
      return { success: false, error: `Failed to update: ${res.status}` }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateBotConfig(
  clientId: string,
  data: {
    aiPrompt?: string
    aiTone?: string
    aiFaqs?: Array<{ q: string; a: string }>
    routingRules?: Array<{ condition: string; action: string }>
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Fetch current business info and merge with new data
    const res = await fetch(`${baseUrl}/api/admin/clients/${clientId}`)
    if (!res.ok) {
      return { success: false, error: 'Failed to fetch current config' }
    }
    const business = await res.json()
    
    const currentBusinessInfo: BusinessInfo = (business.businessInfo as BusinessInfo) || {}
    const newBusinessInfo: BusinessInfo = {
      ...currentBusinessInfo,
      aiPrompt: data.aiPrompt ?? currentBusinessInfo.aiPrompt,
      aiTone: data.aiTone ?? currentBusinessInfo.aiTone,
      aiFaqs: data.aiFaqs ?? currentBusinessInfo.aiFaqs,
      routingRules: data.routingRules ?? currentBusinessInfo.routingRules,
    }
    
    const updateRes = await fetch(`${baseUrl}/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessInfo: newBusinessInfo }),
    })
    
    if (!updateRes.ok) {
      return { success: false, error: 'Failed to update bot config' }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function toggleAutoRule(
  ruleId: string,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/auto-rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    
    if (!res.ok) {
      return { success: false, error: 'Failed to toggle rule' }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function addAdminNote(
  clientId: string,
  content: string
): Promise<{ success: boolean; note?: unknown; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/clients/${clientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    
    if (!res.ok) {
      return { success: false, error: 'Failed to add note' }
    }
    const note = await res.json()
    return { success: true, note }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}