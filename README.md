# Repondly — Full Project README
> Paste this file at the start of any chat to continue building with full context.

---

## What is Repondly
Repondly automates messages and comments for small to medium businesses across WhatsApp, Instagram, Facebook, and Email. It uses a **self-hosted Chatwoot instance** (open-source) as the core inbox/routing layer. The bot engine handles auto-replies and automation rules on top of Chatwoot. Businesses manage everything through a Next.js dashboard.

**Target market:** Small to medium businesses in Tunisia (Arabic, French, Darija)

---

## Infrastructure

| Component | Details |
|---|---|
| VPS | Linux VPS — IP `157.173.102.140` |
| OS | Ubuntu 24.04 |
| Reverse Proxy | Nginx 1.24.0 |
| Chatwoot | Self-hosted open-source, Docker, running on port `3000` |
| Bot | Node.js, running on port `3001` via PM2 |
| Frontend | Next.js, running on port `3004` via PM2 |
| PostgreSQL | Running on port `5433` (non-standard) |

---

## Domains

| Domain | Points to |
|---|---|
| `repondly.com` | Next.js frontend (port 3004) |
| `www.repondly.com` | Next.js frontend (port 3004) |
| `app.repondly.com` | Self-hosted Chatwoot (port 3000) |
| `app.repondly.com/bot/` | Bot engine (port 3001) |
| `app.repondly.com/chatwoot-webhook` | Bot webhook handler (port 3001) |

---

## Tech Stack & Versions

| Layer | Tech | Version |
|---|---|---|
| Frontend + API | Next.js | 15.5.15 |
| Language | TypeScript | — |
| Styling | Tailwind CSS + inline styles | — |
| Auth | NextAuth.js (next-auth) | 5.0.0-beta.31 |
| ORM | Prisma | 7.8.0 |
| DB Driver | @prisma/adapter-pg + pg | — |
| Password hashing | bcryptjs | — |
| Database | PostgreSQL | 16.13 |
| Bot | Node.js | 20.20.2 |
| Process manager | PM2 | latest |
| Chatwoot | Self-hosted open-source | Docker |
| Nginx | 1.24.0 (Ubuntu) | — |
| SSL | Let's Encrypt (certbot) | — |

---

## Folder Structure

```
/opt/repondly/
├── bot/                        # Automation engine (existing, running)
│   ├── index.js                # Entry point — receives Chatwoot webhooks, sends auto-replies
│   ├── .env                    # Bot secrets
│   └── package.json
├── chatwoot/                   # Self-hosted Chatwoot
│   ├── docker-compose.yml
│   └── .env
├── landing/                    # Old static landing page (no longer used by nginx)
│   ├── index.html
│   └── logo.png
├── frontend/                   # Next.js app (frontend + API)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                        # Landing page (repondly.com)
│   │   │   ├── layout.tsx                      # Root layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    # Dashboard (placeholder)
│   │   │   ├── auth/
│   │   │   │   └── signin/
│   │   │   │       └── page.tsx                # Sign in page
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           ├── [...nextauth]/
│   │   │           │   └── route.ts            # NextAuth handler
│   │   │           └── register/
│   │   │               └── route.ts            # POST /api/auth/register
│   │   └── lib/
│   │       ├── prisma.ts                       # Prisma client singleton
│   │       └── auth.ts                         # NextAuth config (handlers, signIn, signOut, auth)
│   ├── prisma/
│   │   └── schema.prisma                       # DB schema
│   ├── prisma.config.ts                        # Prisma v7 config (datasource URL here)
│   ├── public/
│   │   └── logo.png                            # Repondly logo
│   ├── .env                                    # Env vars
│   ├── next.config.ts
│   └── package.json
└── nginx.conf                                  # Symlinked or copied to /etc/nginx/sites-enabled/repondly
```

---

## Database

**PostgreSQL 16** running on `127.0.0.1:5433` (non-standard port — important!)

**Credentials:**
- User: `repondly_user`
- Password: `repondly123` *(change this in production)*
- Database: `repondly`
- Connection string: `postgresql://repondly_user:repondly123@127.0.0.1:5433/repondly`

**Tables (all created via `npx prisma db push`):**

| Table | Description |
|---|---|
| `Business` | One account per business — stores name, email, passwordHash, Chatwoot account ID + token, plan |
| `Client` | Contacts belonging to a business, linked to Chatwoot contact ID |
| `AutoRule` | Automation rules — trigger, conditions (JSON), action, response template |
| `Reminder` | Scheduled messages to clients with status tracking |
| `Booking` | Appointments with calendar event ID for Google/Outlook sync |

**Enums:** `Plan (FREE/STARTER/PRO)`, `Channel (WHATSAPP/INSTAGRAM/FACEBOOK/EMAIL)`, `Trigger (MESSAGE/COMMENT/KEYWORD)`, `Action (REPLY/REMINDER/TAG/ASSIGN)`, `ReminderStatus (PENDING/SENT/FAILED)`, `BookingStatus (PENDING/CONFIRMED/CANCELLED)`

