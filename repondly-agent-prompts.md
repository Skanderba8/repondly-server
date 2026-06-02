# Répondly — Complete Agent Prompt Series
> Run each prompt in a **new chat** with full file access to `/opt/repondly`.  
> Run them **in order**. Each prompt assumes the previous one is complete.  
> Do not skip prompts. Do not combine prompts.

---

## PROMPT 1 — Design System & Component Primitives

```
You are a senior UI engineer setting up the design system for Répondly, a B2B SaaS dashboard for Tunisian SMEs. The primary interface is a PWA used on mobile by non-technical business owners.

## Context (read before touching any file)

Read these files in full before writing a single line:
- dashboard-app/src/app/globals.css  (existing CSS variables and theme)
- dashboard-app/package.json         (current deps, Tailwind v4 confirmed)
- dashboard-app/src/lib/theme.ts     (existing JS theme palette)
- dashboard-app/src/components/ui/   (all existing UI components)

## Your task

### 1. Install shadcn/ui

Run the shadcn/ui init for Tailwind v4 (no tailwind.config file — uses CSS vars in globals.css directly):

```bash
cd dashboard-app
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

Then install these components:
```bash
npx shadcn@latest add button input label select textarea switch badge tabs card dialog sheet skeleton toast progress avatar separator
```

### 2. Extend globals.css with the Répondly design token system

After shadcn init updates globals.css with its :root variables, ADD the following design tokens into the :root and .dark blocks. Do NOT remove shadcn's generated variables — extend them.

Append inside `:root`:
```css
/* Répondly brand tokens */
--brand-primary: #6C63FF;
--brand-primary-hover: #5A52E0;
--brand-primary-soft: rgba(108, 99, 255, 0.12);
--brand-success: #22C55E;
--brand-success-soft: rgba(34, 197, 94, 0.12);
--brand-warning: #F59E0B;
--brand-warning-soft: rgba(245, 158, 11, 0.12);
--brand-danger: #EF4444;
--brand-danger-soft: rgba(239, 68, 68, 0.12);

/* Surface layers */
--surface-0: #FFFFFF;
--surface-1: #F8F8FA;
--surface-2: #F0F0F5;
--surface-border: #E4E4EF;

/* Text */
--text-primary: #0F0F14;
--text-secondary: #6B6B80;
--text-muted: #A0A0B4;
--text-on-brand: #FFFFFF;

/* Shell */
--shell-nav-height: 64px;
--shell-bottom-nav-height: 72px;
--shell-sidebar-width: 240px;

/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-pill: 9999px;

/* Shadow */
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-elevated: 0 4px 16px rgba(0,0,0,0.10);
--shadow-overlay: 0 8px 32px rgba(0,0,0,0.16);

/* Transitions */
--transition-fast: 120ms ease;
--transition-base: 200ms ease;
--transition-slow: 320ms ease;
```

Append inside `[data-theme="dark"]` (or `.dark` if shadcn uses that):
```css
--brand-primary: #7C74FF;
--brand-primary-hover: #6C63FF;
--brand-primary-soft: rgba(124, 116, 255, 0.15);
--surface-0: #0F0F14;
--surface-1: #18181F;
--surface-2: #22222C;
--surface-border: #2E2E3E;
--text-primary: #F4F4F8;
--text-secondary: #9898B0;
--text-muted: #60607A;
--shadow-card: 0 1px 3px rgba(0,0,0,0.20);
--shadow-elevated: 0 4px 16px rgba(0,0,0,0.30);
```

### 3. Create a typography system

Create `dashboard-app/src/components/ui/typography.tsx`:

```tsx
import { cn } from "@/lib/utils"

type TextProps = { className?: string; children: React.ReactNode }

export function H1({ className, children }: TextProps) {
  return <h1 className={cn("text-2xl font-bold tracking-tight text-[var(--text-primary)]", className)}>{children}</h1>
}
export function H2({ className, children }: TextProps) {
  return <h2 className={cn("text-xl font-semibold tracking-tight text-[var(--text-primary)]", className)}>{children}</h2>
}
export function H3({ className, children }: TextProps) {
  return <h3 className={cn("text-base font-semibold text-[var(--text-primary)]", className)}>{children}</h3>
}
export function Body({ className, children }: TextProps) {
  return <p className={cn("text-sm text-[var(--text-secondary)] leading-relaxed", className)}>{children}</p>
}
export function Caption({ className, children }: TextProps) {
  return <span className={cn("text-xs text-[var(--text-muted)]", className)}>{children}</span>
}
export function Label({ className, children }: TextProps) {
  return <span className={cn("text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]", className)}>{children}</span>
}
```

### 4. Create a Card primitive

Create `dashboard-app/src/components/ui/card-surface.tsx` (rename to avoid shadcn collision):

```tsx
import { cn } from "@/lib/utils"

interface CardSurfaceProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  interactive?: boolean
}

export function CardSurface({ className, children, onClick, interactive }: CardSurfaceProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--surface-0)] border border-[var(--surface-border)]",
        "shadow-[var(--shadow-card)]",
        interactive && "cursor-pointer transition-all duration-[var(--transition-base)] hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]",
        className
      )}
    >
      {children}
    </div>
  )
}
```

### 5. Create a StatusBadge component

Create `dashboard-app/src/components/ui/status-badge.tsx`:

```tsx
import { cn } from "@/lib/utils"

type Status = "active" | "pending" | "resolved" | "bot" | "human" | "closed"

const config: Record<Status, { label: string; className: string }> = {
  active:   { label: "Actif",    className: "bg-[var(--brand-success-soft)] text-[var(--brand-success)]" },
  pending:  { label: "En attente", className: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning)]" },
  resolved: { label: "Résolu",   className: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
  bot:      { label: "Bot",      className: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" },
  human:    { label: "Humain",   className: "bg-[var(--brand-warning-soft)] text-[var(--brand-warning)]" },
  closed:   { label: "Fermé",    className: "bg-[var(--surface-2)] text-[var(--text-muted)]" },
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium", c.className, className)}>
      {c.label}
    </span>
  )
}
```

### 6. Create a utils.ts if shadcn didn't generate one

Check if `dashboard-app/src/lib/utils.ts` exists. If not, create it:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install deps if needed: `npm install clsx tailwind-merge`

### 7. Verification

After all changes:
1. Run `npm run dev` in dashboard-app and confirm it starts without errors.
2. Confirm shadcn components are importable from `@/components/ui/button` etc.
3. Confirm CSS variables are visible in browser devtools on :root.
4. Do NOT modify any page files or routing yet.

Report back: list every file created or modified with a one-line description of what changed.
```

---

## PROMPT 2 — Security Hardening

```
You are a senior security engineer auditing and hardening the Répondly dashboard-app and bot service.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/src/middleware.ts
- dashboard-app/src/app/api/products/route.ts
- dashboard-app/src/app/api/schedule-exceptions/route.ts
- dashboard-app/src/app/api/config/route.ts
- dashboard-app/src/app/api/chatwoot/webhook/route.ts
- dashboard-app/src/lib/auth.ts
- dashboard-app/src/lib/auth.config.ts
- dashboard-app/src/lib/prisma.ts
- bot/index.js (lines 280–310 especially — webhook verification)
- nginx.conf

Also read ALL files in dashboard-app/src/app/api/ (list them first, then read each one).

## Your tasks

### Task 1 — Create a reusable API auth helper

Create `dashboard-app/src/lib/api-auth.ts`:

```ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Call at the top of every API route handler.
 * Returns { session, businessId } on success, or a NextResponse 401 to return directly.
 */
export async function requireAuth(): Promise<
  { session: Awaited<ReturnType<typeof auth>>; businessId: string } | NextResponse
> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { session, businessId: session.user.id }
}
```

### Task 2 — Fix IDOR vulnerabilities

For EVERY route in dashboard-app/src/app/api/ that accepts a `businessId` from the request body or query params:

1. Call `requireAuth()` at the top.
2. Replace the body/query `businessId` with `session.user.id` (the authenticated business).
3. Never trust client-supplied `businessId`.

Specifically fix (but audit ALL routes — these are confirmed vulnerabilities):
- `dashboard-app/src/app/api/products/route.ts` — POST handler, lines ~39–48
- `dashboard-app/src/app/api/schedule-exceptions/route.ts` — lines ~38–47

Pattern for every fixed route:
```ts
export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const { businessId } = authResult

  const body = await req.json()
  // Use businessId from session, never from body
  const result = await prisma.someModel.create({
    data: { ...body, businessId }  // businessId always from session
  })
  return NextResponse.json(result)
}
```

### Task 3 — Protect all API routes via middleware

Open `dashboard-app/src/middleware.ts`. Currently it only protects `/dashboard/:path*` pages.

Extend the matcher to also protect `/api/*` routes EXCEPT public ones:

```ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth|webhook|health).)*",  // protect all API except auth, webhooks, health
  ],
}
```

