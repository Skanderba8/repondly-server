# Repondly — Full Project README

> **Paste this file at the start of any AI chat to continue building with full context.**
> Last updated: April 2026

---

## What is Repondly?

Repondly is a **SaaS platform for Tunisian SMBs** that automates customer messaging across WhatsApp, Instagram, Facebook, and Email. The business model is **B2B subscription** — businesses sign up, connect their channels, and Repondly handles automated replies, routing, and follow-ups on their behalf.

**Target market:** Small to medium businesses in Tunisia — Arabic, French, Darija speakers.

**Core value prop:** One inbox for all channels, smart auto-replies, no-code automation rules, client CRM, and a bot that never sleeps.

---

## High-Level Architecture

```
Internet
  │
  ▼
Nginx (reverse proxy, SSL termination)
  ├── repondly.com / www.repondly.com  ──────────► marketing-site     :3005
  └── app.repondly.com / inbox.repondly.com
        ├── /admin/*                  ──────────► admin-internal      :3006
        ├── /api/admin/*              ──────────► admin-internal      :3006
        ├── /bot/*                    ──────────► bot (Node.js)       :3001
        ├── /chatwoot-webhook         ──────────► bot (Node.js)       :3001
        └── /*  (everything else)     ──────────► dashboard-app       :3004

Chatwoot (Docker)                                                      :3000
  └── internal only — not exposed to Nginx directly
      (bot and dashboard call it via http://127.0.0.1:3000)

n8n (Docker)                                                           :5678
  └── internal only — automation workflows

PostgreSQL                                                             :5433
  └── shared DB — used by dashboard-app and admin-internal via Prisma
```

---

## Repository Structure

This is a **monorepo**. All services live in one repo, deployed on a single VPS.

```
repondly-server/
├── marketing-site/        # Public-facing website (repondly.com)
├── dashboard-app/         # Client-facing Next.js app (app.repondly.com)
├── admin-internal/        # Internal admin panel (app.repondly.com/admin)
├── bot/                   # Node.js automation/webhook engine (:3001)
├── chatwoot/              # Docker Compose for self-hosted Chatwoot
├── n8n/                   # Docker Compose for self-hosted n8n
├── nginx.conf             # Nginx reverse proxy config (source of truth)
└── README.md              # This file
```

---

## Services & Ports

| Service | Stack | Port | Process Manager | URL |
|---|---|---|---|---|
| `marketing-site` | Next.js 15, TypeScript | 3005 | PM2 | `repondly.com` |
| `dashboard-app` | Next.js 15, TypeScript | 3004 | PM2 | `app.repondly.com` |
| `admin-internal` | Next.js 15, TypeScript | 3006 | PM2 | `app.repondly.com/admin` |
| `bot` | Node.js 20, JavaScript | 3001 | PM2 | `app.repondly.com/bot/` |
| `chatwoot` | Ruby on Rails, Docker | 3000 | Docker Compose | Internal only |
| `n8n` | Node.js, Docker | 5678 | Docker Compose | Internal only |
| `postgresql` | PostgreSQL 16 | 5433 | systemd | `127.0.0.1:5433` |

---

## Domains & Routing

| Domain | Routes to | Notes |
|---|---|---|
| `repondly.com` | `marketing-site` :3005 | Public marketing + legal pages |
| `www.repondly.com` | `marketing-site` :3005 | Same as above |
| `app.repondly.com` | `dashboard-app` :3004 | Client dashboard |
| `app.repondly.com/admin` | `admin-internal` :3006 | Internal Repondly staff only |
| `app.repondly.com/api/admin/*` | `admin-internal` :3006 | Admin API routes |
| `app.repondly.com/bot/` | `bot` :3001 | Bot REST endpoints |
| `app.repondly.com/chatwoot-webhook` | `bot` :3001 | Chatwoot fires webhooks here |
| `inbox.repondly.com` | same as `app.repondly.com` | Alias — same SSL cert block |

**HTTP → HTTPS:** All HTTP traffic on port 80 is redirected 301 to HTTPS.

**Static asset routing trick:** Nginx uses a `map` on `$http_referer` to route `/_next/` static files to either `:3004` (dashboard) or `:3006` (admin) depending on which app the request came from.