---

## Environment Variables

**`/opt/repondly/frontend/.env`**
```
DATABASE_URL="postgresql://repondly_user:repondly123@127.0.0.1:5433/repondly"
NEXTAUTH_SECRET="<generated with openssl rand -base64 32>"
NEXTAUTH_URL="https://repondly.com"
```

---

## Nginx Config

Location: `/etc/nginx/sites-enabled/repondly`

```nginx
server {
    listen 80;
    server_name repondly.com www.repondly.com app.repondly.com;
    return 301 https://$host$request_uri;
}

# Chatwoot
server {
    listen 443 ssl;
    server_name app.repondly.com;
    ssl_certificate /etc/letsencrypt/live/repondly.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repondly.com/privkey.pem;
    location /bot/ { proxy_pass http://127.0.0.1:3001/; ... }
    location /chatwoot-webhook { proxy_pass http://127.0.0.1:3001/chatwoot-webhook; ... }
    location / { proxy_pass http://127.0.0.1:3000; ... }
}

# Next.js frontend
server {
    listen 443 ssl;
    server_name repondly.com www.repondly.com;
    ssl_certificate /etc/letsencrypt/live/repondly.com-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/repondly.com-0001/privkey.pem;
    location / { proxy_pass http://127.0.0.1:3004; ... }
}
```

---

## How Chatwoot Is Used (Self-Hosted)

- **NOT** the cloud Chatwoot SaaS API
- Chatwoot runs on the same VPS via Docker on port `3000`
- Inbound: Chatwoot receives messages from WA/IG/FB/Email, fires webhook events to bot at port `3001`
- Outbound: Bot and app call Chatwoot's internal REST API directly (`http://127.0.0.1:3000/api/v1/...`)
- Auth: Agent API access token from the self-hosted instance
- Key endpoints:
  ```
  POST /api/v1/accounts/:id/conversations/:id/messages   # send message
  PATCH /api/v1/accounts/:id/conversations/:id           # update status
  GET  /api/v1/accounts/:id/contacts                     # list contacts
  ```

---

## PM2 Processes

```bash
pm2 list        # see all running processes
pm2 logs repondly-frontend --lines 50   # frontend logs
pm2 restart repondly-frontend           # restart frontend
pm2 save                                # save process list (survives reboot)
```

To rebuild and restart frontend after changes:
```bash
cd /opt/repondly/frontend
npm run build
pm2 restart repondly-frontend
```

---

## What's Done ✅

- [x] Self-hosted Chatwoot running on `app.repondly.com`
- [x] Bot engine running on port 3001 (receives Chatwoot webhooks, sends auto-replies)
- [x] PostgreSQL 16 set up with all tables
- [x] Prisma v7 configured with pg adapter
- [x] Next.js 15 app scaffolded at `/opt/repondly/frontend`
- [x] Landing page live at `repondly.com` (converted from static HTML to Next.js)
- [x] Sign in page at `repondly.com/auth/signin`
- [x] NextAuth v5 configured (JWT sessions, credentials provider)
- [x] Register API at `POST /api/auth/register`
- [x] Nginx updated to proxy `repondly.com` → Next.js on port 3004
- [x] PM2 set up — frontend runs permanently, survives reboots

---

## What's Next 🔲

### Immediate (auth flow completion)
- [ ] Register page UI (`/auth/register`) — name, email, password form
- [ ] After register → auto sign in → redirect to dashboard
- [ ] Protect dashboard route (redirect to signin if not authenticated)
- [ ] Dashboard shell with sidebar navigation

### Core features to build
- [ ] AutoRules builder UI — create/edit/delete automation rules
- [ ] AutoRule engine in bot — match incoming messages against rules from DB
- [ ] Reminder scheduler — queue-based (BullMQ + Redis) or cron
- [ ] Booking flow — conversational WA flow → creates Booking record
- [ ] Calendar integration — Google Calendar API sync for bookings
- [ ] Settings page — connect channels, manage Chatwoot token, profile

### Infrastructure
- [ ] Add `CLIENT_URL` and other env vars as needed
- [ ] Set up Redis for job queues (reminders, scheduled messages)
- [ ] CI/CD or deploy script for easy updates

---

## Key Commands

```bash
# SSH into VPS
ssh skander@157.173.102.140

# Go to project
cd /opt/repondly

# Rebuild frontend after changes
cd frontend && npm run build && pm2 restart repondly-frontend

# Check DB
psql -U repondly_user -h 127.0.0.1 -p 5433 -d repondly -W

# Nginx reload
sudo nginx -t && sudo nginx -s reload

# PM2 status
pm2 list
```

---

> Last updated: April 2026 — paste this file at the start of any chat to continue building.