And in the middleware handler, for API routes return JSON 401 instead of redirect:

```ts
export default auth((req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api/")
  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
})
```

### Task 4 — Fix webhook HMAC verification in dashboard

Open `dashboard-app/src/app/api/chatwoot/webhook/route.ts`.

Replace the current token comparison with proper HMAC-SHA256 verification:

```ts
import { createHmac } from "crypto"

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  return `sha256=${expected}` === signature
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-hub-signature-256") ?? req.headers.get("x-chatwoot-webhook-token")
  
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  // ... rest of handler
}
```

### Task 5 — Fix webhook verification in bot

Open `bot/index.js`. Find the webhook verification block (around lines 288–294).

Replace plain string comparison with HMAC:

```js
const crypto = require('crypto')

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// In the route handler, use express.raw() or capture rawBody before json parse
```

Adjust express body parsing to capture raw body for signature verification. Show the full updated handler.

### Task 6 — Add basic rate limiting

Install: `npm install @upstash/ratelimit` or use a simple in-memory limiter since there's no Redis yet.

Create `dashboard-app/src/lib/rate-limit.ts`:

```ts
const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = requests.get(key)
  
  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }
  
  if (entry.count >= limit) return false // blocked
  entry.count++
  return true // allowed
}
```

Apply to the auth signin route: max 5 attempts per IP per minute.

### Task 7 — Verify and document

After all changes:
1. Run `npm run build` in dashboard-app. Fix any TypeScript errors.
2. List every file modified with what was changed.
3. List any API routes that could NOT be secured (e.g. public webhooks) and why they are intentionally public.
4. Write a short `SECURITY.md` in dashboard-app/ summarizing the security model: what is protected, how tenant isolation works, what the webhook secrets do.
```

---

## PROMPT 3 — Schema Unification & Database Migrations

```
You are a senior backend engineer. Your job is to unify the three divergent Prisma schemas in the Répondly monorepo and fix missing database constraints.

## Context (read before writing anything)

Read ALL THREE schemas in full:
- dashboard-app/prisma/schema.prisma
- bot/prisma/schema.prisma  
- admin-internal/prisma/schema.prisma

Also read:
- bot/index.js (lines 190–260 — handover logic, ConversationLog usage)
- bot/lib/handoverManager.js (full file)
- dashboard-app/src/lib/prisma.ts

## Background on the problems

The audit found these specific schema issues:
1. ConversationCRMNote exists only in bot/prisma/schema.prisma — not in dashboard schema
2. Order model missing from admin-internal schema
3. chatwootUserPassword exists only in admin-internal schema
4. ConversationLog missing @@unique([businessId, chatwootConversationId]) — bot tries to use this compound key in upsert and fails at runtime
5. Bot's handover code (bot/index.js) destructures `accountId` from business but the actual field is `chatwootAccountId` — causing undefined in Chatwoot API URLs

## Your tasks

### Task 1 — Define the canonical schema

The canonical schema lives in `dashboard-app/prisma/schema.prisma`. It is the source of truth.

Make the following additions/changes to dashboard-app/prisma/schema.prisma ONLY:

**A. Add missing unique constraint to ConversationLog:**
```prisma
model ConversationLog {
  // ... existing fields ...
  @@unique([businessId, chatwootConversationId])  // ADD THIS
}
```

**B. Add ConversationCRMNote model (from bot schema):**
Copy the full ConversationCRMNote model from bot/prisma/schema.prisma into dashboard-app/prisma/schema.prisma. Verify the relation to Business exists.

**C. Add chatwootUserPassword to Business (from admin schema):**
```prisma
model Business {
  // existing fields...
  chatwootUserPassword  String?  // ADD: used by admin provisioning
}
```

**D. Verify Order model exists** — it should already be in dashboard schema. Confirm.

### Task 2 — Sync bot schema

Replace `bot/prisma/schema.prisma` with a file that simply re-exports the same models needed by the bot. The bot only needs: Business, BotConfig, ConversationLog, ConversationCRMNote, Client, ConnectedPage, Schedule, ScheduleException, Faq, Service, Product.

Copy ONLY those models from the canonical dashboard schema into bot/prisma/schema.prisma. The datasource and generator blocks stay the same.

### Task 3 — Sync admin-internal schema

Same approach: copy the full canonical schema into admin-internal/prisma/schema.prisma. The admin uses Business + AdminUser + all related models.

### Task 4 — Fix the handover bug in bot/index.js

Find the handleHumanHandover function (around line 213). It currently does:
```js
const { accountId } = business  // BUG: field is chatwootAccountId
```

Fix every occurrence in bot/index.js where `accountId` should be `chatwootAccountId`:
```js
const { chatwootAccountId, chatwootApiToken } = business
```

Search for ALL references to `business.accountId` in bot/index.js and bot/lib/handoverManager.js and fix them.

### Task 5 — Generate and apply migrations

For dashboard-app:
```bash
cd dashboard-app
npx prisma migrate dev --name unify-schema
```

If there are migration conflicts (production data exists), create a safe migration:
```bash
npx prisma migrate dev --name add-crm-notes-and-conversation-unique --create-only
```
Then review the generated SQL before applying.

For bot and admin-internal — they should share the same DB, so:
```bash
cd bot && npx prisma generate   # regenerate client only, no migrate
cd admin-internal && npx prisma generate
```

### Task 6 — Verify

1. Run `npx prisma validate` in all three app directories — must pass with 0 errors.
2. Run `npx prisma generate` in all three.
3. Run `npm run build` in dashboard-app.
4. List every change made per file.
5. Write a comment block at the top of each schema.prisma explaining it's synced from canonical (dashboard-app).
```

---

## PROMPT 4 — Fix SSE & Webhook Real-Time Architecture

```
You are a senior backend engineer fixing the real-time messaging architecture for Répondly.

## Context (read before writing anything)

Read these files in full:
- nginx.conf
- dashboard-app/src/lib/sse-broadcaster.ts
- dashboard-app/src/app/api/sse/route.ts
- dashboard-app/src/app/api/chatwoot/webhook/route.ts
- dashboard-app/src/components/messagerie/ConversationList.tsx (focus on SSE + polling sections, lines 100–160)
- dashboard-app/src/app/dashboard/messagerie/[id]/page.tsx (lines 80–140)
- dashboard-app/src/components/AppShell.tsx (lines 40–60 — SSE unread listener)

## Problems to fix

1. **Nginx only routes Chatwoot webhooks to bot:3001** — the dashboard never receives real webhook events. Dashboard falls back to 30s polling.
2. **SSE event name mismatch** — AppShell listens for `new_message` but sse-broadcaster emits `message_created`. Nothing fires.
3. **30-second polling** — brute force, inefficient, causes stale UI.
4. **No connection recovery** — if SSE drops, no reconnect logic.

## Your tasks

### Task 1 — Fix nginx to dual-route webhooks

Open `nginx.conf`. Find the Chatwoot webhook location block (around lines 64–71).

Replace single-target routing with dual fanout. Nginx cannot natively fan out to two upstreams, so use this approach — route the webhook to the dashboard app, which then forwards to the bot internally:

```nginx
# Remove or comment out the direct bot webhook route
# Route ALL chatwoot webhooks to dashboard-app first
location /chatwoot-webhook {
    proxy_pass http://localhost:3004/api/chatwoot/webhook;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 10s;
}
```

The dashboard webhook handler will then forward to the bot. This keeps a single Chatwoot webhook URL.

### Task 2 — Update dashboard webhook handler to fan out

Open `dashboard-app/src/app/api/chatwoot/webhook/route.ts`.

After verifying the signature and broadcasting to SSE, also forward the payload to the bot:

```ts
// After SSE broadcast:
// Forward to bot service (fire and forget — don't await, don't fail if bot is down)
fetch(`http://localhost:3001/chatwoot-webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-chatwoot-webhook-token": process.env.CHATWOOT_WEBHOOK_SECRET ?? "",
  },
  body: rawBody,
}).catch(() => {}) // intentional: dashboard doesn't depend on bot being up
```

### Task 3 — Fix SSE broadcaster event names

Open `dashboard-app/src/lib/sse-broadcaster.ts`.

Audit every `broadcaster.broadcast(...)` call. Standardize to these event names:
- `message_created` — new message in any conversation
- `conversation_updated` — status change, assignment change
- `conversation_created` — new conversation started

Open `dashboard-app/src/components/AppShell.tsx` lines 40–60.
Change any `eventSource.addEventListener("new_message", ...)` to `"message_created"`.

Open every file that uses EventSource and fix event name mismatches.

### Task 4 — Upgrade SSE broadcaster

Open `dashboard-app/src/lib/sse-broadcaster.ts`. Rewrite it to support:

```ts
type SSEClient = {
  id: string
  businessId: string
  controller: ReadableStreamDefaultController
  lastActivity: number
}

class SSEBroadcaster {
  private clients = new Map<string, SSEClient>()