---

## Infrastructure

| Component | Details |
|---|---|
| VPS | Linux VPS — IP `157.173.102.140` |
| OS | Ubuntu 24.04 |
| Reverse Proxy | Nginx 1.24.0 |
| SSL | Let's Encrypt via Certbot |
| Process Manager | PM2 (for all Node.js/Next.js apps) |
| Containers | Docker + Docker Compose (Chatwoot, n8n) |

**SSL certificates:**
- `repondly.com` uses `/etc/letsencrypt/live/repondly.com-0001/`
- `app.repondly.com` / `inbox.repondly.com` uses `/etc/letsencrypt/live/repondly.com/`

---

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Frontend + API | Next.js | 15.x |
| Language | TypeScript | — |
| Styling | Tailwind CSS | — |
| Auth | NextAuth.js (next-auth) | 5.0.0-beta.31 |
| ORM | Prisma | 7.x |
| DB Driver | `@prisma/adapter-pg` + `pg` | — |
| Password hashing | `bcryptjs` | — |
| Database | PostgreSQL | 16.x (port 5433) |
| Bot engine | Node.js | 20.x |
| Process manager | PM2 | latest |
| Chatwoot | Self-hosted open-source | Docker |
| n8n | Self-hosted open-source | Docker |
| Nginx | 1.24.0 | Ubuntu package |
| SSL | Let's Encrypt / Certbot | — |

---

## Service Details

### `marketing-site` — Public Website (:3005)

**Purpose:** Public-facing marketing website and legal pages.

```
marketing-site/src/app/
├── page.tsx                   # Landing page (repondly.com)
├── layout.tsx                 # Root layout
├── privacy/page.tsx           # Privacy policy
├── terms/page.tsx             # Terms of service
├── sla/page.tsx               # SLA page
├── api/
│   └── contact/route.ts       # POST /api/contact — contact form handler
└── components/
    └── LegalShell.tsx         # Shared wrapper for legal pages
```

**Libs:**
- `LangContext.tsx` — language switching context (Arabic/French)
- `i18n.ts` — translation strings

No auth, no DB connection. Static/semi-static Next.js app.

---

### `dashboard-app` — Client Dashboard (:3004)

**Purpose:** The app that paying clients use. Connects their channels, views conversations, manages their inbox and automation.

```
dashboard-app/src/app/
├── page.tsx                            # Root redirect
├── layout.tsx
├── auth/
│   └── signin/page.tsx                 # Sign in page
├── dashboard/
│   ├── layout.tsx                      # Dashboard shell layout
│   ├── DashboardShell.tsx              # Sidebar + navigation
│   ├── page.tsx                        # Dashboard home
│   └── messagerie/page.tsx             # Messaging/inbox view
└── api/
    ├── auth/
    │   ├── [...nextauth]/route.ts       # NextAuth handler
    │   └── meta/
    │       ├── connect/route.ts         # POST — start Meta OAuth flow
    │       └── callback/route.ts        # GET — Meta OAuth callback
    ├── chatwoot/
    │   ├── conversations/route.ts       # GET — list conversations
    │   ├── messages/[id]/route.ts       # GET/POST — conversation messages
    │   └── status/route.ts             # GET — Chatwoot health
    ├── whatsapp/
    │   ├── status/route.ts             # GET — WhatsApp connection status
    │   └── disconnect/route.ts         # POST — disconnect WhatsApp
    └── internal/
        └── bot-event/route.ts          # POST — receive events from bot
```

**Auth:** NextAuth v5 (JWT sessions, credentials provider + Meta OAuth).

**DB:** Prisma → PostgreSQL :5433 (same DB as admin-internal).

---

### `admin-internal` — Internal Admin Panel (:3006)

**Purpose:** Internal Repondly staff tool. Manage clients, onboarding, billing, bot config, n8n workflows, Chatwoot accounts, access control, and database operations.

**Access:** `app.repondly.com/admin` — protected by separate admin auth.

