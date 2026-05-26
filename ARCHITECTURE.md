# Répondly Architecture Documentation

**Generated:** May 25, 2026  
**Scope:** dashboard-app (Next.js frontend)  
**Purpose:** Complete UI rebuild reference

---

## 1. Project Stack

### Framework & Core
- **Next.js:** v15.5.15 (App Router)
- **React:** v19.2.4
- **TypeScript:** v5 (strict mode enabled)
- **Node.js:** v20

### Styling
- **Tailwind CSS:** v4.3.0 (PostCSS-based)
- **Custom CSS:** Inline styles in components (no CSS modules, no styled-components)
- **Theme System:** Custom CSS variables for dark/light mode (`--bg`, `--surface`, `--text`, etc.)
- **Font:** Inter (Google Fonts) + DM Serif Display (brand)

### State Management
- **React Hooks:** useState, useEffect, useCallback, useRef (no global state library)
- **Context API:** MobileNavContext in AppShell for hiding bottom nav
- **NextAuth Session:** useSession hook for auth state

### Data Fetching
- **Native fetch:** All API calls use standard fetch API
- **No React Query/SWR:** Manual fetch with useState/loading patterns
- **SSE (Server-Sent Events):** Real-time updates via `/api/sse`

### Authentication
- **NextAuth:** v5.0.0-beta.31
- **Strategy:** JWT (session strategy)
- **Provider:** Credentials (email/password)
- **Session Storage:** JWT in HTTP-only cookies
- **Cookie Name:** next-auth.session-token (default NextAuth)
- **Middleware:** Route protection via `src/middleware.ts`

### PWA Setup
- **Manifest Location:** `/public/manifest.json`
- **Service Worker:** `/public/sw.js` (custom, not next-pwa)
- **Registration:** Inline script in `src/app/layout.tsx`
- **Display Mode:** Standalone
- **Theme Color:** #0A0A0F (dark)

### Animation Libraries
- **Framer Motion:** v12.38.0 (used in MessagerieView for transitions)
- **CSS Animations:** Custom keyframes in inline styles (e.g., slideUpSheet)

### Icons
- **Lucide React:** v1.11.0 (icon library)

### Database
- **Prisma:** v7.8.0
- **Adapter:** @prisma/adapter-pg (PostgreSQL)
- **Connection Pool:** pg (node-postgres) v8.20.0

---

## 2. Current Routing Structure

### Pages & Routes

| Route | Protected | Layout | Component Path |
|-------|-----------|--------|----------------|
| `/` | Yes (redirects) | Root layout | `src/app/page.tsx` |
| `/auth/signin` | No (public) | Auth layout | `src/app/auth/signin/page.tsx` |
| `/dashboard` | Yes | Dashboard layout | `src/app/dashboard/page.tsx` (redirects to accueil) |
| `/dashboard/accueil` | Yes | Dashboard layout | `src/app/dashboard/accueil/page.tsx` |
| `/dashboard/messagerie` | Yes | Dashboard layout | `src/app/dashboard/messagerie/page.tsx` |
| `/dashboard/commandes` | Yes | Dashboard layout | `src/app/dashboard/commandes/page.tsx` |
| `/dashboard/configuration` | Yes | Dashboard layout | `src/app/dashboard/configuration/page.tsx` |

### Layout Wrappers

1. **Root Layout** (`src/app/layout.tsx`)
   - HTML structure, head, fonts
   - PWA manifest link
   - Service worker registration
   - Theme CSS variables
   - Providers wrapper (SessionProvider)

2. **Auth Layout** (`src/app/auth/signin/layout.tsx`)
   - Minimal layout for signin page
   - No sidebar/nav

3. **Dashboard Layout** (`src/app/dashboard/layout.tsx`)
   - Auth check (redirects to signin if not authenticated)
   - AppShell wrapper (sidebar + mobile nav)

### Route Protection
- **Middleware:** `src/middleware.ts`
  - Protects `/dashboard/*` routes
  - Redirects authenticated users from `/auth/signin` based on role
  - SUPER_ADMIN/ADMIN → `https://admin.repondly.com`
  - Regular users → `/dashboard`

---

## 3. Navigation Architecture

