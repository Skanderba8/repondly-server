---
inclusion: fileMatch
fileMatchPattern: "frontend/src/**/*.{ts,tsx}"
---

# Répondly Frontend — Rules & Conventions

## Stack

- **Next.js 15** App Router (no Pages Router)
- **TypeScript** strict mode
- **Prisma v7** with `@prisma/adapter-pg` (PostgreSQL on port 5433)
- **NextAuth v5** (`next-auth@5.0.0-beta`) with JWT strategy, Credentials provider
- **lucide-react** for icons (admin UI)
- **No CSS framework** — all styles are inline (`style={{}}`)
- **No Tailwind** in new components (legacy pages may have it, don't add more)

## Project Structure

```
frontend/
├── prisma/
│   └── schema.prisma          # Single source of truth for DB models
├── prisma.config.ts           # Prisma config (loads .env via dotenv/config)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Providers, fonts)
│   │   ├── page.tsx           # Landing page
│   │   ├── auth/
│   │   │   ├── signin/        # Sign-in page
│   │   │   └── register/      # Registration page
│   │   ├── dashboard/         # Client dashboard (authenticated)
│   │   │   ├── layout.tsx     # Wraps DashboardShell
│   │   │   ├── DashboardShell.tsx
│   │   │   └── page.tsx
│   │   ├── admin/             # Admin dashboard (admin-only)
│   │   │   ├── layout.tsx     # AdminSidebar layout
│   │   │   ├── page.tsx       # Overview
│   │   │   ├── clients/
│   │   │   ├── onboarding/
│   │   │   ├── bot/
│   │   │   ├── billing/
│   │   │   └── system/
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── admin/         # Admin API routes (all require isAdmin check)
│   │       └── internal/      # Internal routes (require x-internal-secret header)
│   ├── components/
│   │   ├── Sidebar.tsx        # Client dashboard sidebar
│   │   ├── Topbar.tsx         # Client dashboard topbar
│   │   ├── AdminSidebar.tsx   # Admin sidebar
│   │   ├── Providers.tsx      # SessionProvider wrapper
│   │   └── admin/             # Admin-specific components
│   │       ├── ClientsTable.tsx
│   │       └── KanbanBoard.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── admin.ts           # Admin helpers & pure functions
│   │   ├── LangContext.tsx    # i18n context
│   │   └── i18n.ts            # Translation strings
│   └── middleware.ts          # Admin route guard
```

## Styling Rules

**All styles are inline.** No CSS modules, no Tailwind classes in new code.

Use these color tokens for admin UI:

```ts
const C = {
  bg: '#ffffff',
  bgAlt: '#f4f7fb',
  blue: '#1a6bff',
  blueLight: '#e8f0ff',
  ink: '#0d1b2e',
  mid: '#5a6a80',
  border: '#e2e8f0',
}
```

For the client dashboard, follow the existing pattern in `Sidebar.tsx`:
- Background: `#ffffff`, borders: `#ebebea`, text: `#111110`, muted: `#6b6b67`
- Active nav: `background: #f3f3f1`, `color: #111110`
- Accent: `#2563eb`

## Component Rules

### Server vs Client

- Default to **server components** — only add `'use client'` when you need hooks, event handlers, or browser APIs
- Layouts are always server components
- Pages that need interactivity use a server component shell + a client component child
- Pattern: `page.tsx` (server, fetches data) → passes props to `ClientComponent.tsx`

### Naming

- Pages: `page.tsx` inside the route folder
- Layouts: `layout.tsx`
- Client components: PascalCase, e.g. `ClientsTable.tsx`
- Admin components go in `src/components/admin/`
- Shared components go in `src/components/`

### useEffect with async / setState

When calling an async function inside `useEffect` that sets state, add the file-level disable at the top:

```ts
/* eslint-disable react-hooks/set-state-in-effect */
```

And use `void` to suppress unhandled promise warnings:

```ts
useEffect(() => {
  void fetchData()
  const interval = setInterval(() => { void fetchData() }, 30000)
  return () => clearInterval(interval)
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

## API Routes

### Admin routes (`/api/admin/*`)

Every admin API route **must** start with this guard:

```ts
const session = await auth()
if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

Import `isAdmin` from `@/lib/admin`, `auth` from `@/lib/auth`.

### Internal routes (`/api/internal/*`)

Must verify the `x-internal-secret` header:

```ts
const secret = req.headers.get('x-internal-secret')
if (secret !== process.env.INTERNAL_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Route handler params (Next.js 15)

Params are a **Promise** in Next.js 15 — always await them:

```ts
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
```

### Error responses

| Situation | Status |
|-----------|--------|
| Not admin | 403 `{ error: 'Forbidden' }` |
| Not found | 404 `{ error: 'Not found' }` |
| Bad input | 400 `{ error: 'Bad request' }` |
| Server error | 500 `{ error: 'Internal server error' }` |
| Unauthorized (internal) | 401 `{ error: 'Unauthorized' }` |

Never expose Prisma error details in responses.

## Database

- Import prisma as: `import { prisma } from '@/lib/prisma'`
- The singleton is exported as a named export `prisma`, not default
- Database: PostgreSQL on `127.0.0.1:5433`, db `repondly`
- After schema changes: `npx prisma db push` then `npx prisma generate` (run from `frontend/`)

## Authentication

- `auth()` from `@/lib/auth` — use in server components and API routes
- `useSession()` from `next-auth/react` — use in client components
- `signOut({ callbackUrl: '/auth/signin' })` from `next-auth/react` — for sign out buttons
- Admin check: `session.user.email === process.env.ADMIN_EMAIL`
- The `isAdmin(session)` helper in `src/lib/admin.ts` wraps this check

## i18n

The app supports French/Arabic via `LangContext`. When adding user-facing strings to client dashboard pages:

```ts
const { tr } = useLang()
// use tr.someKey
```

Add new keys to `src/lib/i18n.ts`. Admin pages are French-only and don't use i18n.

## Build & Deploy

- Build: `npm run build` from `frontend/`
- The app runs via PM2 — after build: `pm2 restart all`
- ESLint errors block the build; warnings do not
- The Edge Runtime warnings about `pg`/`bcryptjs` are harmless — ignore them
skander@vmi3245521:/opt/repondly/frontend$ node -e "require('bcryptjs').hash('Admin2026!', 10).then(h => console.log(h))"
bash: !',: event not found
skander@vmi3245521:/opt/repondly/frontend$ 