```
admin-internal/src/app/
├── admin/
│   ├── page.tsx                        # Overview / dashboard
│   ├── OverviewClient.tsx
│   ├── layout.tsx                      # Admin shell layout
│   ├── clients/
│   │   ├── page.tsx                    # Clients list
│   │   ├── ClientsHeader.tsx
│   │   ├── new/page.tsx                # Create new client
│   │   └── [id]/page.tsx              # Client detail page
│   ├── onboarding/
│   │   ├── page.tsx                    # Onboarding flow
│   │   └── OnboardingClient.tsx
│   ├── billing/page.tsx                # Billing management
│   ├── bot/page.tsx                    # Bot config + events
│   ├── n8n/page.tsx                    # n8n workflow management
│   ├── chatwoot/page.tsx               # Chatwoot account management
│   ├── access/page.tsx                 # Access control (admin users)
│   ├── database/page.tsx               # DB management + migrations
│   └── system/page.tsx                 # System status
└── api/admin/
    ├── clients/
    │   ├── route.ts                    # GET list, POST create
    │   └── [id]/
    │       ├── route.ts                # GET, PATCH, DELETE client
    │       ├── notes/route.ts          # POST note on client
    │       ├── stage/route.ts          # PATCH client stage (kanban)
    │       └── sync/route.ts           # POST sync client to Chatwoot
    ├── access/
    │   ├── route.ts                    # GET/POST admin access entries
    │   └── [id]/route.ts              # PATCH/DELETE access entry
    ├── auto-rules/[id]/route.ts        # PATCH/DELETE automation rule
    ├── badges/route.ts                 # GET dashboard badge counts
    ├── bot/
    │   ├── events/route.ts             # GET recent bot events
    │   └── restart/route.ts            # POST restart bot via PM2
    ├── chatwoot/route.ts               # GET/POST Chatwoot account mgmt
    ├── n8n/
    │   ├── route.ts                    # GET/POST n8n workflows
    │   └── [id]/route.ts              # PATCH/DELETE workflow
    ├── database/
    │   ├── route.ts                    # GET DB stats
    │   └── migrate/route.ts            # POST run migrations
    └── system/route.ts                 # GET system health/info
```

**Key admin UI components:**
- `KanbanBoard.tsx` — drag-and-drop client pipeline
- `ClientsTable.tsx` — searchable client list
- `AccessManager.tsx` — admin user permissions
- `DatabaseManager.tsx` — DB health + migration trigger
- `N8nPanel.tsx` — n8n workflow control
- `ChatwootPanel.tsx` — Chatwoot account management
- `RoutingMap.tsx` — visual routing overview

---

### `bot` — Automation Engine (:3001)

**Purpose:** Node.js webhook receiver and automation engine. Sits between Chatwoot and the outside world.

```
bot/
├── index.js          # Main entry — HTTP server, webhook handler, auto-reply logic
├── index_backup.js   # Backup/previous version
├── conversations.json # Local state cache (conversations)
└── package.json
```

**What it does:**
- Receives `POST /chatwoot-webhook` from Chatwoot when a message arrives
- Evaluates AutoRules from the DB (keyword match, channel, trigger type)
- Sends auto-replies back to Chatwoot via internal REST API (`http://127.0.0.1:3000/api/v1/...`)
- Exposes `GET /bot/` health endpoint
- Can be restarted remotely via `POST /api/admin/bot/restart` from admin-internal

---

### `chatwoot` — Self-Hosted Inbox

**Purpose:** Open-source omnichannel inbox. Handles all inbound messages from WhatsApp, Instagram, Facebook, Email. Fires webhook events to the bot.

