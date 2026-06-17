import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const LOCAL_CONNECTION_LABEL = 'Local messaging test'
const LOCAL_ACCOUNT_PREFIX = 'local-test'

function write(value = '') {
  output.write(`${value}\n`)
}

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env')

  if (!fs.existsSync(envPath)) {
    return
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function normalizeChoice(value, fallback) {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeContactId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_+.-]/g, '-')
}

function localThreadId(businessId, contactExternalId) {
  return `${LOCAL_ACCOUNT_PREFIX}:${businessId}:${contactExternalId}`
}

function displayContact(contact) {
  const identity = contact.phone ?? contact.username ?? contact.externalId

  return `${contact.name ?? 'Sans nom'} (${identity})`
}

function displayMessage(message) {
  const time = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.createdAt)
  const sender = message.direction === 'INBOUND' ? 'client' : 'dashboard'

  return `[${time}] ${sender}: ${message.content}`
}

async function selectBusiness(prisma, rl) {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  })

  if (businesses.length === 0) {
    throw new Error('Aucun business trouve en base.')
  }

  write('\nBusiness disponibles:')
  businesses.forEach((business, index) => {
    write(`${index + 1}. ${business.name} | ${business.email ?? business.phone} | ${business.id}`)
  })

  const answer = await rl.question('\nChoisir un business [1]: ')
  const index = normalizeChoice(answer, 1) - 1

  return businesses[index] ?? businesses[0]
}

async function ensureLocalConnection(prisma, businessId) {
  const existing = await prisma.businessChannelConnection.findFirst({
    where: {
      businessId,
      channel: 'WHATSAPP',
      label: LOCAL_CONNECTION_LABEL,
    },
  })

  if (existing) {
    return prisma.businessChannelConnection.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        displayName: LOCAL_CONNECTION_LABEL,
      },
    })
  }

  return prisma.businessChannelConnection.create({
    data: {
      businessId,
      channel: 'WHATSAPP',
      status: 'ACTIVE',
      label: LOCAL_CONNECTION_LABEL,
      displayName: LOCAL_CONNECTION_LABEL,
    },
  })
}

