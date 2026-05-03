// admin-internal/src/lib/chatwoot.ts
const BASE_URL = process.env.CHATWOOT_BASE_URL || 'https://inbox.repondly.com'
const PLATFORM_TOKEN = process.env.CHATWOOT_PLATFORM_TOKEN || ''

// ─── Provisioning (Platform God Mode) ─────────────────────────────────────────

export async function createChatwootAccount(name: string): Promise<{ id: number; name: string }> {
  console.log('>>> PROVISIONING VIA PLATFORM API:', name);

  const res = await fetch(`${BASE_URL}/platform/api/v1/accounts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'api_access_token': PLATFORM_TOKEN 
    },
    body: JSON.stringify({ name }),
    cache: 'no-store',
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('>>> PLATFORM CREATION FAILED:', text)
    throw new Error(`Chatwoot Platform Error: ${text}`)
  }

  const json = JSON.parse(text)
  return json.data || json
}

export async function inviteChatwootUser(accountId: number, name: string, email: string) {
  // To invite a user to a platform account, we hit the platform users endpoint
  const res = await fetch(`${BASE_URL}/platform/api/v1/accounts/${accountId}/account_users`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'api_access_token': PLATFORM_TOKEN 
    },
    body: JSON.stringify({ user: { name, email, role: 'administrator' } }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Platform Invite Failed: ${await res.text()}`)
  return res.json()
}