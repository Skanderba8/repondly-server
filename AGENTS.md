# Répondly — Agent Guide

## Structure
```
/opt/repondly/
├── app/  (Next.js 15, port 3004)
│   ├── src/app/        ← routes
│   ├── src/components/ ← UI
│   ├── src/lib/        ← prisma, groq, whatsapp, auth, utils
│   ├── src/types/      ← index.ts
│   └── prisma/schema.prisma
└── bot/  (Express, port 3001)
```

## Stack
Next.js 15 App Router · Supabase Postgres · Prisma 7 · NextAuth v5 · Groq `llama-3.3-70b-versatile` · Tailwind v4 · Meta Cloud API

## Conventions
- `@/` → `./src/`
- Server components by default. `'use client'` only when needed
- API responses: `{ success: boolean, data?: any, error?: string }`
- UI language: French
- No `any`, no `console.log`, no hardcoded colors
- 4px radius everywhere. Colors via CSS variables from `globals.css`

## Database
```bash
cd /opt/repondly/app
npx prisma migrate dev --name <name>  # uses DIRECT_URL port 5432
npx prisma generate                    # after schema changes
```
6 models: `Business` `Contact` `Conversation` `Message` `Notification` `WebhookEvent`
Always filter queries by `businessId`.

## Auth
```ts
const session = await auth()
if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
```

## Deploy
```bash
cd /opt/repondly/app && npm run build && pm2 restart app
cd /opt/repondly/bot && pm2 restart repondly-bot
```

## File placement
| Type | Path |
|---|---|
| Page | `src/app/(dashboard)/[name]/page.tsx` |
| API route | `src/app/api/[name]/route.ts` |
| Component | `src/components/[Name].tsx` |
| Type | `src/types/index.ts` |

## Not yet created — do not import
`src/lib/auth.ts` · `src/lib/prisma.ts` · `src/lib/groq.ts` · `src/lib/whatsapp.ts`

## Build status
Frontend-only shell. Mock data in `src/lib/mock.ts`. No API calls wired yet.

## Rules
- Inspect relevant files before editing
- Plan first, then edit
- One fix at a time — stop and show diff
- Use existing patterns, never refactor unrelated files
- Do not install packages without asking
- Never touch `.env`, secrets, or production data
- Do not run builds or checks unless asked