async function selectContact(prisma, rl, businessId, connectionId) {
  const contacts = await prisma.contact.findMany({
    where: { businessId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  write('\nContacts recents:')
  contacts.forEach((contact, index) => {
    write(`${index + 1}. ${displayContact(contact)} | ${contact.id}`)
  })
  write('N. Nouveau contact')

  const answer = (await rl.question('\nChoisir un contact [N]: ')).trim()
  const selectedIndex = Number.parseInt(answer, 10) - 1

  if (Number.isFinite(selectedIndex) && contacts[selectedIndex]) {
    return contacts[selectedIndex]
  }

  const name = (await rl.question('Nom du client [Client local]: ')).trim() || 'Client local'
  const phone = (await rl.question('Telephone / identifiant [+21600000000]: ')).trim() || '+21600000000'
  const externalId = normalizeContactId(phone)

  return prisma.contact.upsert({
    where: {
      businessId_channel_externalId: {
        businessId,
        channel: 'WHATSAPP',
        externalId,
      },
    },
    update: {
      connectionId,
      name,
      phone,
      lastSeen: new Date(),
    },
    create: {
      businessId,
      connectionId,
      channel: 'WHATSAPP',
      externalId,
      name,
      phone,
      lastSeen: new Date(),
    },
  })
}

async function selectConversation(prisma, rl, businessId, connectionId, contact) {
  const conversations = await prisma.conversation.findMany({
    where: {
      businessId,
      contactId: contact.id,
    },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
    take: 10,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (conversations.length > 0) {
    write('\nConversations existantes:')
    conversations.forEach((conversation, index) => {
      const lastMessage = conversation.messages[0]?.content ?? 'Aucun message'
      write(`${index + 1}. ${conversation.status} | ${lastMessage} | ${conversation.id}`)
    })
  }

  write('N. Nouvelle conversation')
  const answer = (await rl.question('\nChoisir une conversation [N]: ')).trim()
  const selectedIndex = Number.parseInt(answer, 10) - 1

  if (Number.isFinite(selectedIndex) && conversations[selectedIndex]) {
    return conversations[selectedIndex]
  }

  const conversation = await prisma.conversation.create({
    data: {
      businessId,
      connectionId,
      channel: 'WHATSAPP',
      contactId: contact.id,
      status: 'NEW',
      externalThreadId: `${localThreadId(businessId, contact.externalId)}:${Date.now()}`,
    },
  })

  await prisma.contact.update({
    where: { id: contact.id },
    data: {
      totalConversations: {
        increment: 1,
      },
    },
  })

  return conversation
}

async function printThread(prisma, conversationId) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  write('\nThread:')

  if (messages.length === 0) {
    write('Aucun message.')
    return
  }

  messages.forEach((message) => write(displayMessage(message)))
}

async function sendInboundMessage(prisma, conversation, content) {
  const now = new Date()
  const message = await prisma.message.create({
    data: {
      businessId: conversation.businessId,
      connectionId: conversation.connectionId,
      channel: conversation.channel,
      conversationId: conversation.id,
      direction: 'INBOUND',
      senderType: 'CUSTOMER',
      type: 'TEXT',
      content,
      status: 'SENT',
      externalMessageId: `${LOCAL_ACCOUNT_PREFIX}:${conversation.id}:${Date.now()}`,
      rawPayload: {
        source: 'local-messaging-test',
      },
      createdAt: now,
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      lastInboundMessageAt: now,
      unreadCount: {
        increment: 1,
      },
      status: conversation.status === 'RESOLVED' ? 'NEW' : conversation.status,
    },
  })

  await prisma.contact.update({
    where: { id: conversation.contactId },
    data: { lastSeen: now },
  })

  return message
}

async function watchReplies(prisma, rl, conversationId) {
  const latest = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  let cursor = latest?.createdAt ?? new Date(0)
  let stopped = false

  write('\nSurveillance des reponses dashboard. Appuyez sur Entree pour arreter.')

  const interval = setInterval(async () => {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        direction: 'OUTBOUND',
        createdAt: {
          gt: cursor,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    for (const message of messages) {
      cursor = message.createdAt
      write(displayMessage(message))
    }
  }, 1500)

  await rl.question('')
  stopped = true
  clearInterval(interval)

  return stopped
}

async function run() {
  loadEnvFile()

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL est requis dans .env.')
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString })),
    log: ['error'],
  })
  const rl = readline.createInterface({ input, output })

  try {
    write('Repondly local messaging tester')
    const business = await selectBusiness(prisma, rl)
    const connection = await ensureLocalConnection(prisma, business.id)
    let contact = await selectContact(prisma, rl, business.id, connection.id)
    let conversation = await selectConversation(prisma, rl, business.id, connection.id, contact)

    write(`\nSession active: ${business.name} / ${displayContact(contact)}`)
    write(`Conversation: ${conversation.id}`)

    while (true) {
      write('\nActions:')
      write('1. Envoyer un message client vers le dashboard')
      write('2. Voir le thread')
      write('3. Surveiller les reponses dashboard')
      write('4. Changer de contact / conversation')
      write('5. Quitter')

      const action = (await rl.question('\nChoisir [1]: ')).trim() || '1'

      if (action === '1') {
        const content = (await rl.question('Message client: ')).trim()

        if (!content) {
          write('Message vide ignore.')
          continue
        }

        const message = await sendInboundMessage(prisma, conversation, content)
        write(`Message envoye: ${message.id}`)
        conversation = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } })
        continue
      }

      if (action === '2') {
        await printThread(prisma, conversation.id)
        continue
      }

      if (action === '3') {
        await watchReplies(prisma, rl, conversation.id)
        continue
      }

      if (action === '4') {
        contact = await selectContact(prisma, rl, business.id, connection.id)
        conversation = await selectConversation(prisma, rl, business.id, connection.id, contact)
        write(`Conversation active: ${conversation.id}`)
        continue
      }

      if (action === '5') {
        break
      }

      write('Action inconnue.')
    }
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

run().catch((error) => {
  write(error instanceof Error ? error.message : 'Erreur inattendue.')
  process.exitCode = 1
})