### Desktop Sidebar
- **Component:** `src/components/AppShell.tsx`
- **Location:** Fixed left sidebar (220px width, hidden on mobile)
- **Navigation Items:**
  - Accueil (`/dashboard/accueil`) - LayoutDashboard icon
  - Messagerie (`/dashboard/messagerie`) - MessageSquare icon
  - Commandes (`/dashboard/commandes`) - ShoppingBag icon
  - Configuration (`/dashboard/configuration`) - Settings icon
- **Features:**
  - Active state highlighting (blue accent)
  - Unread count badge on Messagerie
  - Channel status indicators (WhatsApp, Facebook/Instagram)
  - Theme toggle (dark/light)
  - User profile dropdown with logout

### Mobile Bottom Nav
- **Component:** `src/components/AppShell.tsx` (island design)
- **Location:** Fixed bottom (hidden on desktop, hidden on messagerie view)
- **Navigation Items:** Same 4 items as desktop
- **Features:**
  - Floating island design (rounded pill)
  - Active state pill background
  - Unread count badge
  - Safe area inset support

### Mobile Top Header
- **Component:** `src/components/AppShell.tsx`
- **Location:** Fixed top (hidden on desktop, hidden on messagerie view)
- **Features:**
  - Logo
  - Page title (dynamic based on route)
  - Avatar button (opens profile sheet)

### Profile Sheet (Mobile)
- **Component:** `src/components/AppShell.tsx`
- **Trigger:** Avatar button in top header
- **Features:**
  - User info display
  - Theme toggle
  - Logout button
  - Slide-up animation

### Mobile Shell (Alternative)
- **Component:** `src/components/MobileShell.tsx`
- **Status:** Currently unused (AppShell handles both desktop/mobile)
- **Features:** Similar mobile-first design

---

## 4. The 4 Main Sections

### 4.1 Accueil (Dashboard Home)
- **Path:** `src/app/dashboard/accueil/page.tsx`
- **Data Fetching:**
  - `/api/chatwoot/conversations?status=open` - Open conversations count
  - `/api/chatwoot/conversations?status=resolved&page=1` - Resolved conversations (for treated today count)
  - `/api/sse` - Real-time updates (new_message, conversation_update events)
- **State:**
  - `stats`: { openCount, treatedToday, handoversToday }
  - `convs`: RecentConv[] (recent conversations)
  - `loading`: boolean