  addClient(id: string, businessId: string, controller: ReadableStreamDefaultController) {
    this.clients.set(id, { id, businessId, controller, lastActivity: Date.now() })
  }

  removeClient(id: string) {
    this.clients.delete(id)
  }

  // Broadcast only to clients of the same business (tenant isolation)
  broadcastToBusinesss(businessId: string, event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const client of this.clients.values()) {
      if (client.businessId === businessId) {
        try {
          client.controller.enqueue(new TextEncoder().encode(payload))
          client.lastActivity = Date.now()
        } catch {
          this.clients.delete(client.id)
        }
      }
    }
  }

  // Cleanup stale connections (call periodically)
  cleanup() {
    const staleThreshold = Date.now() - 60_000
    for (const [id, client] of this.clients) {
      if (client.lastActivity < staleThreshold) this.clients.delete(id)
    }
  }
}

export const sseBroadcaster = new SSEBroadcaster()
// Cleanup every 60s
setInterval(() => sseBroadcaster.cleanup(), 60_000)
```

Update `dashboard-app/src/app/api/sse/route.ts` to pass businessId when registering a client (get it from the session).

### Task 5 — Remove polling from messagerie

Open `dashboard-app/src/components/messagerie/ConversationList.tsx`.

Remove the `setInterval` polling block (lines ~133–138). Replace with SSE-only updates.

Open `dashboard-app/src/app/dashboard/messagerie/[id]/page.tsx`.
Remove any polling intervals. Keep only SSE-based refresh.

Add reconnect logic to every EventSource usage:

```ts
function createSSE(onMessage: (e: MessageEvent) => void) {
  let es: EventSource
  let retryTimeout: ReturnType<typeof setTimeout>

  function connect() {
    es = new EventSource("/api/sse")
    es.addEventListener("message_created", onMessage)
    es.onerror = () => {
      es.close()
      retryTimeout = setTimeout(connect, 3000) // reconnect after 3s
    }
  }

  connect()
  return () => { es.close(); clearTimeout(retryTimeout) }
}
```

### Task 6 — Add SSE heartbeat

In `dashboard-app/src/app/api/sse/route.ts`, send a heartbeat comment every 20s to keep the connection alive through proxies:

```ts
const heartbeat = setInterval(() => {
  try {
    controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"))
  } catch {
    clearInterval(heartbeat)
  }
}, 20_000)
```

Clean up the interval in the `cancel` handler of the stream.

### Task 7 — Verify

1. Restart bot and dashboard-app.
2. Reload nginx: `sudo nginx -s reload`
3. Send a test message to a connected WhatsApp/IG and verify it appears in the dashboard inbox within 2 seconds (not 30).
4. Confirm in browser devtools → Network → EventStream that events are flowing.
5. List every file modified.
```

---

## PROMPT 5 — PWA Upgrade

```
You are a senior PWA engineer upgrading the Répondly dashboard PWA from a basic install to a production-grade Progressive Web App.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/public/manifest.json
- dashboard-app/public/sw.js
- dashboard-app/src/app/layout.tsx (SW registration and manifest link)
- dashboard-app/package.json
- dashboard-app/next.config.ts

## Current state

The audit found: manifest.json exists, sw.js exists (caches static assets, bypasses /api/), SW is registered in layout.tsx. This is a minimal PWA. It needs to become the primary UI experience.

## Your tasks

### Task 1 — Upgrade manifest.json

Replace `dashboard-app/public/manifest.json` with:

```json
{
  "name": "Répondly",
  "short_name": "Répondly",
  "description": "Automatisez vos conversations clients",
  "start_url": "/dashboard/accueil",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "orientation": "portrait-primary",
  "background_color": "#0F0F14",
  "theme_color": "#6C63FF",
  "categories": ["business", "productivity"],
  "lang": "fr",
  "dir": "ltr",
  "icons": [
    { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-96.png",   "sizes": "96x96",   "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-128.png",  "sizes": "128x128", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-144.png",  "sizes": "144x144", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-152.png",  "sizes": "152x152", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-384.png",  "sizes": "384x384", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [],
  "shortcuts": [
    {
      "name": "Messages",
      "short_name": "Messages",
      "description": "Voir vos messages",
      "url": "/dashboard/messagerie",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Agenda",
      "short_name": "Agenda",
      "description": "Voir vos rendez-vous",
      "url": "/dashboard/rendez-vous",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ]
}
```

Create placeholder icon files note: Add a TODO comment that icons need to be generated from the brand logo. Create `dashboard-app/public/icons/.gitkeep` for now and copy the existing mobile-icon.png to icon-192.png and icon-512.png as placeholders.

### Task 2 — Rewrite sw.js

Replace `dashboard-app/public/sw.js` with a production service worker:

```js
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `repondly-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `repondly-dynamic-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/dashboard/accueil',
  '/dashboard/messagerie',
  '/auth/signin',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API routes: network-only (never cache)
// - SSE: network-only (never cache)
// - Navigation: network-first, fallback to cache
// - Static assets: cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API, SSE, or external requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/api/sse') ||
    url.origin !== self.location.origin
  ) {
    return // let browser handle normally
  }

  // Navigation requests: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request) || caches.match('/dashboard/accueil'))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})

// Push notifications (ready for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Répondly', {
      body: data.body || 'Nouveau message',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: data.tag || 'message',
      data: { url: data.url || '/dashboard/messagerie' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard/messagerie'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

### Task 3 — Upgrade SW registration in layout.tsx

Open `dashboard-app/src/app/layout.tsx`. Replace the current SW registration script with:

```tsx
<script dangerouslySetInnerHTML={{
  __html: `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(function(reg) {
            reg.addEventListener('updatefound', function() {
              const newSW = reg.installing;
              newSW.addEventListener('statechange', function() {
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available — could show update banner
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                }
              });
            });
          })
          .catch(function(err) { console.warn('SW registration failed:', err); });
      });
    }
  `
}} />
```

### Task 4 — Create PWA install prompt hook

Create `dashboard-app/src/hooks/usePWAInstall.ts`:

```ts
import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setIsInstalled(true)
    setInstallPrompt(null)
    return outcome === "accepted"
  }

  return { canInstall: !!installPrompt, isInstalled, install }
}
```

### Task 5 — Add meta tags for iOS PWA

In `dashboard-app/src/app/layout.tsx`, inside the `<head>`, add:

```tsx
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Répondly" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="theme-color" content="#6C63FF" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0F0F14" media="(prefers-color-scheme: dark)" />
```

### Task 6 — Verify

1. Run `npm run build && npm run start` in dashboard-app.
2. Open Chrome DevTools → Application → Service Workers. Confirm SW is registered and active.
3. Open Application → Manifest. Confirm all fields are read correctly. Confirm no warnings.
4. Open Lighthouse → run PWA audit. Target score: 90+.
5. List every file created/modified.
```

---

## PROMPT 6 — AppShell & Navigation Redesign

```
You are a senior UI/UX engineer redesigning the shell and navigation for Répondly. This is a mobile-first PWA. The primary user is a non-technical business owner on an Android or iPhone.

## Design principles
- Mobile navigation: bottom island nav (pill-shaped, floating above content)
- Desktop navigation: fixed left sidebar, 240px wide
- No hamburger menus. No dropdowns on mobile.
- Every nav item needs a label. Active state is obvious.
- The shell must feel like a native app, not a website.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/src/components/AppShell.tsx
- dashboard-app/src/components/MobileShell.tsx
- dashboard-app/src/components/shell/TopBar.tsx
- dashboard-app/src/components/shell/IslandNav.tsx
- dashboard-app/src/components/shell/ProfileSheet.tsx
- dashboard-app/src/components/shell/ThemeToggle.tsx
- dashboard-app/src/app/dashboard/layout.tsx
- dashboard-app/src/app/globals.css (shell CSS variables: --shell-nav-height, --shell-bottom-nav-height, --shell-sidebar-width)
- dashboard-app/src/components/ui/ (all files from Prompt 1)

## Navigation structure

The app has 4 sections (note: commandes is being renamed to rendez-vous in a later prompt — use the new name now):
1. Accueil → /dashboard/accueil → icon: Home
2. Messagerie → /dashboard/messagerie → icon: MessageSquare (+ unread badge)
3. Rendez-vous → /dashboard/rendez-vous → icon: Calendar
4. Configuration → /dashboard/configuration → icon: Settings

## Your tasks

### Task 1 — Rewrite IslandNav (mobile bottom nav)

Rewrite `dashboard-app/src/components/shell/IslandNav.tsx`:

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard/accueil",       label: "Accueil",    icon: Home },
  { href: "/dashboard/messagerie",    label: "Messages",   icon: MessageSquare },
  { href: "/dashboard/rendez-vous",   label: "Agenda",     icon: Calendar },
  { href: "/dashboard/configuration", label: "Config",     icon: Settings },
]

interface IslandNavProps {
  unreadCount?: number
}

