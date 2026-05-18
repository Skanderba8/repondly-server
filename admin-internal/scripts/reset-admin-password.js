const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv/config')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
})

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@repondly.com'
  const newPassword = process.argv[2] || 'Admin2026!'

  console.log(`Resetting password for admin: ${adminEmail}`)
  console.log(`New password: ${newPassword}`)

  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    }
  })

  if (!admin) {
    console.error('Admin user not found')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash }
  })

  console.log('Password reset successfully!')
  console.log(`You can now login with: ${adminEmail}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