- **Features:**
  - KPI cards (En attente, Traités aujourd'hui, Interventions humaines)
  - Recent conversations list
  - Auto-refresh on SSE events
  - Manual refresh button

### 4.2 Messagerie (Messaging)
- **Path:** `src/app/dashboard/messagerie/MessagerieView.tsx` (main component)
- **Wrapper:** `src/app/dashboard/messagerie/page.tsx`
- **Data Fetching:**
  - `/api/chatwoot/conversations?status=open` - Conversation list
  - `/api/chatwoot/messages/[conversationId]` - Messages for selected conversation
  - `/api/chatwoot/conversation-status` - GET/POST for Repondly status (EN_ATTENTE/RESOLUE)
  - `/api/chatwoot/notes/[conversationId]` - GET/POST for conversation notes
  - `/api/chatwoot/inboxes` - Channel/inbox info
  - `/api/sse` - Real-time message updates
  - `/api/conversation-bot` - GET/PATCH for bot enable/disable per conversation
- **State:**
  - `conversations`: Conversation[]
  - `activeConvId`: number | null
  - `messages`: Message[]
  - `repondlyStatuses`: Map<convId, RepondlyStatus>
  - `notes`: Note[]
  - `channelCounts`: { whatsapp, facebook_instagram }
  - `reply`: string (input text)
  - Various loading states
- **Sub-views:**
  - Conversation list (left panel on desktop, full screen on mobile)
  - Conversation thread (right panel on desktop, slides in on mobile)
  - Notes panel (overlay)
- **Features:**
  - Channel filtering (WhatsApp, Facebook/Instagram, All)
  - Search conversations
  - Real-time message updates via SSE
  - Bot toggle per conversation
  - Status toggle (EN_ATTENTE/RESOLUE)
  - Notes system
  - Resolve/resolve actions
  - Delete conversation

### 4.3 Commandes (Orders)
- **Path:** `src/app/dashboard/commandes/page.tsx`
- **Data Fetching:**
  - `/api/orders` - GET (with optional ?status filter)
  - `/api/orders` - POST (create new order)
  - `/api/orders/[id]` - PATCH (update status), DELETE
- **State:**
  - `orders`: Order[]
  - `filter`: FilterStatus (ALL | PENDING | CONFIRMED | CANCELLED)
  - `showAddForm`: boolean
  - `addForm`: { type, clientName, clientPhone, notes }
- **Features:**
  - Order list with status filtering
  - Status badges (PENDING, CONFIRMED, CANCELLED)
  - Add manual order form
  - Update order status
  - Delete order
  - Type distinction (ORDER vs APPOINTMENT)

### 4.4 Configuration (Settings)
- **Path:** `src/app/dashboard/configuration/page.tsx`
- **Data Fetching:**
  - `/api/config` - GET/POST (business config, bot config, schedules, products, services)
  - `/api/schedules` - GET/POST/PATCH/DELETE
  - `/api/schedule-exceptions` - GET/POST/PATCH/DELETE
  - `/api/products` - GET/POST/PATCH/DELETE
  - `/api/services` - GET/POST/PATCH/DELETE
  - `/api/meta/pages` - GET/DELETE (Facebook/Instagram pages)
  - `/api/whatsapp/status` - GET
  - `/api/whatsapp/disconnect` - GET
- **State:**
  - `tab`: Tab (entreprise | bot | horaires | catalogue | canaux)
  - `biz`: Business fields (name, description, phone, address, botMode, etc.)
  - `bc`: BotConfig fields (botActive, handoverPhone, handoverTriggers, etc.)
  - `schedules`: Schedule[]
  - `products`: Product[]
  - `services`: Service[]
- **Tabs:**
  - **Entreprise:** Business info, name, description, phone, address
  - **Bot:** Bot configuration, handover triggers, collect fields, strict instructions
  - **Horaires:** Weekly schedules, schedule exceptions
  - **Catalogue:** Products and services management
  - **Canaux:** WhatsApp and Facebook/Instagram connection (uses FacebookInstagramConnect component)
- **Features:**
  - Tab-based navigation
  - Form validation
  - Toast notifications
  - Dynamic component loading (FacebookInstagramConnect is dynamic import)

---

## 5. Messagerie Deep Dive

### Conversation List Rendering
- **Component:** `ConvItem` in MessagerieView.tsx
- **Data Source:** `/api/chatwoot/conversations?status=open`
- **Display:**
  - Contact avatar (with channel badge)
  - Contact name
  - Last message preview
  - Timestamp (formatted: "À l'instant", "5m", "2h", "Hier", date)
  - Unread count badge
  - Channel icon (WhatsApp/Facebook/Instagram)
  - Bot enable/disable toggle
  - Status indicator (EN_ATTENTE/RESOLUE)
- **Filtering:**
  - Channel filter (All, WhatsApp, Facebook/Instagram)
  - Search by contact name
- **Sorting:** By last activity timestamp (descending)

### Opening a Conversation/Thread
- **Action:** Click on ConvItem
- **State Change:** `setActiveConvId(conv.id)`
- **Effect:**
  - Desktop: Right panel shows conversation thread
  - Mobile: Thread slides in from right (full screen), hides bottom nav
  - Triggers `fetchMessages(activeConvId)`
- **Message Fetching:** `/api/chatwoot/messages/[conversationId]`

### Sending Messages
- **Component:** Textarea in message thread (bottom of thread view)
- **API Call:** `POST /api/chatwoot/messages/[conversationId]`
- **Payload:** `{ content: string }`
- **Flow:**
  1. User types in textarea
  2. Press Enter or click Send button
  3. Optimistic UI: Add message to local state immediately
  4. Call API
  5. On success: Real message appears on next SSE/poll
  6. On failure: Remove optimistic message, restore text
- **Message Type:** outgoing (message_type: 1)

### Real-Time Updates
- **Mechanism:** Server-Sent Events (SSE)
- **Endpoint:** `/api/sse`
- **Event Types:**
  - `connected` - Initial connection
  - `new_message` - New message received
  - `conversation_update` - Conversation status/metadata changed
- **Implementation:**
  - `EventSource` connection in AppShell (for unread count)
  - Separate `EventSource` in MessagerieView (for message updates)
  - Visibility API: Pauses SSE when tab hidden, resumes on visible
  - Fallback: Poll conversation list every 30s
- **Broadcasting:** Server-side `sseBroadcaster` singleton in `src/lib/sse-broadcaster.ts`

### Send Message Input Component
- **Location:** Inside MessagerieView thread view
- **Features:**
  - Auto-growing textarea
  - Enter to send (Shift+Enter for newline)
  - Send button (disabled when empty or sending)
  - Loading state during send
  - Focus management (refocus after send)

---

## 6. Auth Flow

### Login Page
- **Path:** `src/app/auth/signin/page.tsx`
- **Route:** `/auth/signin`
- **Method:** POST to NextAuth credentials provider
- **Flow:**
  1. User enters email/password
  2. Calls `signIn('credentials', { email, password, redirect: false })`
  3. NextAuth authorizes via `src/lib/auth.ts`
  4. Checks AdminUser table first (new system)
  5. Falls back to Business table (legacy system)
  6. On success: Fetches session, checks role
  7. Redirects:
     - SUPER_ADMIN/ADMIN → `https://admin.repondly.com`
     - Regular user → `/dashboard`
- **Features:**
  - Password visibility toggle
  - Error display
  - Loading state
  - Responsive design (desktop: two-panel, mobile: single panel)

### Logout Handler
- **Location:** `src/components/AppShell.tsx` (desktop sidebar and mobile sheet)
- **Method:** `signOut({ callbackUrl: '/auth/signin' })` from next-auth/react
- **Effect:** Clears session, redirects to signin page

### User Object Storage
- **Location:** NextAuth JWT token (HTTP-only cookie)
- **Access:** `useSession()` hook from next-auth/react
- **Session Provider:** `src/components/Providers.tsx` wraps app
- **JWT Callback:** Adds `id` and `role` to token
- **Session Callback:** Adds `id` and `role` to session.user

### User Object Fields
```typescript
{
  id: string          // Business ID or AdminUser ID
  email: string       // User email
  name: string        // Business name or admin name
  role?: 'SUPER_ADMIN' | 'ADMIN' | undefined  // Only for AdminUser
}
```

### Auth Configuration
- **Config File:** `src/lib/auth.config.ts` (edge-safe, no Prisma)
- **Auth File:** `src/lib/auth.ts` (full auth with Prisma)
- **Strategy:** JWT
- **Providers:** Credentials (email/password)
- **Pages:** Custom signin page at `/auth/signin`

---

## 7. API Layer

### Internal API Routes (App Router)

#### Auth Routes
- `POST /api/auth/meta/connect` - Connect Meta (Facebook/Instagram) account
- `GET /api/auth/meta/callback` - Meta OAuth callback
- `GET /api/auth/meta/pages` - List connected Meta pages
- `DELETE /api/auth/meta/pages` - Disconnect Meta page

#### Chatwoot Routes
- `GET /api/chatwoot/conversations` - List conversations (status filter)
- `DELETE /api/chatwoot/conversations` - Delete conversation
- `GET /api/chatwoot/messages/[conversationId]` - Get conversation messages
- `POST /api/chatwoot/messages/[conversationId]` - Send message
- `POST /api/chatwoot/messages/[conversationId]/status-check` - Check message status
- `GET /api/chatwoot/notes/[conversationId]` - Get conversation notes
- `POST /api/chatwoot/notes/[conversationId]` - Create note
- `GET /api/chatwoot/inboxes` - List inboxes
- `POST /api/chatwoot/conversation-status` - Set Repondly status (EN_ATTENTE/RESOLUE)
- `GET /api/chatwoot/conversation-status` - Get Repondly status
- `POST /api/chatwoot/conversation-view` - Mark conversation as viewed
- `GET /api/chatwoot/conversation-view` - Get conversation view status
- `POST /api/chatwoot/status` - Update Chatwoot connection status
- `POST /api/chatwoot/webhook` - Chatwoot webhook receiver

#### Bot Routes
- `GET /api/conversation-bot` - Get bot status for conversation
- `PATCH /api/conversation-bot` - Toggle bot for conversation
- `POST /api/bot/test-message` - Test bot message

#### Config Routes
- `GET /api/config` - Get full business configuration
- `POST /api/config` - Update business configuration

#### Order Routes
- `GET /api/orders` - List orders (with status filter)
- `POST /api/orders` - Create order
- `PATCH /api/orders/[id]` - Update order status
- `DELETE /api/orders/[id]` - Delete order

#### Product Routes
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PATCH /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

#### Service Routes
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `PATCH /api/services/[id]` - Update service
- `DELETE /api/services/[id]` - Delete service

#### Schedule Routes
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PATCH /api/schedules/[id]` - Update schedule
- `DELETE /api/schedules/[id]` - Delete schedule

#### Schedule Exception Routes
- `GET /api/schedule-exceptions` - List schedule exceptions
- `POST /api/schedule-exceptions` - Create exception
- `PATCH /api/schedule-exceptions/[id]` - Update exception
- `DELETE /api/schedule-exceptions/[id]` - Delete exception

#### WhatsApp Routes
- `GET /api/whatsapp/status` - Get WhatsApp connection status
- `GET /api/whatsapp/disconnect` - Disconnect WhatsApp

#### Meta Routes
- `GET /api/meta/pages` - List connected Meta pages
- `DELETE /api/meta/pages` - Disconnect Meta page

#### Internal Routes (Secret Protected)
- `POST /api/internal/bot-event` - Bot event webhook (x-internal-secret header)
- `POST /api/internal/orders` - Internal order creation (x-internal-secret header)

#### SSE Route
- `GET /api/sse` - Server-Sent Events stream for real-time updates

#### Webhook Test
- `POST /api/webhook/test` - Test webhook endpoint

### External API Calls

#### Chatwoot API
- **Base URL:** `process.env.CHATWOOT_BASE_URL` (default: `https://inbox.repondly.com`)
- **Authentication:** `api_access_token` header (per-business token from DB)
- **Endpoint Patterns:**
  - `/api/v1/accounts/{accountId}/conversations?status={status}&page={page}`
  - `/api/v1/accounts/{accountId}/conversations/{conversationId}/messages`
  - `/api/v1/accounts/{accountId}/conversations/{conversationId}/messages` (POST)
  - `/api/v1/accounts/{accountId}/conversations/{conversationId}/toggle_status` (POST)
  - `/api/v1/accounts/{accountId}/conversations/{conversationId}/notes`
  - `/api/v1/accounts/{accountId}/inboxes`
  - `/api/v1/accounts/{accountId}/conversations/{conversationId}` (DELETE)
- **Helper Library:** `src/lib/chatwoot.ts`

#### Meta (Facebook/Instagram) API
- **App ID:** `process.env.NEXT_PUBLIC_META_APP_ID`
- **App Secret:** `process.env.META_APP_SECRET`
- **System User Token:** `process.env.META_SYSTEM_USER_TOKEN`
- **Scopes:** pages_show_list, pages_messaging, pages_read_engagement, instagram_basic, instagram_manage_messages
- **SDK:** Facebook JavaScript SDK (loaded dynamically in FacebookInstagramConnect)
- **OAuth Flow:** Server-side callback at `/api/auth/meta/callback`

---

## 8. Existing PWA Config

### Manifest.json
```json
{
  "name": "Répondly Messagerie",
  "short_name": "Répondly",
  "description": "Automate your business messages",
  "start_url": "/dashboard/accueil",
  "display": "standalone",
  "background_color": "#0A0A0F",
  "theme_color": "#0A0A0F",
  "orientation": "any",
  "version": "1.0.4",
  "icons": [
    {
      "src": "/mobile-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/mobile-icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Messagerie",
      "short_name": "Messages",
      "description": "Open messagerie",
      "url": "/dashboard/messagerie",
      "icons": [{ "src": "/mobile-icon.png", "sizes": "512x512" }]
    }
  ]
}
```

### Service Worker Registration
- **Location:** Inline script in `src/app/layout.tsx`
- **Registration Code:**
```javascript
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        }
      });
    })
    .catch((error) => console.log('Service Worker registration failed', error))
}
```

### Service Worker (sw.js)
- **Cache Version:** v4
- **Cache Names:**
  - `repondly-v4` - Dynamic cache
  - `repondly-static-v4` - Static assets cache
- **Cached Assets:**
  - `/manifest.json`
  - `/logo.png`
  - `/mobile-icon.png`
  - `/mobile-icon-maskable.png`
- **Caching Strategy:**
  - **Network-first:** HTML pages, API routes (except auth)
  - **Cache-first:** Static assets
  - **Skip:** Auth routes (`/api/auth/*`)
- **Update Flow:**
  - On update, shows confirmation dialog
  - User can choose to update immediately
  - `SKIP_WAITING` message triggers update

---

## 9. Environment Variables

### Database & Auth
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth JWT secret
- `NEXTAUTH_URL` - NextAuth base URL
- `AUTH_TRUST_HOST` - Trust host header

### Admin
- `ADMIN_EMAIL` - Admin email for legacy role assignment
- `NEXT_PUBLIC_ADMIN_EMAIL` - Public admin email (client-side)
- `INTERNAL_SECRET` - Secret for internal API routes

### Chatwoot
- `CHATWOOT_BASE_URL` - Chatwoot instance URL (default: https://inbox.repondly.com)
- `CHATWOOT_API_URL` - Alternative Chatwoot URL (used in some routes)
- `CHATWOOT_ADMIN_TOKEN` - Chatwoot admin token (for inbox creation)
- `CHATWOOT_SUPERADMIN_TOKEN` - Chatwoot superadmin token
- `CHATWOOT_ACCOUNT_ID` - Chatwoot account ID
- `CHATWOOT_WEBHOOK_SECRET` - Webhook verification secret

### Meta (Facebook/Instagram)
- `NEXT_PUBLIC_META_APP_ID` - Meta app ID (public)
- `META_APP_ID` - Meta app ID (server-side)
- `META_APP_SECRET` - Meta app secret
- `META_SYSTEM_USER_TOKEN` - Meta system user token

---

## 10. Component Inventory

### `/src/components/`

#### AppShell.tsx
- **Purpose:** Main layout shell with desktop sidebar and mobile navigation
- **Features:**
  - Desktop sidebar with navigation
  - Mobile bottom nav island
  - Mobile top header
  - Profile dropdown/sheet
  - Theme toggle
  - Channel status indicators
  - SSE for unread count
  - MobileNavContext provider

#### MobileShell.tsx
- **Purpose:** Alternative mobile-first shell (currently unused)
- **Features:**
  - Mobile-only layout
  - Bottom nav island
  - Top header
  - Profile sheet
  - Theme toggle

#### FacebookInstagramConnect.tsx
- **Purpose:** Facebook/Instagram OAuth connection component
- **Features:**
  - Facebook SDK loading
  - OAuth flow initiation
  - Connected pages list
  - Disconnect functionality
  - Error handling

#### Providers.tsx
- **Purpose:** Root provider wrapper
- **Features:**
  - SessionProvider from next-auth/react

---

## 11. Database Schema (Key Models)

### Business
- Main business entity
- Stores auth credentials (email, passwordHash)
- Chatwoot integration (accountId, apiToken)
- Channel connections (WhatsApp, Facebook, Instagram)
- Bot configuration
- Relationships to all other models

### AdminUser
- Admin users (SUPER_ADMIN, ADMIN)
- Separate from Business table
- Used for admin panel access

### ConversationStatus
- Maps Chatwoot conversation IDs to Repondly status (EN_ATTENTE/RESOLUE)
- Per-business tracking

### ConversationView
- Tracks when conversations were last viewed
- Per-business tracking

### Order
- Orders and appointments captured by bot
- Links to Chatwoot conversation

### Product / Service
- Catalog items for bot
- Pricing, availability, descriptions

### Schedule
- Business hours (per day of week)
- Open/close times

### ScheduleException
- Special hours or closures
- Date ranges

### BotConfig
- AI bot configuration
- Handover triggers, collect fields, system prompt
- Bot active toggle

### ConnectedPage
- Connected Facebook/Instagram pages
- Stores page tokens and Chatwoot inbox IDs

---

## 12. Key Libraries & Utilities

### `/src/lib/`

#### auth.ts
- NextAuth configuration with Credentials provider
- JWT and session callbacks
- AdminUser and Business authentication

#### auth.config.ts
- Edge-safe NextAuth config (no Prisma)
- Used in middleware

#### chatwoot.ts
- Chatwoot API client functions
- Type definitions for Chatwoot entities
- Helper functions: getConversations, getMessages, sendMessage, etc.

#### prisma.ts
- Prisma client singleton
- PostgreSQL adapter configuration
- Connection pooling

#### theme.ts
- Theme utilities
- `useTheme()` hook for dark/light mode
- `palette()` function for color tokens

#### sse-broadcaster.ts
- Server-side SSE broadcaster singleton
- Manages SSE connections per business
- Broadcasts events to connected clients

---

## 13. Styling System

### CSS Variables (Dark Mode)
```css
--bg: #000000
--surface: #1C1C1E
--surface2: #2C2C2E
--border: #38383A
--border2: #48484A
--text: #FFFFFF
--text2: #EBEBF5
--text3: #8E8E93
--accent: #0A84FF
--success: #30D158
--danger: #FF453A
--warning: #FF9F0A
```

### CSS Variables (Light Mode)
```css
--bg: #F2F2F7
--surface: #FFFFFF
--surface2: #F9F9F9
--border: #C6C6C8
--border2: #D1D1D6
--text: #000000
--text2: #3A3A3C
--text3: #8E8E93
--accent: #007AFF
--success: #34C759
--danger: #FF3B30
--warning: #FF9500
```

### Theme Toggle
- Stored in `localStorage` as `rp_theme`
- Applied to `document.documentElement` as `data-theme` attribute
- Initial detection via `prefers-color-scheme` media query

---

## 14. Real-Time Architecture

### SSE Flow
1. Client connects to `/api/sse`
2. Server authenticates session
3. Server subscribes client to business-specific channel
4. Webhook or internal event triggers `sseBroadcaster.broadcast(businessId, event)`
5. All connected clients for that business receive event
6. Client updates UI based on event type

### Event Types
- `connected` - Initial connection acknowledgment
- `message_created` - New message in conversation
- `conversation_created` - New conversation created
- `conversation_status_changed` - Conversation status updated

### Webhook Integration
- Chatwoot webhooks hit `/api/chatwoot/webhook`
- Webhook verifies via `CHATWOOT_WEBHOOK_SECRET`
- Webhook triggers internal events
- Internal events broadcast via SSE

---

## 15. Bot Integration

### Bot Event Flow
1. Bot processes message in separate service
2. Bot sends event to `/api/internal/bot-event` with `INTERNAL_SECRET`
3. Event logged to BotEvent table
4. If order/appointment created, sends to `/api/internal/orders`
5. SSE broadcasts update to dashboard

### Bot Configuration
- Stored in BotConfig model
- Includes:
  - System prompt
  - Required fields for orders/appointments
  - Handover triggers
  - Collect fields
  - Strict instruction block
  - Handover phone number
  - Default language
  - Bot active toggle

### Per-Conversation Bot Toggle
- Stored in ConversationLog model
- Can be enabled/disabled per conversation
- UI toggle in Messagerie

---

## 16. Channel Integration

### WhatsApp
- Embedded Signup flow
- Stores: wabaId, whatsappPhoneNumberId, whatsappInboxId
- Status check via `/api/whatsapp/status`
- Disconnect via `/api/whatsapp/disconnect`

### Facebook/Instagram
- OAuth flow via Facebook SDK
- Stores: facebookPageId, facebookPageToken, facebookInboxId
- Instagram: instagramAccountId, instagramInboxId
- Connection managed by FacebookInstagramConnect component
- Pages listed via `/api/meta/pages`

---

## 17. Deployment Notes

### Ports
- Dashboard App: 3004 (dev), production varies
- Admin Internal: 3006 (dev), production varies

### Environment
- Monorepo structure
- Shared Prisma schema
- Separate Next.js apps per domain

### Build
- `npm run build` - Production build
- `npm start` - Production server
- `npm run dev` - Development server

---

## 18. Known Patterns & Conventions

### Code Style
- TypeScript strict mode
- No `any` types (fatal)
- Pure functions preferred
- Early returns
- Minimal abstractions

### File Organization
- App Router structure
- API routes in `src/app/api/`
- Components in `src/components/`
- Utilities in `src/lib/`
- Types inline or in component files

### Error Handling
- Try-catch in async functions
- Console.error for debugging
- User-facing error messages in UI
- API returns `{ success: boolean, data?: any, error?: string }`

### State Management
- Local component state (useState)
- No global state library
- Context only where necessary (MobileNavContext)
- Server state via fetch (no React Query)

### Styling
- Inline styles (style prop)
- Tailwind for utility classes (minimal usage)
- CSS variables for theming
- No CSS modules or styled-components

---

**End of Architecture Documentation**
