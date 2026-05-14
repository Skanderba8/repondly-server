import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL || 'http://127.0.0.1:3000'
const CHATWOOT_ADMIN_TOKEN = process.env.CHATWOOT_ADMIN_TOKEN || process.env.CHATWOOT_API_TOKEN || ''
const CHATWOOT_MASTER_ACCOUNT_ID = parseInt(process.env.CHATWOOT_ACCOUNT_ID || '6')

// Chatwoot database pool for direct account creation
const chatwootPool = new Pool({
  connectionString: process.env.DATABASE_URL_CHATWOOT,
})

async function createChatwootAccount(businessName: string, businessEmail: string): Promise<{ accountId: number; userEmail: string; userPassword: string; apiToken: string } | null> {
  const client = await chatwootPool.connect()
  
  try {
    await client.query('BEGIN')

    // 1. Create account
    const accountResult = await client.query(
      'INSERT INTO accounts (name, created_at, updated_at, locale, feature_flags, status, internal_attributes, settings) VALUES ($1, NOW(), NOW(), 0, 0, 0, \'{}\', \'{}\') RETURNING id',
      [businessName]
    )
    const accountId = accountResult.rows[0].id

    // 2. Generate random password
    const tempPassword = crypto.randomBytes(16).toString('hex')
    const hashedPassword = await bcrypt.hash(tempPassword, 11)

    // 3. Create user
    const userResult = await client.query(
      `INSERT INTO users (provider, uid, encrypted_password, name, display_name, email, created_at, updated_at, pubsub_token, confirmation_sent_at, confirmed_at) 
       VALUES ('email', $1, $2, $3, $3, $4, NOW(), NOW(), $5, NOW(), NOW()) RETURNING id`,
      [businessEmail, hashedPassword, businessName.split(' ')[0], businessEmail, crypto.randomBytes(32).toString('hex')]
    )
    const userId = userResult.rows[0].id

    // 4. Link user to account with admin role
    await client.query(
      'INSERT INTO account_users (account_id, user_id, role, inviter_id, created_at, updated_at, active_at, availability, auto_offline) VALUES ($1, $2, 1, $2, NOW(), NOW(), NOW(), 0, true)',
      [accountId, userId]
    )

    // 5. Generate API token
    const apiToken = crypto.randomBytes(32).toString('hex')
    await client.query(
      'INSERT INTO access_tokens (owner_type, owner_id, token, created_at, updated_at) VALUES (\'User\', $1, $2, NOW(), NOW())',
      [userId, apiToken]
    )

    await client.query('COMMIT')

    console.log('[createChatwootAccount] Created account:', accountId, 'user:', userId, 'token:', apiToken)
    
    return { accountId, userEmail: businessEmail, userPassword: tempPassword, apiToken }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[createChatwootAccount] Error:', error)
    return null
  } finally {
    client.release()
  }
}

export async function GET() {
  try {
    const clients = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        chatwootAccountId: true,
        chatwootApiToken: true,
        repondlyPassword: true,
        whatsappConnected: true,
        facebookConnected: true,
        instagramConnected: true,
        whatsappInboxId: true,
        facebookInboxId: true,
        instagramInboxId: true,
        createdAt: true,
      }
    })
    return NextResponse.json({ clients })
  } catch (err) {
    console.error('Error fetching clients:', err)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, plan, status } = body

    // Map incoming plan to valid Prisma Plan enum
    const planMap: Record<string, 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'> = {
      'TRIAL': 'FREE',
      'FREE': 'FREE',
      'STARTER': 'STARTER',
      'PRO': 'PRO',
      'BUSINESS': 'BUSINESS',
    }

    const validPlan = planMap[plan?.toUpperCase()] || 'FREE'

    // Generate random Repondly password
    const repondlyPassword = crypto.randomBytes(16).toString('hex')

    // Create Chatwoot account, user, and API token
    const chatwootResult = await createChatwootAccount(name, email)

    const newClient = await prisma.business.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(repondlyPassword, 12),
        repondlyPassword,
        plan: validPlan,
        status: status || 'TRIAL',
        chatwootAccountId: chatwootResult?.accountId,
        chatwootApiToken: chatwootResult?.apiToken,
        chatwootUserPassword: chatwootResult?.userPassword,
      }
    })

    return NextResponse.json({ 
      success: true, 
      client: newClient,
      chatwootProvisioned: !!chatwootResult,
      chatwootCredentials: chatwootResult ? {
        accountId: chatwootResult.accountId,
        userEmail: chatwootResult.userEmail,
        userPassword: chatwootResult.userPassword,
        apiToken: chatwootResult.apiToken,
      } : null,
    })
  } catch (err) {
    console.error('Error creating client:', err)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
