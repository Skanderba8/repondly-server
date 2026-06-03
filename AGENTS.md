# Repondly

B2B SaaS automating WhatsApp/Facebook/Instagram for Tunisian SMBs.

## Architecture

4 independent apps (not a formal monorepo — no workspaces, no shared packages), deployed on a single VPS behind Nginx:

| App | Dir | Port | Lang | PM2 name |
|-----|-----|------|------|----------|
| Marketing site | `marketing-site/` | 3005 | TS (Next.js 15) | `marketing-site` |
| Dashboard | `dashboard-app/` | 3004 | TS (Next.js 15) | `dashboard-app` |
| Admin internal | `admin-internal/` | 3006 | TS (Next.js 15) | `admin-internal` |
| Bot engine | `bot/` | 3001 | JS (Express) | `repondly-bot` |

All share a single PostgreSQL 16 database (`DATABASE_URL`, port 5433). Docker services: Chatwoot (`chatwoot/`) on port 3000.

**Nginx routing critical detail:** `/_next/` static assets are routed via `$http_referer` — requests from `/admin` pages go to port 3006, all others to 3004. If you add a new app under `app.repondly.com`, update the Nginx map block.

## Commands

Run all commands from the relevant app directory:

```
# Build & deploy (dashboard-app example)
npm run build && pm2 restart dashboard-app

# Dev servers (each app has its own)
npm run dev                    # Next.js dev on app-specific port

# Bot (no build step, plain JS)
node --env-file=.env index.js  # or: npm start (in bot/)

# Lint
npm run lint                   # ESLint (Next.js apps only)

# Test (Vitest — configured but no test files exist yet)
npm run test

# Prisma
npx prisma migrate dev         # from admin-internal/ (migrations live here)
npx prisma generate            # from any app dir after schema changes
npx prisma studio               # from any app dir

# PM2
pm2 list
pm2 restart <name>
pm2 logs repondly-bot --lines 50
pm2 save                       # persist across reboots
```

## Bot contract

All AI responses use JSON envelope: `{ reply, action, extraction }`.

Terminal states: `order_complete`, `appointment_complete`, `human_handover`. Each triggers a Chatwoot API call (assign conversation + add private note) and a WhatsApp notification to the business owner.

## Database

**Schema location**: `admin-internal/prisma/schema.prisma` — this is the only schema file.
Bot and dashboard symlink to it. Never edit `bot/prisma/schema.prisma` or
`dashboard-app/prisma/schema.prisma` directly (they are symlinks, not real files).

**After any schema change**, regenerate all clients:
```
  cd admin-internal && npm run db:generate
  cd ../dashboard-app && npm run db:generate
  cd ../bot && npm run db:generate
```
Or use the root helper: `source commands.sh && db:generate:all`

**Migrations**: always run from admin-internal only:
```
  cd admin-internal && npm run db:migrate
```
Never run migrations from bot/ or dashboard-app/.

## Auth

NextAuth v5 with Credentials provider. Each API route calls `auth()` to get the session:

```ts
import { auth } from '@/lib/auth'
// in route handler:
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}
```

Auth checks `AdminUser` first (with raw SQL), then falls back to `Business` for legacy accounts.

## API conventions

- Response format: `NextResponse.json({ success: boolean, data?: any, error?: string })`
- Dashboard UI is in French
- No em dashes, clean minimal code
- TS strict mode in Next.js apps; bot is plain JS
- Import alias `@/` maps to `./src/` in all Next.js apps
- Tailwind v4 + Radix/Shadcn for UI components (no custom CSS)

## Languages & AI

French, Arabic, Darija (incl. Arabizi). Business owner selects default language in config. `generatePrompt()` in `bot/generatePrompt.js` assembles the system prompt from structured DB config fields — owners never write prompts manually.

LLM: Groq `llama-3.3-70b-versatile` (bot only).

## Env vars

Each app has its own `.env` (gitignored) and `.env.example`. Key shared vars:
- `DATABASE_URL` — PostgreSQL connection (all apps)
- `GROQ_API_KEY` — Groq LLM (bot only)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — NextAuth (dashboard, admin)
- `CHATWOOT_API_URL`, `CHATWOOT_API_TOKEN` — Chatwoot API (bot, admin)
- `INTERNAL_SECRET` — shared secret for bot↔dashboard internal calls

## PWA update flow

When updating the PWA (dashboard-app):
1. Increment `CACHE_VERSION` in `dashboard-app/public/sw.js`
2. Increment version in `dashboard-app/public/manifest.json`

## Additional docs

- `README.md` — full stack documentation, request flows, onboarding guide
- `ARCHITECTURE.md` — detailed architecture diagram and component inventory
- `docs/` — per-service docs (auth, bot, chatwoot, database, etc.)
- `commands.sh` — convenience snippets
- `.windsurfrules` — AI coding rules (some aspirational — `packages/shared` and `packages/db` do not exist yet)