export function IslandNav({ unreadCount = 0 }: IslandNavProps) {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: "calc(100% - 32px)",
        maxWidth: "420px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          backgroundColor: "var(--surface-0)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-xl)",
          padding: "8px 12px",
          boxShadow: "var(--shadow-overlay)",
          backdropFilter: "blur(12px)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          const isMessages = href.includes("messagerie")

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                padding: "8px 16px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: isActive ? "var(--brand-primary-soft)" : "transparent",
                transition: "all var(--transition-fast)",
                position: "relative",
                textDecoration: "none",
                minWidth: "56px",
              }}
            >
              <div style={{ position: "relative" }}>
                <Icon
                  size={22}
                  style={{
                    color: isActive ? "var(--brand-primary)" : "var(--text-muted)",
                    transition: "color var(--transition-fast)",
                  }}
                />
                {isMessages && unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      backgroundColor: "var(--brand-danger)",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: 700,
                      borderRadius: "var(--radius-pill)",
                      minWidth: "16px",
                      height: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--brand-primary)" : "var(--text-muted)",
                  transition: "color var(--transition-fast)",
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Task 2 — Rewrite AppShell

Rewrite `dashboard-app/src/components/AppShell.tsx` to be the single layout container for all dashboard pages:

Requirements:
- On mobile (< 768px): shows TopBar + content + IslandNav (floating)
- On desktop (≥ 768px): shows fixed left sidebar + content
- Content area has correct padding to never be hidden behind nav
- SSE unread count is computed here and passed to IslandNav
- Business name shown in sidebar/topbar
- Dark/light toggle in both sidebar and topbar

The component should use CSS media queries via inline styles or Tailwind responsive classes. Structure:

```tsx
"use client"
// Mobile: TopBar + bottom padding for island nav
// Desktop: sidebar + main content
// Both: SSE listener for unread count
```

Read the existing AppShell carefully. Preserve the SSE unread logic but fix the event name to `message_created` (not `new_message`).

### Task 3 — Rewrite TopBar (mobile header)

Rewrite `dashboard-app/src/components/shell/TopBar.tsx`:

- Shows Répondly logo + business name on the left
- Shows notification bell (with badge if unread > 0) on the right
- Shows ThemeToggle button on the right
- Height: 56px
- Background: var(--surface-0) with border-bottom: 1px solid var(--surface-border)
- On scroll: add a subtle box-shadow

### Task 4 — Create desktop Sidebar component

Create `dashboard-app/src/components/shell/Sidebar.tsx`:

```tsx
// Fixed left sidebar, 240px wide
// Shows:
// - Répondly logo at top (20px padding)
// - Nav items (same 4 as IslandNav, vertical, with labels)
// - Active state: filled background with brand color
// - At bottom: business name + avatar + logout link
// Width: var(--shell-sidebar-width) = 240px
```

### Task 5 — Update dashboard layout.tsx

Open `dashboard-app/src/app/dashboard/layout.tsx`.

Replace the current layout shell with the new AppShell. Make sure:
- Auth check is preserved (read current layout and keep the auth guard)
- AppShell wraps all children
- No duplicate nav rendering

### Task 6 — Verify

1. Run the app. Check on mobile viewport (390px width) — island nav floats above content, all labels visible.
2. Check on desktop (1280px) — sidebar visible, main content starts at 240px left offset.
3. Navigate between all 4 sections — active state updates correctly.
4. Send a test message — unread badge appears on Messages nav item within 2 seconds.
5. Toggle dark mode — all nav elements respect the theme.
6. List every file created/modified.
```

---

## PROMPT 7 — Onboarding Wizard

```
You are a senior full-stack engineer building the onboarding wizard for Répondly. This is a 5-step flow that runs once for new clients and collects all the information needed to auto-generate their AI bot's system prompt.

## Design principles
- Mobile-first. Each step fits on one screen without scrolling where possible.
- Progress indicator at the top (step 1 of 5).
- "Suivant" (Next) button fixed at the bottom.
- No overwhelming forms. Max 4 fields per step.
- Non-technical language throughout. French/Darija mix is fine.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/prisma/schema.prisma (focus on: Business, BotConfig, Service, Schedule, ScheduleException, Faq, OnboardingStage models)
- dashboard-app/src/app/api/config/route.ts
- dashboard-app/src/app/api/schedules/route.ts (if exists)
- dashboard-app/src/app/api/services/route.ts (if exists)
- dashboard-app/src/lib/auth.ts
- dashboard-app/src/app/globals.css (design tokens)
- dashboard-app/src/components/ui/ (all component files from Prompt 1)
- bot/lib/promptBuilder.js (understand how the system prompt is built)
- bot/generatePrompt.js

## Your tasks

### Task 1 — Create the onboarding route

Create `dashboard-app/src/app/dashboard/onboarding/page.tsx` — the 5-step wizard page.

Also create `dashboard-app/src/app/dashboard/onboarding/layout.tsx` — a minimal layout (no AppShell nav, just the wizard fullscreen):

```tsx
// layout.tsx: fullscreen white layout, no sidebar, no bottom nav
// Shows only the Répondly logo at top-left and a "Se déconnecter" link
export default function OnboardingLayout({ children }) {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--surface-1)" }}>
      {children}
    </div>
  )
}
```

### Task 2 — Build the wizard state machine

In `dashboard-app/src/app/dashboard/onboarding/page.tsx`, build a client component with this state shape:

```ts
type OnboardingData = {
  // Step 1
  name: string
  sector: string  // e.g. "beauty", "medical", "coaching", "restaurant", "other"
  city: string
  phone: string
  language: "darija" | "french" | "mix"
  
  // Step 2
  services: Array<{ name: string; price: string; duration?: string }>
  
  // Step 3
  schedule: Record<"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun", { open: boolean; from: string; to: string }>
  
  // Step 4
  faqs: Array<{ question: string; active: boolean }>
  
  // Step 5
  botPersonality: "warm" | "professional" | "direct"
  botName: string
}
```

### Task 3 — Build each step as a sub-component

**Step 1 — Identité**
Fields: Business name, Sector (select with icons), City (text), Language preference (3 radio cards).
Sector options: 💅 Beauté & Soins | 🏥 Médical / Clinique | 📚 Éducation / Cours | 🍽️ Restaurant | 🏠 Immobilier | ✨ Autre

**Step 2 — Services & Tarifs**
A dynamic list. Each row: service name input + price input + delete button.
"+ Ajouter un service" button at bottom.
Pre-populate with 2 example rows based on selected sector (e.g. beauty → "Soin visage", "Manucure").
Min 1 service required to proceed.

**Step 3 — Horaires**
A 7-row grid (Mon–Sun). Each row:
- Day name (Mon, Mar, Mer, etc.)
- Toggle switch (open/closed)
- If open: two time pickers (from, to) — use `<input type="time">` styled to match design system
Default: Mon–Fri 9:00–18:00 open, Sat 10:00–17:00 open, Sun closed.

**Step 4 — Questions Fréquentes**
Show a pre-written list of FAQ toggles based on sector. Each FAQ has a question and a toggle (active/inactive).
Pre-written FAQs (all sectors):
- "Comment prendre rendez-vous ?"
- "Quels sont vos tarifs ?"  
- "Où êtes-vous situés ?"
- "Quels modes de paiement acceptez-vous ?"
- "Proposez-vous des forfaits ?"
- "Puis-je annuler ou reporter mon rendez-vous ?"
All toggled ON by default. They can toggle off.

**Step 5 — Personnalité du Bot**
3 large card options (full width, tappable):
- 😊 Chaleureux & Proche — "Le bot parle comme un ami de confiance"
- 💼 Professionnel — "Ton formel et rassurant"  
- ⚡ Concis & Direct — "Réponses courtes et efficaces"
Bot name field (optional): "Comment s'appelle votre assistant ?"
Placeholder: business name

### Task 4 — Progress indicator component

Create `dashboard-app/src/components/onboarding/ProgressBar.tsx`:

```tsx
// Shows 5 dots or a progress bar
// Current step highlighted with brand color
// Step labels: Identité | Services | Horaires | FAQs | Personnalité
// On mobile: compact pill progress (e.g. "Étape 2 sur 5")
// On desktop: labeled step indicators
```

### Task 5 — API route to save onboarding data

Create `dashboard-app/src/app/api/onboarding/complete/route.ts`:

```ts
// POST handler
// 1. Validate session (requireAuth)
// 2. Save Business fields (name, city, phone, businessType based on sector, defaultLanguage)
// 3. Save BotConfig (botName, botPersonality → maps to botMode, needsRegen: true)
// 4. Create Service records (delete existing first, create new batch)
// 5. Create Schedule records (upsert per day)
// 6. Create Faq records (active FAQs only)
// 7. Update OnboardingStage to mark onboarding complete
// 8. Trigger prompt regeneration by setting BotConfig.needsRegen = true
// Return: { success: true }
```

### Task 6 — Onboarding gate in dashboard layout

Open `dashboard-app/src/app/dashboard/layout.tsx`.

