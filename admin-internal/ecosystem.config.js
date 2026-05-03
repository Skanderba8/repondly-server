require('dotenv').config({ path: '/opt/repondly/admin-internal/.env' })

module.exports = {
  apps: [{
    name: 'admin-internal',
    script: 'node_modules/.bin/next',
    args: 'start -p 3006',
    cwd: '/opt/repondly/admin-internal',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_URL_CHATWOOT: process.env.DATABASE_URL_CHATWOOT,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      INTERNAL_SECRET: process.env.INTERNAL_SECRET,
      CHATWOOT_API_TOKEN: process.env.CHATWOOT_API_TOKEN,
      CHATWOOT_ACCOUNT_ID: process.env.CHATWOOT_ACCOUNT_ID,
    },
  }]
}