- Runs via `docker-compose.yml` in `/chatwoot/`
- Accessible internally at `http://127.0.0.1:3000`
- **Not exposed directly through Nginx** (Chatwoot's own web UI is NOT customer-facing)
- Key internal API endpoints used by the bot and dashboard:

```
POST /api/v1/accounts/:id/conversations/:convId/messages   # send message
PATCH /api/v1/accounts/:id/conversations/:convId           # update status
GET  /api/v1/accounts/:id/contacts                         # list contacts
GET  /api/v1/accounts/:id/conversations                    # list conversations
```

---

### `n8n` — Workflow Automation

- Runs via `docker-compose.yml` in `/n8n/`
- Internal use only — managed via `admin-internal` n8n panel
- Used for scheduled automations, advanced workflow triggers, external integrations

---

## Database

**PostgreSQL 16** — port `5433` (non-standard, intentional)

```
Host:     127.0.0.1
Port:     5433
User:     repondly_user
Database: repondly
```

Shared between `dashboard-app` and `admin-internal`. Both use Prisma v7 with `@prisma/adapter-pg`.

**Prisma config location:** `prisma.config.ts` (root of each Next.js app) + `prisma/schema.prisma`

**Key models** (from schema.prisma, both apps share the same DB):

| Model | Description |
|---|---|
| `Business` | One account per client business — email, passwordHash, Chatwoot account ID + token, plan |
| `Client` | Contacts/leads belonging to a business, linked to Chatwoot contact ID |
| `AutoRule` | Automation rules — trigger, conditions (JSON), action, response template |
| `Reminder` | Scheduled messages to clients |
| `Booking` | Appointments with calendar sync |
| Admin models | Access control, onboarding state, etc. (admin-internal only) |

---

## Environment Variables

### `dashboard-app/.env`
```env
DATABASE_URL="postgresql://repondly_user:<password>@127.0.0.1:5433/repondly"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="https://app.repondly.com"
CHATWOOT_BASE_URL="http://127.0.0.1:3000"
CHATWOOT_API_TOKEN="<agent token from chatwoot>"
META_APP_ID="<facebook app id>"
META_APP_SECRET="<facebook app secret>"
```

### `admin-internal/.env`
```env
DATABASE_URL="postgresql://repondly_user:<password>@127.0.0.1:5433/repondly"
NEXTAUTH_SECRET="<admin-specific secret>"
NEXTAUTH_URL="https://app.repondly.com/admin"
CHATWOOT_BASE_URL="http://127.0.0.1:3000"
CHATWOOT_API_TOKEN="<admin chatwoot token>"
```

### `marketing-site/.env`
```env
# Minimal — no DB, no auth
CONTACT_EMAIL="contact@repondly.com"
```

### `bot/.env`
```env
DATABASE_URL="postgresql://repondly_user:<password>@127.0.0.1:5433/repondly"
CHATWOOT_BASE_URL="http://127.0.0.1:3000"
CHATWOOT_API_TOKEN="<bot agent token>"
PORT=3001
```

---

## Nginx Config Summary

File: `nginx.conf` (copy/symlink to `/etc/nginx/sites-enabled/repondly`)

```
# HTTP → HTTPS (all domains)
80 → 301 HTTPS

# repondly.com / www.repondly.com
443 → proxy :3005 (marketing-site)

# app.repondly.com / inbox.repondly.com
443:
  /admin          → proxy :3006 (admin-internal)
  /api/admin/*    → proxy :3006 (admin-internal)
  /bot/           → proxy :3001 (bot)
  /chatwoot-webhook → proxy :3001 (bot)
  /_next/         → proxy :3004 or :3006 (smart routing via Referer header map)
  /               → proxy :3004 (dashboard-app)
```

---

## PM2 Processes

```bash
pm2 list                                    # see all processes
pm2 logs repondly-dashboard --lines 50      # dashboard logs
pm2 logs repondly-admin --lines 50          # admin logs
pm2 logs repondly-marketing --lines 50      # marketing logs
pm2 logs repondly-bot --lines 50            # bot logs
pm2 restart repondly-dashboard
pm2 save                                    # persist across reboots
```

**Rebuild and redeploy a Next.js app:**
```bash
cd /opt/repondly/<app-folder>
git pull
npm install
npm run build
pm2 restart <pm2-name>
```

---

## Key Commands

```bash
# SSH into VPS
ssh skander@157.173.102.140

# Nginx reload
sudo nginx -t && sudo nginx -s reload

# Connect to DB
psql -U repondly_user -h 127.0.0.1 -p 5433 -d repondly -W

# Run Prisma migrations (from app folder)
cd /opt/repondly/dashboard-app
npx prisma db push       # push schema changes
npx prisma studio        # GUI for DB

# Docker services
cd /opt/repondly/chatwoot && docker compose up -d
cd /opt/repondly/n8n     && docker compose up -d
docker compose ps        # check running containers
docker compose logs -f   # follow logs

# PM2 status
pm2 list
pm2 monit

# Tree generation
tree -I "node_modules|.next|.git|dist" > project_tree.txt
```

---

## Request Flow: How a WhatsApp Message Gets Auto-Replied

```
1. Customer sends WhatsApp message
      ↓
2. WhatsApp Business API (connected via Chatwoot inbox)
      ↓
3. Chatwoot receives message → creates conversation
      ↓
4. Chatwoot fires POST to app.repondly.com/chatwoot-webhook
      ↓
5. Nginx routes /chatwoot-webhook → bot :3001
      ↓
6. Bot parses event, looks up AutoRules from PostgreSQL
      ↓
7. If rule matches → bot calls Chatwoot internal API to send reply
      ↓
8. Chatwoot delivers reply back to WhatsApp
      ↓
9. Bot POSTs event log to dashboard-app via /api/internal/bot-event
      ↓
10. Client sees conversation + auto-reply in their dashboard
```

---

## Request Flow: Admin Managing a Client

```
1. Repondly staff visits app.repondly.com/admin
      ↓
2. Nginx routes /admin → admin-internal :3006
      ↓
3. Admin logs in (separate NextAuth session)
      ↓
4. Admin views KanbanBoard — cards loaded from PostgreSQL via Prisma
      ↓
5. Admin changes client stage → PATCH /api/admin/clients/:id/stage
      ↓
6. Nginx routes /api/admin/* → admin-internal :3006
      ↓
7. Admin can sync client to Chatwoot → POST /api/admin/clients/:id/sync
      ↓
8. admin-internal calls Chatwoot internal REST API to create account/contact
```

---

## What's Done ✅

- Marketing site live at `repondly.com` (multilingual FR/AR, legal pages, contact form)
- Dashboard app live at `app.repondly.com` (client auth, WhatsApp status, messagerie view)
- Admin panel live at `app.repondly.com/admin` (kanban, client management, onboarding, n8n, Chatwoot, DB manager)
- Bot engine running on :3001 (Chatwoot webhook receiver, auto-reply logic)
- Self-hosted Chatwoot on Docker
- Self-hosted n8n on Docker
- PostgreSQL 16 on :5433 with full Prisma schema
- Nginx routing all 4 domains/subdomains correctly
- PM2 managing all Node processes (survives reboots)
- SSL via Let's Encrypt (two separate cert chains)
- Meta (Facebook/Instagram) OAuth connect flow in dashboard
- DPA checkbox + onboarding flow

---

## What's Next 🔲

- **AutoRule builder UI** in dashboard — create/edit/delete rules per channel
- **Bot rule engine** — evaluate rules from DB on every incoming message
- **Reminder scheduler** — BullMQ + Redis queue for scheduled messages
- **Booking flow** — conversational WhatsApp flow → creates Booking record
- **Google Calendar sync** for bookings
- **Billing page** in dashboard — subscription plan + upgrade flow
- **Redis** setup on VPS for job queues
- **Client onboarding polish** — guided setup wizard for new businesses
- **n8n workflow templates** — pre-built automations for common SMB use cases

---

## For New Developers

1. Clone the repo — each subfolder is an independent app with its own `package.json`
2. There is **no shared package or workspace** — each app is built and deployed independently
3. The DB is shared — changes to `prisma/schema.prisma` in one app should be reflected in the other
4. Nginx is the router — to understand what goes where, read `nginx.conf` first
5. The bot is plain JavaScript (`bot/index.js`) — no TypeScript, no framework
6. Chatwoot is a black box (open-source) — we only interact with it via its REST API and webhooks
7. Admin sessions are completely separate from client sessions — different NextAuth instances, different secrets
8. Port 5433 (not 5432) — always double-check DB connection strings

---

> **Tip for AI coding assistants:** Start by reading this file + `nginx.conf` + the relevant `prisma/schema.prisma`. That gives you 90% of the context needed to work on any part of this codebase.