After the auth check, add an onboarding check:

```ts
// Check if business has completed onboarding
const business = await prisma.business.findUnique({
  where: { id: session.user.id },
  include: { onboardingStage: true }
})

// If onboarding not complete and not already on onboarding page, redirect
const onboardingComplete = business?.onboardingStage?.stage === "COMPLETE"
const isOnboardingPath = req.nextUrl?.pathname?.startsWith("/dashboard/onboarding")

if (!onboardingComplete && !isOnboardingPath) {
  redirect("/dashboard/onboarding")
}
```

### Task 7 — Verify

1. Create a fresh test account (or reset onboardingStage).
2. Log in — should redirect to /dashboard/onboarding.
3. Complete all 5 steps — should save to DB and redirect to /dashboard/accueil.
4. Log in again — onboarding should not show again.
5. Check BotConfig.needsRegen = true in DB after completion.
6. List every file created/modified.
```

---

## PROMPT 8 — Configuration Page Redesign

```
You are a senior full-stack engineer redesigning the Configuration page for Répondly. This page is used weekly by business owners to update their services, hours, exceptions, and bot behavior.

## Design principles
- 3 clear tabs: Mon Business | Bot & Réponses | Exceptions & Annonces
- Each tab is independently saveable (no giant "save all" button)
- Exceptions tab is the most important — must be dead simple
- All interactions optimistic (UI updates immediately, API confirms in background)

## Context (read before writing anything)

Read these files in full:
- dashboard-app/src/app/dashboard/configuration/page.tsx (full current implementation)
- dashboard-app/src/app/api/config/route.ts
- dashboard-app/src/app/api/schedules/route.ts (if exists, else note)
- dashboard-app/src/app/api/schedules/exceptions/route.ts (if exists, else note)
- dashboard-app/src/app/api/services/route.ts (if exists, else note)
- dashboard-app/src/app/api/products/route.ts
- dashboard-app/prisma/schema.prisma (focus on: ScheduleException, Faq, BotConfig, Service, Schedule)
- dashboard-app/src/components/ui/ (all from Prompt 1)
- dashboard-app/src/app/globals.css

## Your tasks

### Task 1 — Create API routes for missing endpoints

Check if these routes exist. If not, create them:

`dashboard-app/src/app/api/schedule-exceptions/route.ts`:
```ts
// GET: return all ScheduleExceptions for authenticated business, ordered by startDate
// POST: create new ScheduleException { type, label, message, startDate, endDate }
// Always scopes by session businessId (use requireAuth from Prompt 2)
```

`dashboard-app/src/app/api/schedule-exceptions/[id]/route.ts`:
```ts
// PATCH: update exception (verify ownership: exception.businessId === session.user.id)
// DELETE: delete exception (verify ownership)
```

`dashboard-app/src/app/api/faqs/route.ts`:
```ts
// GET: return all FAQs for business
// POST: create FAQ { question, answer, active }
// PUT: batch update (for toggling active/inactive)
```

### Task 2 — Rewrite configuration/page.tsx

Replace the full configuration page with a 3-tab layout:

```tsx
"use client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function ConfigurationPage() {
  return (
    <div style={{ padding: "0", maxWidth: "768px", margin: "0 auto" }}>
      <Tabs defaultValue="business">
        <TabsList style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          width: "100%",
          backgroundColor: "var(--surface-0)",
          borderBottom: "1px solid var(--surface-border)",
          borderRadius: 0,
          padding: "0 16px",
          height: "48px",
        }}>
          <TabsTrigger value="business">Mon Business</TabsTrigger>
          <TabsTrigger value="bot">Bot & Réponses</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
        </TabsList>
        <div style={{ padding: "16px" }}>
          <TabsContent value="business"><BusinessTab /></TabsContent>
          <TabsContent value="bot"><BotTab /></TabsContent>
          <TabsContent value="exceptions"><ExceptionsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
```

### Task 3 — Build BusinessTab component

Create `dashboard-app/src/components/configuration/BusinessTab.tsx`:

Sections (each with a save button):
1. **Informations générales**: name, phone, city, description (textarea)
2. **Services**: dynamic list (same builder as onboarding step 2) — add/edit/delete services
3. **Horaires**: 7-row schedule grid (same as onboarding step 3) — edit hours per day

Each section saves independently to its own API endpoint. Show a saving spinner then a green checkmark on success.

### Task 4 — Build BotTab component

Create `dashboard-app/src/components/configuration/BotTab.tsx`:

Sections:
1. **Bot actif/inactif**: large toggle switch with label "Votre bot répond automatiquement"
2. **Personnalité**: same 3-card selector from onboarding step 5
3. **Message d'accueil**: textarea — what the bot says to a new contact
4. **Comportement hors-horaires**: textarea — what the bot says outside business hours
5. **Transfert humain**: 
   - Phone number for handoff
   - Trigger keywords list (add/remove chips) — "annuler", "problème", "parler à quelqu'un", etc.
6. **Questions fréquentes**: same toggle list from onboarding step 4

