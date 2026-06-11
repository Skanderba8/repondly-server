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
  ├── repondly.com / www.repondly.com   ──────────► marketing-site   :3005
  ├── admin.repondly.com                ──────────► admin            :3006
  └── app.repondly.com
        ├── /bot/*                     ──────────► bot (Node.js)    :3001
        └── /*  (everything else)      ──────────► dashboard-app    :3004

PostgreSQL                                                             :5433
  └── shared DB — used by dashboard-app and admin via Prisma
```

---

## Repository Structure

This is a **monorepo**. All services live in one repo, deployed on a single VPS.

```
repondly/
├── marketing-site/        # Public-facing website (repondly.com)
├── dashboard-app/         # Client-facing Next.js app (app.repondly.com)
├── admin/                 # Internal admin panel (admin.repondly.com)
├── bot/                   # Node.js automation/webhook engine (:3001)
├── nginx.conf             # Nginx reverse proxy config (source of truth)
└── README.md              # This file
```

---

## Services & Ports

| Service | Stack | Port | Process Manager | URL |
|---|---|---|---|---|
| `marketing-site` | Next.js 15, TypeScript | 3005 | PM2 | `repondly.com` |
| `dashboard-app` | Next.js 15, TypeScript | 3004 | PM2 | `app.repondly.com` |
| `admin` | Next.js 15, TypeScript | 3006 | PM2 | `admin.repondly.com` |
| `bot` | Node.js 20, JavaScript | 3001 | PM2 | `app.repondly.com/bot/` |
| `postgresql` | PostgreSQL 16 | 5433 | systemd | `127.0.0.1:5433` |

---

## Domains & Routing

| Domain | Routes to | Notes |
|---|---|---|
| `repondly.com` | `marketing-site` :3005 | Public marketing + legal pages |
| `www.repondly.com` | `marketing-site` :3005 | Same as above |
| `app.repondly.com` | `dashboard-app` :3004 | Client dashboard |
| `admin.repondly.com` | `admin` :3006 | Internal Repondly staff only |
| `app.repondly.com/bot/` | `bot` :3001 | Bot REST endpoints |

**HTTP → HTTPS:** All HTTP traffic on port 80 is redirected 301 to HTTPS.



---

## Infrastructure

| Component | Details |
|---|---|
| VPS | Linux VPS — IP `157.173.102.140` |
| OS | Ubuntu 24.04 |
| Reverse Proxy | Nginx 1.24.0 |
| SSL | Let's Encrypt via Certbot |
| Process Manager | PM2 (for all Node.js/Next.js apps) |
| Containers | None (all apps are native Node.js/PM2) |

**SSL certificates:**
- `repondly.com` uses `/etc/letsencrypt/live/repondly.com-0001/`
- `app.repondly.com` / `admin.repondly.com` uses `/etc/letsencrypt/live/repondly.com/`

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

**DB:** Prisma → PostgreSQL :5433 (same DB as admin).

---

### `admin` — Internal Admin Panel (:3006)

**Purpose:** Internal Repondly staff tool. Manage clients, access control, database operations, and system status.

**Access:** `admin.repondly.com` — protected by separate admin auth.

```
admin/src/app/
├── page.tsx                            # Overview / stats
├── layout.tsx                          # Admin shell layout
├── auth/signin/page.tsx                # Admin login
├── clients/
│   ├── page.tsx                        # Clients list
│   ├── new/page.tsx                    # Create new client
│   └── [id]/page.tsx                   # Client detail page
├── access/page.tsx                     # Access control (admin users)
├── database/page.tsx                   # DB management + migrations
└── system/page.tsx                     # System status
```

**Key admin UI components:**
- `ClientsTable.tsx` — searchable client list
- `AccessManager.tsx` — admin user permissions
- `DatabaseManager.tsx` — DB health + migration trigger
- `RoutingMap.tsx` — visual routing overview

---

### `bot` — Automation Engine (:3001)

**Purpose:** Node.js webhook receiver and automation engine.

```
bot/
├── index.js          # Main entry — HTTP server, webhook handler, auto-reply logic
├── index_backup.js   # Backup/previous version
├── conversations.json # Local state cache (conversations)
└── package.json
```

**What it does:**
- Receives webhooks from messaging channels
- Evaluates AutoRules from the DB (keyword match, channel, trigger type)
- Sends auto-replies via channel APIs
- Exposes `GET /bot/` health endpoint

---

## Database

**PostgreSQL 16** — port `5433` (non-standard, intentional)

```
Host:     127.0.0.1
Port:     5433
User:     repondly_user
Database: repondly
```

Shared between `dashboard-app` and `admin`. Both use Prisma v7 with `@prisma/adapter-pg`.

**Prisma config location:** `prisma.config.ts` (root of each Next.js app) + `prisma/schema.prisma`

**Key models** (from schema.prisma, both apps share the same DB):

| Model | Description |
|---|---|
| `Business` | One account per client business — email, passwordHash, plan |
| `Client` | Contacts/leads belonging to a business |
| `AutoRule` | Automation rules — trigger, conditions (JSON), action, response template |
| `Reminder` | Scheduled messages to clients |
| `Booking` | Appointments with calendar sync |
| Admin models | Access control, onboarding state, etc. (admin only) |

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

### `admin/.env`
```env
DATABASE_URL="postgresql://repondly_user:<password>@127.0.0.1:5433/repondly"
NEXTAUTH_SECRET="<admin-specific secret>"
NEXTAUTH_URL="https://admin.repondly.com"
ADMIN_EMAIL="admin@repondly.com"
INTERNAL_SECRET="repondly-internal-secret"
```

### `marketing-site/.env`
```env
# Minimal — no DB, no auth
CONTACT_EMAIL="contact@repondly.com"
```

### `bot/.env`
```env
DATABASE_URL="postgresql://repondly_user:<password>@127.0.0.1:5433/repondly"
PORT=3001
GROQ_API_KEY="<groq api key>"
INTERNAL_SECRET="repondly-internal-secret"
```

---

## Nginx Config Summary

File: `nginx.conf` (copy/symlink to `/etc/nginx/sites-enabled/repondly`)

```
# HTTP → HTTPS (all domains)
80 → 301 HTTPS

# repondly.com / www.repondly.com
443 → proxy :3005 (marketing-site)

# app.repondly.com
443:
  /bot/           → proxy :3001 (bot)
  /               → proxy :3004 (dashboard-app)

# admin.repondly.com
443:
  /               → proxy :3006 (admin)
```

---

## PM2 Processes

```bash
pm2 list                                    # see all processes
pm2 logs repondly-dashboard --lines 50      # dashboard logs
pm2 logs admin --lines 50                   # admin logs
pm2 logs marketing-site --lines 50           # marketing logs
pm2 logs repondly-bot --lines 50            # bot logs
pm2 restart dashboard-app
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



# PM2 status
pm2 list
pm2 monit

# Tree generation
tree -I "node_modules|.next|.git|dist" > project_tree.txt
```

---

## Request Flow: Admin Managing a Client

```
1. Repondly staff visits admin.repondly.com
      ↓
2. Nginx routes → admin :3006
      ↓
3. Admin logs in (separate NextAuth session)
      ↓
4. Admin views clients list — loaded from PostgreSQL via Prisma
      ↓
5. Admin creates or edits a client → POST/PATCH /api/clients/:id
      ↓
6. Admin can manage database → /api/database or /api/database/migrate
```

---

## What's Done ✅

- Marketing site live at `repondly.com` (multilingual FR/AR, legal pages, contact form)
- Dashboard app live at `app.repondly.com` (client auth, WhatsApp status, messagerie view)
- Admin panel live at `admin.repondly.com` (clients, access control, database, system)
- Bot engine running on :3001 (webhook receiver, auto-reply logic)
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

---

## For New Developers

1. Clone the repo — each subfolder is an independent app with its own `package.json`
2. There is **no shared package or workspace** — each app is built and deployed independently
3. The DB is shared — changes to `prisma/schema.prisma` in one app should be reflected in the other
4. Nginx is the router — to understand what goes where, read `nginx.conf` first
5. The bot is plain JavaScript (`bot/index.js`) — no TypeScript, no framework
6. Admin sessions are completely separate from client sessions — different NextAuth instances, different secrets
8. Port 5433 (not 5432) — always double-check DB connection strings

---

> **Tip for AI coding assistants:** Start by reading this file + `nginx.conf` + the relevant `prisma/schema.prisma`. That gives you 90% of the context needed to work on any part of this codebase.