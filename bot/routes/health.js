import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import Groq from 'groq-sdk'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function healthHandler(_req, res) {
  const checks = {
    db: false,
    groq: false,
  }

  // DB check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = true
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      ts: new Date().toISOString(),
      msg: 'health_db_failed',
      error: err.message,
    }))
  }

  // Groq check (lightweight models list call)
  try {
    await groq.models.list()
    checks.groq = true
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      ts: new Date().toISOString(),
      msg: 'health_groq_failed',
      error: err.message,
    }))
  }

  const allOk = checks.db && checks.groq

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'error',
    ts: new Date().toISOString(),
    checks,
  })
}