Each section saves to BotConfig. On any change, set needsRegen: true automatically (user doesn't see this).

### Task 5 — Build ExceptionsTab component

Create `dashboard-app/src/components/configuration/ExceptionsTab.tsx`.

This is the most important tab. Build it as:

**Active exceptions list** (top):
```tsx
// List of active/upcoming exceptions as cards
// Each card shows: type icon + label + date range + edit/delete buttons
// Empty state: "Aucune exception active. Ajoutez une fermeture ou une annonce."
```

**+ Ajouter une exception button** (prominent, full-width):
Opens a bottom sheet (use `BottomSheet` component from ui/) with 4 type options:

**Type 1 — Fermeture exceptionnelle**
Form fields:
- Date(s): date range picker (start = end for single day)
- Message (auto-generated, editable): "Nous serons fermés le [date]. Nous serons ravis de vous accueillir à partir du [date+1]."

**Type 2 — Promotion / Offre spéciale**
Form fields:
- Titre: text input (e.g. "Promo -20% soins visage")
- Message: textarea (what the bot says when this service is mentioned)
- Valable du [date] au [date]

**Type 3 — Changement d'horaires temporaire**
Form fields:
- Période: date range
- Nouveaux horaires: from/to time inputs

**Type 4 — Message personnalisé**
Form fields:
- Titre
- Message complet (textarea)
- Période (optional)

Each form has a "Enregistrer" button that POSTs to /api/schedule-exceptions.

### Task 6 — Verify

1. Load /dashboard/configuration — 3 tabs visible, sticky.
2. Save a change in each tab — confirm it persists on page refresh.
3. Add a fermeture exceptionnelle exception — confirm it appears in the list.
4. Delete the exception.
5. Toggle bot active/inactive — confirm BotConfig.botActive changes in DB.
6. Run `npm run build` — 0 TypeScript errors.
7. List every file created/modified.
```

---

## PROMPT 9 — Accueil (Home) Page Redesign

```
You are a senior UI/UX engineer redesigning the home/accueil page for Répondly.

## Design principles
- This page is the "morning briefing" — what does the owner need to know RIGHT NOW?
- 3 zones: Today's pulse (stats) → Quick actions → Weekly trend
- Maximum 2 taps to reach anything from this page
- Cards are tappable and navigate somewhere meaningful
- No vanity metrics. Every number is actionable.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/src/app/dashboard/accueil/page.tsx
- dashboard-app/src/app/api/ (look for any stats or metrics routes)
- dashboard-app/prisma/schema.prisma (ConversationLog, ConversationStatus, Booking, Order)
- dashboard-app/src/components/ui/ (all from Prompt 1)
- dashboard-app/src/app/globals.css (design tokens)

## Your tasks

### Task 1 — Create the stats API

Create `dashboard-app/src/app/api/stats/today/route.ts`:

```ts
// GET — returns today's stats for the authenticated business
// Query:
// - messagesReceived: count of ConversationLog entries created today
// - botHandled: count where botEnabled = true  
// - pendingHuman: count where status = "open" and botEnabled = false (or handover triggered)
// - appointmentsToday: count of Booking entries where date = today and status != "cancelled"
// - unreadCount: count of conversations with no reply since last message
// Return shape:
// { messagesReceived, botHandled, botRate, pendingHuman, appointmentsToday, unreadCount }
```

Create `dashboard-app/src/app/api/stats/weekly/route.ts`:

```ts
// GET — returns message counts for the last 7 days
// Return: Array<{ date: string; count: number }> for the last 7 days
// Use ConversationLog createdAt grouped by day
```

### Task 2 — Rewrite accueil/page.tsx

Build the page as 3 clearly separated zones:

**Zone A — Today's Pulse** (4 stat cards in a 2x2 grid on mobile):

```tsx
// Card 1: Messages reçus today (total)
// Card 2: Gérés par le bot (count + percentage pill)
// Card 3: En attente de vous (count, RED if > 0, tappable → navigates to /messagerie?filter=pending)
// Card 4: Rendez-vous aujourd'hui (count, tappable → /rendez-vous)

// Each StatCard:
// - Large number (32px, bold, brand or danger color)
// - Label (12px, muted)
// - Optional trend (↑ vs yesterday)
// - Tap navigates to relevant section
```

**Zone B — Quick Actions** (2 full-width buttons):

```tsx
// Button 1: "🚫 Marquer fermé aujourd'hui"
// - If not yet marked: solid button, one tap, calls POST /api/schedule-exceptions with type=closure, today's date
// - If already marked: shows "Vous êtes marqué fermé aujourd'hui ✓" in success state with undo option
// - After tap: shows toast "Le bot informera vos clients que vous êtes fermés aujourd'hui"

// Button 2: "📢 Envoyer une annonce"
// - Opens a bottom sheet to compose a broadcast message (message text + optional service mention)
// - Saves as an active Exception of type "promo"
```

**Zone C — Weekly Trend** (bar chart):

```tsx
// Simple 7-bar chart: messages this week vs last week
// X axis: Mon, Mar, Mer, Jeu, Ven, Sam, Dim
// Y axis: message counts
// Current week bars: brand primary color
// Last week bars: muted/surface-2
// No library needed: build with CSS flexbox bars (height = % of max)
// Label above each bar: count (only show if > 0)
```

### Task 3 — Build the StatCard component

Create `dashboard-app/src/components/accueil/StatCard.tsx`:

```tsx
interface StatCardProps {
  value: number
  label: string
  sublabel?: string
  trend?: number  // positive or negative vs yesterday
  alert?: boolean  // if true, shows red/warning styling
  href?: string   // if provided, card is tappable
  icon?: React.ReactNode
}
```

### Task 4 — Build the QuickActionButton component

Create `dashboard-app/src/components/accueil/QuickActionButton.tsx`:

A large (56px height), full-width button with:
- Icon on left
- Label
- Optional success state (checkmark + different text)
- Loading state (spinner)
- Uses CSS transitions for state changes (not jarring)

### Task 5 — Build the WeeklyChart component

Create `dashboard-app/src/components/accueil/WeeklyChart.tsx`:

Pure CSS bar chart. No recharts or d3. Each bar is a div with height as a percentage of the week's max.
Animate bars on mount using CSS transitions (height from 0 to value).

### Task 6 — Add skeleton loading

The page should show skeleton cards while data loads. Use the SkeletonCard component from ui/. Show 4 skeleton cards in the stat grid, 2 skeleton buttons, and a skeleton chart.

### Task 7 — Verify

1. Load /dashboard/accueil — stats load and are accurate.
2. Tap "Fermé aujourd'hui" — bot confirms in next test message that business is closed.
3. Tap a stat card — navigates to correct filtered view.
4. Weekly chart shows bars with correct heights.
5. Page loads in < 1 second (check Network tab).
6. List every file created/modified.
```

---

## PROMPT 10 — Messagerie (Inbox) Complete Redesign

```
You are a senior UI/UX engineer rebuilding the messagerie (inbox) for Répondly. This is the most-used part of the app. It must feel native, fast, and real-time.

## Design requirements
- Inbox list: feels like WhatsApp/iMessage — avatar, name, last message preview, timestamp, unread badge
- Thread view: full-height chat, messages grouped by sender, smooth scroll to latest
- Bot messages visually distinct from owner messages and customer messages
- Handoff indicator clearly visible (red banner/card when bot needs human)
- Bot pause/resume toggle per conversation
- Real-time: new messages appear without any refresh
- Mobile: list and thread are separate full-screen views (standard mobile nav pattern)
- Desktop: split pane (list left 360px, thread right)

## Context (read before writing anything)

Read ALL of these files in full:
- dashboard-app/src/components/messagerie/ConversationList.tsx
- dashboard-app/src/components/messagerie/ConversationItem.tsx
- dashboard-app/src/components/messagerie/ChannelFilter.tsx
- dashboard-app/src/components/messagerie/SendBar.tsx
- dashboard-app/src/components/messagerie/MessageBubble.tsx
- dashboard-app/src/components/messagerie/ConversationTopBar.tsx
- dashboard-app/src/components/messagerie/ConversationSkeleton.tsx
- dashboard-app/src/app/dashboard/messagerie/page.tsx
- dashboard-app/src/app/dashboard/messagerie/[id]/page.tsx
- dashboard-app/src/app/api/chatwoot/conversations/route.ts
- dashboard-app/src/app/api/chatwoot/conversations/[id]/messages/route.ts (if exists)
- dashboard-app/src/lib/chatwoot.ts
- dashboard-app/src/lib/sse-broadcaster.ts (after Prompt 4 fixes)
- dashboard-app/src/components/ui/ (all from Prompt 1)
- dashboard-app/src/app/globals.css

## Your tasks

### Task 1 — Rebuild ConversationList

Rewrite `dashboard-app/src/components/messagerie/ConversationList.tsx`.

Requirements:
- Sticky filter bar at top with tabs: **Tous | En attente 🔴{n} | Bot actif | Archivés**
- Each conversation shows: channel icon (WhatsApp/FB/IG) + contact name + last message (truncated 40 chars) + relative timestamp + unread badge
- "En attente" (human handoff requested) conversations pinned to top with red left border
- Remove ALL polling. SSE only (from Prompt 4).
- Optimistic unread clearing: when user taps a conversation, mark it read immediately in local state, then confirm with API.
- Empty state per filter: "Aucun message en attente" with illustration/icon.

Filter logic:
```ts
// "En attente": conversations where status requires human (check ConversationStatus or ConversationLog)
// "Bot actif": conversations where bot is actively handling
// "Archivés": resolved/closed conversations
```

### Task 2 — Rebuild ConversationItem

Rewrite `dashboard-app/src/components/messagerie/ConversationItem.tsx`:

```tsx
interface ConversationItemProps {
  id: string
  contactName: string
  channel: "whatsapp" | "facebook" | "instagram"
  lastMessage: string
  timestamp: Date
  unreadCount: number
  needsHuman: boolean  // shows red indicator
  botActive: boolean
  isActive: boolean  // currently selected (desktop split pane)
}
```

Channel icons: use channel-specific colors (WhatsApp green, FB blue, IG gradient-to-solid pink).

### Task 3 — Rebuild the thread view

Rewrite `dashboard-app/src/app/dashboard/messagerie/[id]/page.tsx`.

Structure:
```
[ConversationTopBar]           ← contact name + channel + bot toggle
[Handoff banner - if needed]   ← "Ce client a demandé à parler à quelqu'un"  
[Message list]                 ← scrollable, full height
[SendBar]                      ← sticky at bottom
```

Message groups: consecutive messages from the same sender are grouped (no repeated avatar). Show timestamp at top of each group.

Message bubble styling:
- Customer messages: left-aligned, surface-1 background
- Owner/agent messages: right-aligned, brand-primary background, white text
- Bot messages: right-aligned, brand-primary-soft background, brand-primary text, small "🤖 Bot" label

**Handoff banner** (shows when needsHuman = true):
```tsx
<div style={{
  backgroundColor: "var(--brand-danger-soft)",
  border: "1px solid var(--brand-danger)",
  borderRadius: "var(--radius-md)",
  padding: "12px 16px",
  margin: "8px 16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
}}>
  <AlertCircle color="var(--brand-danger)" size={16} />
  <span style={{ fontSize: "13px", color: "var(--brand-danger)", fontWeight: 500 }}>
    Ce client a demandé à parler à un humain
  </span>
  <button style={{ marginLeft: "auto" }}>Prendre en charge</button>
</div>
```

### Task 4 — Rebuild SendBar

Rewrite `dashboard-app/src/components/messagerie/SendBar.tsx`:

```tsx
// Auto-resizing textarea (1 to 4 rows)
// Send button: icon-only on mobile, with label on desktop
// When bot is active: show "Le bot répond automatiquement" notice + "Répondre manuellement" button
// When replying manually: bot pauses for this conversation (call API to set botEnabled = false)
// Keyboard aware: on mobile, SendBar lifts above keyboard (use CSS env(keyboard-inset-height) or fixed positioning)
```

### Task 5 — Bot toggle per conversation

In `ConversationTopBar`, add a bot toggle:

```tsx
// Toggle: "Bot actif ●" / "Bot en pause ○"
// On toggle: PATCH /api/chatwoot/conversations/{id}/bot-mode { botEnabled: boolean }
// Visual: when paused, show orange dot + "Bot en pause"
```

Create the API route `dashboard-app/src/app/api/chatwoot/conversations/[id]/bot-mode/route.ts`:
```ts
// PATCH: update ConversationLog.botEnabled for this conversation
// Verify conversation belongs to authenticated business
```

### Task 6 — Desktop split pane layout

In `dashboard-app/src/app/dashboard/messagerie/page.tsx`, build responsive split pane:

```tsx
// Mobile (< 768px):
// - /messagerie shows list fullscreen
// - /messagerie/[id] shows thread fullscreen (back button to list)

// Desktop (≥ 768px):
// - Both visible: left pane 360px fixed, right pane fills remaining
// - Selecting a conversation updates right pane without navigation
// - If no conversation selected: right pane shows empty state "Sélectionnez une conversation"
```

### Task 7 — Real-time updates

Confirm (from Prompt 4 fixes):
- New messages appear in thread via SSE without refresh
- New conversations appear in list via SSE without refresh
- Unread badge in nav (IslandNav from Prompt 6) updates in real time

If SSE events aren't structured correctly for the messagerie UI, add the right data to the broadcaster:

```ts
// On message_created event, include: conversationId, messageContent, senderType, timestamp
// On conversation_updated event, include: conversationId, status, unreadCount
```

### Task 8 — Verify

1. Open messagerie on mobile — list shows all conversations with correct styling.
2. Tap a conversation — thread opens, messages render correctly.
3. Send a test message from WhatsApp — appears in thread within 2 seconds (SSE, no refresh).
4. Bot replies — bot message shows with 🤖 label.
5. Desktop: split pane works, selecting a conversation updates right pane.
6. Handoff banner appears when needsHuman = true.
7. Bot toggle pauses/resumes bot per conversation.
8. Run `npm run build` — 0 errors.
9. List every file created/modified.
```

---

## PROMPT 11 — Rendez-vous Section

```
You are a senior full-stack engineer building the Rendez-vous (appointments) section for Répondly. This replaces the old "Commandes" section.

## Context (read before writing anything)

Read these files in full:
- dashboard-app/src/app/dashboard/commandes/page.tsx (current implementation to understand what exists)
- dashboard-app/prisma/schema.prisma (Booking, Order, ConversationLog models)
- dashboard-app/src/app/api/ (look for any booking or order routes)
- dashboard-app/src/components/ui/ (all from Prompt 1)
- dashboard-app/src/app/globals.css

## Your tasks

### Task 1 — Create the rendez-vous route

Create the directory `dashboard-app/src/app/dashboard/rendez-vous/`.
Create `dashboard-app/src/app/dashboard/rendez-vous/page.tsx`.

Update all navigation references:
- IslandNav (Prompt 6): already uses /rendez-vous — confirm it's correct
- AppShell sidebar: update href if needed
- Update any redirects from /commandes to /rendez-vous

### Task 2 — Create booking API routes

Create `dashboard-app/src/app/api/bookings/route.ts`:
```ts
// GET: return all bookings for business, with optional query params:
//   ?date=2026-06-01 (filter by date)
//   ?status=confirmed|pending|cancelled
// Returns: Array<Booking & { service: Service; client: Client }>
```

Create `dashboard-app/src/app/api/bookings/[id]/route.ts`:
```ts
// PATCH: update booking status (confirmed/cancelled)
// Must verify booking.businessId === session.user.id
```

### Task 3 — Build the page with 2 view modes

Toggle between **Agenda (calendar)** and **Liste** views.

**Liste view** (default on mobile):
```tsx
// Grouped by date: "Aujourd'hui", "Demain", "Mercredi 4 juin", etc.
// Each booking card:
//   - Time (e.g. "10:00")
//   - Service name + client name
//   - Channel badge (WhatsApp/IG)
//   - Status badge (Confirmé / En attente / Annulé)
//   - Tap: opens booking detail sheet
```

**Agenda view** (default on desktop):
```tsx
// A simple weekly calendar grid (Mon–Sun × time slots)
// Each booking appears as a colored block in the correct time slot
// Color by status: confirmed = brand-success, pending = brand-warning, cancelled = muted
// Tap a booking block: opens booking detail sheet
```

### Task 4 — Build BookingDetailSheet

Create `dashboard-app/src/components/rendez-vous/BookingDetailSheet.tsx`:

Opens as a bottom sheet (mobile) or dialog (desktop).

Shows:
- Client name + channel
- Service + price
- Date + time
- Status with dropdown to change
- "Voir la conversation" button → navigates to /messagerie/{conversationId}
- Cancel button (with confirmation)

### Task 5 — Empty states

```tsx
// No bookings today: "Aucun rendez-vous aujourd'hui 🎉"
// No bookings at all: 
//   "Vos rendez-vous pris via WhatsApp apparaîtront ici"
//   + "Assurez-vous que la prise de rendez-vous est activée dans Configuration"
```

### Task 6 — Update commandes redirect

Add a redirect from old route:
Create `dashboard-app/src/app/dashboard/commandes/page.tsx` (replace existing):
```tsx
import { redirect } from "next/navigation"
export default function CommandesPage() {
  redirect("/dashboard/rendez-vous")
}
```

### Task 7 — Verify

1. Navigate to /dashboard/commandes — should redirect to /rendez-vous.
2. Rendez-vous page loads, shows bookings in list view.
3. Switch to agenda view — bookings appear in correct time slots.
4. Tap a booking — detail sheet opens.
5. Change status — updates in list/calendar immediately (optimistic).
6. "Voir la conversation" — navigates to correct messagerie thread.
7. List every file created/modified.
```

---

## PROMPT 12 — Bot Prompt Engine Upgrade

```
You are a senior AI/backend engineer upgrading the Répondly bot's prompt engine.

## Context (read before writing anything)

Read these files in full:
- bot/lib/promptBuilder.js (full file)
- bot/generatePrompt.js (full file)
- bot/index.js (full file — focus on getAIReply, webhook handler, handover logic)
- bot/lib/handoverManager.js (full file)
- bot/lib/languageDetector.js (full file)
- dashboard-app/prisma/schema.prisma (Business, BotConfig, ScheduleException, Service, Faq, Schedule models — after Prompt 3 unification)

## Known bugs to fix (from audit)

1. Handover uses `business.accountId` but field is `business.chatwootAccountId` — fix everywhere
2. ConversationLog upsert uses composite key that may not exist — verify after Prompt 3
3. History limited to 6 messages and 500 chars — evaluate if sufficient, document reasoning

## Your tasks

### Task 1 — Fix handover bug

In `bot/index.js` and `bot/lib/handoverManager.js`:
Search for every reference to `business.accountId` or `{ accountId }` destructured from business.
Replace all with `business.chatwootAccountId`.

Also check for `chatwootApiToken` vs `apiToken` inconsistencies — fix all to use `business.chatwootApiToken`.

### Task 2 — Upgrade promptBuilder.js

Rewrite `bot/lib/promptBuilder.js` to build a structured, injection-ready system prompt:

```js
function buildSystemPrompt(business, activeExceptions = []) {
  const { botConfig, services, schedules, faqs, name } = business
  
  // 1. IDENTITY block
  // 2. SERVICES block (from services array)
  // 3. SCHEDULE block (from schedules array, formatted as human-readable)
  // 4. EXCEPTIONS block (injected dynamically — active exceptions only)
  // 5. FAQ block (active FAQs only)
  // 6. RULES block (handover triggers, language, tone)
  
  return [identity, services, schedule, exceptions, faq, rules].join('\n\n---\n\n')
}
```

**IDENTITY block** (based on botConfig.botPersonality):
```
warm:         "Tu es ${botName}, l'assistant de ${businessName}. Tu parles comme un ami de confiance — chaleureux, naturel, en darija/français selon le client."
professional: "Tu es ${botName}, l'assistant officiel de ${businessName}. Tu réponds de façon professionnelle et rassurante."
direct:       "Tu es ${botName} pour ${businessName}. Sois concis et direct. Réponds en 1-2 phrases maximum."
```

**SERVICES block**:
```
Format: "Services disponibles:\n" + services.map(s => `- ${s.name}: ${s.price} DT`).join('\n')
If no services: omit block
```

**SCHEDULE block**:
```
Convert schedule records to: "Horaires: Lun–Ven 9h–18h, Sam 10h–17h, Dim fermé"
Detect alwaysOpen flag: if true, write "Ouvert 24h/24, 7j/7"
```

**EXCEPTIONS block** (this is the key injection):
```js
function buildExceptionsBlock(activeExceptions) {
  if (!activeExceptions.length) return ''
  
  return 'EXCEPTIONS ACTIVES AUJOURD\'HUI:\n' + activeExceptions.map(ex => {
    if (ex.type === 'closure') 
      return `- FERMÉ du ${ex.startDate} au ${ex.endDate}. ${ex.message}`
    if (ex.type === 'promo')
      return `- PROMOTION active: ${ex.label}. ${ex.message} Valable jusqu\'au ${ex.endDate}.`
    return `- ${ex.label}: ${ex.message}`
  }).join('\n')
}
```

**RULES block** (always present):
```
- Ne jamais inventer un service ou un prix qui n'est pas dans la liste.
- Ne jamais confirmer un rendez-vous sur une date marquée comme FERMÉ.
- Si tu ne sais pas répondre: dis "${handoverMessage}" et termine ta réponse par [HANDOVER].
- Handover keywords: ${triggers.join(', ')} — si le client dit l'un de ces mots, réponds et ajoute [HANDOVER] à la fin.
- Réponds dans la même langue que le client (darija / français / arabe).
- Maximum 3 phrases par réponse sauf si le client pose plusieurs questions.
```

### Task 3 — Dynamic exception injection at runtime

In `bot/index.js`, in the webhook handler, BEFORE calling getAIReply():

```js
// Fetch active exceptions for today
const today = new Date()
const activeExceptions = await prisma.scheduleException.findMany({
  where: {
    businessId: business.id,
    startDate: { lte: today },
    endDate: { gte: today },
  }
})

