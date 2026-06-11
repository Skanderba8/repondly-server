require('dotenv').config({ path: '/opt/repondly/admin/.env' })

module.exports = {
  apps: [{
    name: 'admin',
    script: 'node_modules/.bin/next',
    args: 'start -p 3006',
    cwd: '/opt/repondly/admin',
    // Memory limit: restart if exceeds 300MB
    max_memory_restart: '300M',
    // Exponential backoff restart delay to prevent crash-loops
    exp_backoff_restart_delay: 1000,
    // Maximum restarts in a 15-minute window before stopping
    max_restarts: 10,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'production',
      // Limit Node.js heap to 256MB (Next.js production doesn't need much)
      NODE_OPTIONS: '--max-old-space-size=256',
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      INTERNAL_SECRET: process.env.INTERNAL_SECRET,
    },
  }]
}
