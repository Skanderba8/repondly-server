import { execFile } from 'child_process'
import { prisma } from '@/lib/prisma'

const CHATWOOT_CONTAINER = process.env.CHATWOOT_CONTAINER ?? 'chatwoot-rails-1'
const CHATWOOT_INTERNAL_URL = process.env.CHATWOOT_INTERNAL_URL ?? 'http://localhost:3000'
const CHATWOOT_PUBLIC_URL = process.env.CHATWOOT_PUBLIC_URL ?? 'https://inbox.repondly.com'

async function railsRunner(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      'docker',
      ['exec', '-i', CHATWOOT_CONTAINER, 'bundle', 'exec', 'rails', 'runner', '-'],
      { timeout: 30_000 },
      (error, stdout, stderr) => {
        if (error && !stdout) return reject(new Error(stderr || error.message))
        resolve(stdout.trim())
      }
    )
    child.stdin!.write(script)
    child.stdin!.end()
  })
}

export async function provisionChatwootAccount(businessId: string): Promise<{
  accountId: number
  apiToken: string
  password: string
  email: string
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      email: true,
      chatwootAccountId: true,
      chatwootApiToken: true,
      chatwootPassword: true,
    },
  })
  if (!business) throw new Error(`Business ${businessId} not found`)

  if (business.chatwootAccountId && business.chatwootApiToken && business.chatwootPassword) {
    return {
      accountId: business.chatwootAccountId,
      apiToken: business.chatwootApiToken,
      password: business.chatwootPassword,
      email: business.email,
    }
  }

  // Generate a stable password: Rp! + first 8 chars of businessId + Xx1
  // Deterministic so we can re-derive it if needed, meets Chatwoot policy
  const password = 'RpX' + businessId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + '@1'
  const name = business.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const email = business.email

  const ruby = `
pwd = "${password}"
acc = Account.create!(name: "${name}")
user = User.find_by(email: "${email}") || User.create!(
  name: "${name}",
  email: "${email}",
  password: pwd,
  password_confirmation: pwd,
  confirmed_at: Time.now
)
if user.persisted? && !user.valid_password?(pwd)
  user.update!(password: pwd, password_confirmation: pwd)
end
AccountUser.find_or_create_by!(account_id: acc.id, user_id: user.id) do |au|
  au.role = :administrator
end
puts "#{acc.id}|||#{user.access_token.token}"
`

  const output = await railsRunner(ruby)
  const lastLine = output.split('\n').filter(l => l.includes('|||')).pop() ?? ''
  const parts = lastLine.split('|||')
  if (parts.length !== 2) throw new Error(`Unexpected output: ${output}`)

  const accountId = parseInt(parts[0], 10)
  const apiToken = parts[1].trim()

  if (isNaN(accountId) || !apiToken) {
    throw new Error(`Invalid output: ${output}`)
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { chatwootAccountId: accountId, chatwootApiToken: apiToken, chatwootPassword: password },
  })

  return { accountId, apiToken, password, email }
}

export async function getChatwootSessionCookies(email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${CHATWOOT_INTERNAL_URL}/auth/sign_in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      redirect: 'manual',
    })
    const setCookie = res.headers.get('set-cookie')
    return setCookie
  } catch {
    return null
  }
}

export function getChatwootDashboardUrl(accountId: number): string {
  return `${CHATWOOT_PUBLIC_URL}/app/accounts/${accountId}/dashboard`
}