// Build prompt with injected exceptions (don't use stored systemPrompt if exceptions exist)
const systemPrompt = buildSystemPrompt(business, activeExceptions)
```

This means exceptions are always fresh — no need to regenerate and store the full prompt when an exception is added.

### Task 4 — Improve handover detection

In `getAIReply()` or the post-processing step, detect the [HANDOVER] tag:

```js
async function getAIReply(messages, systemPrompt) {
  const response = await groq.chat.completions.create({ ... })
  const text = response.choices[0]?.message?.content || ''
  
  const needsHandover = text.includes('[HANDOVER]')
  const cleanText = text.replace('[HANDOVER]', '').trim()
  
  return { text: cleanText, needsHandover }
}
```

Update the webhook handler to use the new return shape and trigger handover if needsHandover is true.

### Task 5 — Language detector improvement

Read `bot/lib/languageDetector.js`. 

Add darija-specific detection patterns. Darija mixes Arabic script, Latin, and numbers-as-letters (3, 7, 9). Common patterns:

```js
const darijaPatterns = [
  /\b(chno|kifesh|wesh|bghit|labess|mlih|w9t|wa9t|3ndk|m3k|feen|win|kif)\b/i,
  /\b(chhal|bezzaf|qalil|barcha|bhi|mabrouk|yosser)\b/i,
  // numbers used as letters in Arabic transliteration
  /[357938]/,
]
```

Return `{ language: 'darija' | 'french' | 'arabic' | 'unknown', confidence: number }`.

### Task 6 — Increase context window intelligently

Currently: 6 messages, 500 chars max input.

Update constants in bot/index.js:
```js
const MAX_HISTORY = 10       // was 6
const MAX_INPUT_CHARS = 800  // was 500
const MAX_REPLY_TOKENS = 250 // was 180 — allow slightly longer replies for complex questions
```

Document why these values were chosen in a comment.

### Task 7 — Verify

1. Send a test message via WhatsApp. Bot replies correctly with right language.
2. Add a closure exception via the dashboard (Prompt 8). Send a message asking for an appointment on that day. Bot should decline with the closure message.
3. Send "annuler" — bot should reply and handover to human.
4. Check dashboard — conversation should show handoff banner (from Prompt 10).
5. List every file modified.
```

---

## PROMPT 13 — Performance, Error Handling & Observability

```
You are a senior engineer doing a final pass on Répondly's dashboard-app and bot for production readiness.

## Context (read before writing anything)

Read these files:
- dashboard-app/src/app/layout.tsx
- dashboard-app/src/app/dashboard/layout.tsx
- dashboard-app/src/app/globals.css
- dashboard-app/next.config.ts
- bot/index.js
- All files in dashboard-app/src/app/ (check for missing error.tsx files)
- dashboard-app/src/components/ui/LoadingScreen.tsx

## Your tasks

### Task 1 — Add error boundaries (error.tsx)

Create `dashboard-app/src/app/dashboard/error.tsx`:

```tsx
"use client"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60dvh",
      gap: "16px",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "40px" }}>⚠️</div>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
        Une erreur s'est produite
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "320px" }}>
        Quelque chose s'est mal passé. Veuillez réessayer.
      </p>
      <Button onClick={reset} variant="outline">Réessayer</Button>
    </div>
  )
}
```

Create the same pattern for:
- `dashboard-app/src/app/dashboard/messagerie/error.tsx`
- `dashboard-app/src/app/dashboard/configuration/error.tsx`

### Task 2 — Add loading.tsx skeletons

Create `dashboard-app/src/app/dashboard/accueil/loading.tsx`:
```tsx
// Shows 4 skeleton stat cards + 2 skeleton buttons + skeleton chart
// Uses SkeletonCard from ui/
```

Create `dashboard-app/src/app/dashboard/messagerie/loading.tsx`:
```tsx
// Shows 5 ConversationSkeleton items
```

Create `dashboard-app/src/app/dashboard/configuration/loading.tsx`:
```tsx
// Shows skeleton tabs + skeleton form fields
```

Create `dashboard-app/src/app/dashboard/rendez-vous/loading.tsx`:
```tsx
// Shows skeleton booking cards
```

### Task 3 — Not-found page

Create `dashboard-app/src/app/not-found.tsx`:

```tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{ /* centered, full height */ }}>
      <div style={{ fontSize: "64px" }}>404</div>
      <h1>Page introuvable</h1>
      <p>Cette page n'existe pas.</p>
      <Link href="/dashboard/accueil">Retour à l'accueil</Link>
    </div>
  )
}
```

### Task 4 — Structured logging for bot

In `bot/index.js`, replace all `console.log` calls with a structured logger:

```js
const log = {
  info:  (msg, data = {}) => console.log(JSON.stringify({ level: 'info',  ts: new Date().toISOString(), msg, ...data })),
  warn:  (msg, data = {}) => console.log(JSON.stringify({ level: 'warn',  ts: new Date().toISOString(), msg, ...data })),
  error: (msg, data = {}) => console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, ...data })),
}

// Replace: console.log('Bot received message') 
// With:    log.info('webhook_received', { inboxId, conversationId })
```

Key events to log:
- `webhook_received` with inboxId, conversationId
- `business_resolved` with businessId
- `ai_reply_sent` with businessId, conversationId, replyLength
- `handover_triggered` with businessId, conversationId, reason
- `groq_error` with error message
- `chatwoot_error` with endpoint, status

### Task 5 — Next.js performance optimizations

In `dashboard-app/next.config.ts`, add:

```ts
const config: NextConfig = {
  // existing config...
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
}
```

### Task 6 — API response time headers

Create `dashboard-app/src/lib/timing.ts`:

```ts
export function withTiming(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const start = Date.now()
    const res = await handler(req)
    const duration = Date.now() - start
    res.headers.set("X-Response-Time", `${duration}ms`)
    return res
  }
}
```

Wrap the 3 most critical API routes with this: /api/chatwoot/conversations, /api/stats/today, /api/sse.

### Task 7 — Health check endpoint

Create `dashboard-app/src/app/api/health/route.ts`:

```ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: "ok",
      ts: new Date().toISOString(),
      db: "connected",
    })
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 })
  }
}
```

Create `bot/routes/health.js` (similar pattern checking DB + Groq connectivity).

Add to nginx.conf:
```nginx
location /health {
  proxy_pass http://localhost:3004/api/health;
}
```

### Task 8 — Final build verification

1. Run `npm run build` in dashboard-app — must complete with 0 errors, 0 TypeScript errors.
2. Run `npm run build` equivalent in bot (or node --check).
3. Check bundle sizes in .next/analyze (add `ANALYZE=true npm run build` if bundle-analyzer is installed).
4. List every file created/modified.
5. Write a final `CHANGES.md` in the repo root summarizing all 13 prompts' changes at a high level — what was changed, why, and what each major system does now.
```

---

## Execution Summary

| # | Prompt | Scope | Dependencies |
|---|--------|-------|--------------|
| 0 | Codebase Audit | Read-only analysis | — |
| 1 | Design System | globals.css tokens, shadcn/ui, primitives | — |
| 2 | Security | IDOR, API auth, webhook HMAC, rate limiting | 1 |
| 3 | Schema Unification | Prisma schema merge, bug fixes, migrations | — |
| 4 | SSE & Real-time | Nginx, broadcaster, remove polling | 2 |
| 5 | PWA Upgrade | manifest, sw.js, install prompt, iOS meta | 1 |
| 6 | AppShell & Nav | IslandNav, Sidebar, TopBar, responsive shell | 1, 4 |
| 7 | Onboarding Wizard | 5-step flow, auto-prompt generation | 1, 2, 3, 6 |
| 8 | Configuration | 3-tab config, exceptions builder | 1, 2, 3, 6 |
| 9 | Accueil Home | Stats, quick actions, weekly chart | 1, 2, 3, 4, 6 |
| 10 | Messagerie | Inbox rebuild, thread, bot toggle, split pane | 1, 2, 4, 6 |
| 11 | Rendez-vous | Replace commandes, calendar+list, booking detail | 1, 2, 3, 6 |
| 12 | Bot Engine | Prompt builder, exception injection, handover fix | 3 |
| 13 | Performance & Observability | Error boundaries, loading states, logging, health | All |

**Total: 13 prompts. Run in order. Each is a separate agent chat.**
```
