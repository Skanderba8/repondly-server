# Repondly PWA Full Rebuild Plan

Complete UI rebuild of the Repondly dashboard app with a premium B2B aesthetic, new design tokens, and component architecture improvements.

## Design Direction
**Aesthetic:** Linear meets WhatsApp — crisp, fast, native-feeling with personality. Premium French ecommerce B2B messaging SaaS.
- **Typography:** Syne (headings/display) + DM Sans (body/UI). Weight extremes (200 vs 800), 3x+ size jumps.
- **Colors:** Light mode hero (#F5F5F7 base), iOS blue accent (#007AFF/#0A84FF). No purple gradients.
- **Motion:** Framer Motion for all transitions. Spring response (stiffness 400, damping 20). One orchestrated page load.
- **Backgrounds:** Apple-esque warm white light mode, pure black dark mode. Subtle noise texture. Sharp shadow differentiation.

## Architecture Decisions (Based on Your Feedback)
1. **ThreadView route extraction:** Use Next.js `<Link>` components in ConversationItem. Navigate to `/dashboard/messagerie/[id]` on tap. URL reflects open conversation immediately.
2. **CSS variable migration:** Spread across phases as components are touched. Replace `--bg`/`--surface` with `--color-bg`/`--color-surface` incrementally.
3. **IslandNav hiding:** Replace MobileNavContext with pathname-based detection in IslandNav component. Hide when pathname matches `/dashboard/messagerie/[id]` pattern.
4. **Desktop sidebar:** Rebuild with new design tokens, keeping layout structure but applying new visual system.
5. **MessagerieView deprecation:** Once ThreadView is extracted to [id]/page.tsx in Phase 6b, MessagerieView.tsx is fully deleted (not left as partial file).
6. **Messagerie layout.tsx status:** Does NOT exist currently. Phase 6b will need to create it from scratch.

---

## PHASE 1 — Design tokens, globals.css, theme init script, root layout PWA meta, fonts

**Create `src/app/globals.css`** with new design token system:
- Define CSS variables for light/dark modes (`--color-bg`, `--color-surface`, etc.)
- Add radius tokens (`--radius-island`, `--radius-card`, etc.)
- Add shadow tokens (`--shadow-card`, `--shadow-island`, etc.)
- Add layout tokens (`--topbar-height`, `--island-height`, safe-area insets)
- Add noise texture SVG for backgrounds
- Add shimmer animation keyframe for skeletons

**Update `src/app/layout.tsx`:**
- Replace inline CSS with import of globals.css
- Add Google Fonts preconnect for Syne and DM Sans
- Update font imports to Syne (weights 200, 400, 600, 800) and DM Sans (weights 400, 500, 700)
- Add theme init script in `<head>` before any component renders (prevents flash)
- Update viewport meta for proper mobile handling
- Update PWA meta tags (theme-color to #007AFF)
- Keep existing service worker registration

**Files to modify:**
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

---

## PHASE 2 — BottomSheet primitive, ProfileSheet, ThemeToggle, PageTransition, LoadingScreen

**Create `src/components/ui/BottomSheet.tsx`:**
- Reusable bottom sheet primitive
- Fixed position, full width, bottom: 0
- Border-radius 24px top corners
- Entry animation: y: '100%' → 0, spring (stiffness 350, damping 35)
- Backdrop: rgba(0,0,0,0.3) fade in, tap to close
- Drag handle bar (40px wide, 4px tall, centered)
- Safe area padding-bottom

**Create `src/components/shell/ProfileSheet.tsx`:**
- Use BottomSheet primitive
- User name (Syne 700 17px) + email (DM Sans 14px muted)
- Divider
- "Apparence" row with ThemeToggle
- "Déconnexion" row in danger color, calls signOut
- Safe area padding

**Create `src/components/shell/ThemeToggle.tsx`:**
- Sun/moon animated icon swap
- Toggle theme on tap
- Use existing localStorage key `rp_theme`

**Create `src/components/ui/PageTransition.tsx`:**
- Wrapper component with Framer Motion
- Initial: opacity 0, y: 10
- Animate: opacity 1, y: 0
- Exit: opacity 0, y: 6
- Duration 0.22s, ease 'easeOut'

**Create `src/components/ui/LoadingScreen.tsx`:**
- Full screen, background: var(--color-bg)
- Center: Répondly wordmark in Syne 700 28px
- Three 6px circles with staggered pulse animation
- Entry: fade in (0.3s)
- Exit: scale up + fade out (0.4s ease-in)
- Guard: sessionStorage.getItem('rp_app_loaded')
- Set sessionStorage after exit

**Create `src/components/providers/ThemeProvider.tsx`:**
- Extract theme logic from AppShell
- Provide theme context to app

**Files to create:**
- `src/components/ui/BottomSheet.tsx`
- `src/components/shell/ProfileSheet.tsx`
- `src/components/shell/ThemeToggle.tsx`
- `src/components/ui/PageTransition.tsx`
- `src/components/ui/LoadingScreen.tsx`
- `src/components/providers/ThemeProvider.tsx`

---

## PHASE 3 — TopBar + IslandNav (AppShell rebuilt with new components)

**Create `src/components/shell/TopBar.tsx`:**
- Props: title, showOnScroll (optional)
- Layout: 56px height + safe-top padding
- Logo: "Répondly" in Syne 700 18px, var(--color-accent)
- Title: Syne 600 15px, absolutely centered
- Avatar: 36px circle, opens ProfileSheet on tap
- Background: var(--color-surface), border-bottom
- Scroll behavior: opacity/y tied to scroll direction (via useScroll from parent)

**Create `src/components/shell/IslandNav.tsx`:**
- Position: fixed, centered horizontally, bottom with safe-area
- Width: calc(100% - 48px), max-width 400px
- Height: 64px
- Background: var(--color-surface) with backdrop-filter
- Border-radius: var(--radius-island)
- 4 nav items with icon + label
- Active pill background with Framer Motion layoutId
- Spring response on tap (stiffness 500, damping 18)
- Unread badge on Messagerie
- Hide/show via pathname detection (/dashboard/messagerie/[id])
- Desktop: display: none above 768px

**Rebuild `src/components/AppShell.tsx`:**
- Extract desktop sidebar into separate component (keep logic, apply new tokens)
- Replace mobile header with TopBar component
- Replace mobile nav island with IslandNav component
- Replace profile sheet with ProfileSheet component
- Replace theme toggle with ThemeToggle component
- Remove MobileNavContext (replaced with pathname-based detection)
- Apply new design tokens to desktop sidebar
- Keep SSE logic for unread count
- Keep channel status indicators

**⚠️ QA RISK — Desktop Sidebar Inline Styles:**
Before touching AppShell.tsx, audit for inline styles that may override new CSS tokens:
- Background colors (sidebarBg, dropdownBg, etc.)
- Border colors (sidebarBorder, topBarBorder, etc.)
- Text colors (textPrimary, textMuted, etc.)
- Hover states (hoverBg, activeBg)
- Shadow values
- Any hardcoded color values that should use CSS variables instead

**Files to create:**
- `src/components/shell/TopBar.tsx`
- `src/components/shell/IslandNav.tsx`

**Files to modify:**
- `src/components/AppShell.tsx` (major refactor)

---

## PHASE 4 — Messagerie: ConversationList, ConversationItem, ChannelFilter, skeletons

**Create `src/components/messagerie/ConversationList.tsx`:**
- Extract from MessagerieView.tsx
- Full height between TopBar and IslandNav
- Scrollable with overscroll-behavior: contain
- ChannelFilter strip (sticky below TopBar)
- Search bar (sticky below filter)
- ConversationItem list
- Loading state with 6 SkeletonCard items
- Keep SSE logic for real-time updates
- Keep 30s polling fallback

**Create `src/components/messagerie/ConversationItem.tsx`:**
- Height: 72px, padding: 12px 16px
- Left: 44px avatar circle with channel badge
- Center: Contact name (Syne 600 14px) + last message (DM Sans 13px muted)
- Right: Timestamp (DM Sans 11px) + unread badge
- Unread state: background var(--color-accent-soft), left border 3px var(--color-accent)
- Read state: background transparent
- On tap: scale 0.98 feedback, then navigate to /dashboard/messagerie/[id]
- Divider: 1px var(--color-border) inset left 72px
- Use Next.js Link component

**Create `src/components/messagerie/ChannelFilter.tsx`:**
- Horizontal pill tabs: Tous / WhatsApp / Facebook & Instagram
- Active pill: background var(--color-accent), white text
- Inactive: background var(--color-surface-2), muted text
- Smooth width-transition via Framer Motion layoutId
- Show count badge on each tab

**Create `src/components/ui/SkeletonCard.tsx`:**
- Reusable skeleton for conversation items
- Shimmer animation using keyframes from globals.css
- Height: 72px

**Create `src/components/messagerie/ConversationSkeleton.tsx`:**
- Use SkeletonCard for conversation list loading state

**Update `src/app/dashboard/messagerie/page.tsx`:**
- Replace MessagerieView with ConversationList
- Wrap in PageTransition
- Pass data fetching logic to ConversationList

**Migrate CSS variables in MessagerieView.tsx:**
- Replace old token names with new ones as we touch the file

**Files to create:**
- `src/components/messagerie/ConversationList.tsx`
- `src/components/messagerie/ConversationItem.tsx`
- `src/components/messagerie/ChannelFilter.tsx`
- `src/components/ui/SkeletonCard.tsx`
- `src/components/messagerie/ConversationSkeleton.tsx`

**Files to modify:**
- `src/app/dashboard/messagerie/page.tsx`
- `src/app/dashboard/messagerie/MessagerieView.tsx` (partial migration)

---

## PHASE 5 — Accueil page: KPI cards + recent conversations

**Rebuild `src/app/dashboard/accueil/page.tsx`:**
- Wrap in PageTransition
- KPI cards: 3 cards in row (2+1 on narrow mobile)
  - Background: var(--color-surface), border-radius var(--radius-card), box-shadow var(--shadow-card)
  - Icon top-left (colored: accent, success, warning)
  - Large number in Syne 800 28px
  - Label in DM Sans 13px muted
  - Entry animation: staggered y: 16, opacity 0 → y: 0, opacity 1 (0.05s delay)
- Recent conversations list:
  - Reuse ConversationItem component (created in Phase 4)
  - Section header: Syne 600 13px uppercase tracking-wide muted "RÉCENTES"
  - Max 5 items
  - "Voir tout" link to /dashboard/messagerie
- Refresh button: circular arrow icon, spins on load
- Keep SSE logic and data fetching
- Migrate CSS variables to new token names

**Files to modify:**
- `src/app/dashboard/accueil/page.tsx`

---

## PHASE 6 — Messagerie ThreadView components (6a: components only)

**Create `src/components/messagerie/ConversationTopBar.tsx`:**
- Same 56px height + safe-area as TopBar
- Left: ← back button (ChevronLeft 22px), calls router.back()
- Center: Avatar 32px + contact name Syne 600 15px
- Right: MoreVertical icon (reserved)
- Background: var(--color-surface), border-bottom

**Create `src/components/messagerie/ThreadView.tsx`:**
- Extract from MessagerieView
- Messages area: flex-col, scrollable, padding 12px 16px 90px
- Scroll to bottom on mount and new message
- Day dividers: sticky, centered pill
- New message entry animation: y: 12, opacity 0 → y: 0, opacity 1

**Create `src/components/messagerie/MessageBubble.tsx`:**
- Sent (outgoing): right-aligned, background var(--color-accent), white text
- Received: left-aligned, background var(--color-surface-2), var(--color-text)
- Max-width: 80%
- Border-radius with tail on appropriate corner
- Text: DM Sans 15px, line-height 1.45
- Timestamp: DM Sans 10px inside bubble
- Optimistic message: 0.6 opacity, small clock icon

**Create `src/components/messagerie/SendBar.tsx`:**
- Position: fixed, bottom with safe-area
- Full width, background var(--color-surface), border-top
- Input: auto-growing textarea, max 4 lines
- Send button: overlaid inside input, 34px circle, var(--color-accent)
- Disabled → opacity 0.3 when empty
- Keep optimistic UI logic
- Enter sends, Shift+Enter newlines

**Files to create:**
- `src/components/messagerie/ConversationTopBar.tsx`
- `src/components/messagerie/ThreadView.tsx`
- `src/components/messagerie/MessageBubble.tsx`
- `src/components/messagerie/SendBar.tsx`

---

## PHASE 7 — Messagerie route extraction (6b: [id]/page.tsx, layout, MessagerieView deletion)

**Create `src/app/dashboard/messagerie/[id]/page.tsx`:**
- Extract ThreadView from MessagerieView into separate route
- URL: /dashboard/messagerie/[id]
- Full-page route
- IslandNav hidden via pathname detection
- TopBar replaced by ConversationTopBar
- Page entry/exit animation: x: 60, opacity 0 → x: 0, opacity 1 (spring)
- Keep all data fetching logic (messages, notes, bot status, etc.)
- Keep SSE logic for real-time message updates

**Create `src/app/dashboard/messagerie/layout.tsx`:**
- Does NOT exist currently — create from scratch
- Add AnimatePresence with mode="wait"
- Key on pathname for route transitions
- Wrap children in PageTransition

**Delete `src/app/dashboard/messagerie/MessagerieView.tsx`:**
- Fully deprecated after ThreadView extraction
- All logic moved to ConversationList (Phase 4) and [id]/page.tsx (Phase 7)
- Delete file entirely — do not leave as partial

**Files to create:**
- `src/app/dashboard/messagerie/[id]/page.tsx`
- `src/app/dashboard/messagerie/layout.tsx`

**Files to delete:**
- `src/app/dashboard/messagerie/MessagerieView.tsx`

---

## PHASE 8 — Commandes page

**Rebuild `src/app/dashboard/commandes/page.tsx`:**
- Wrap in PageTransition
- Filter tabs: same pill pattern as ChannelFilter
  - Tous / En attente / Confirmées / Annulées
  - Use Framer Motion layoutId for smooth transitions
- Order card:
  - Background: var(--color-surface), border-radius var(--radius-card), box-shadow var(--shadow-card)
  - Padding 16px
  - Top row: client name (Syne 600 15px) + status pill right
  - Middle: phone, notes, type badge (COMMANDE vs RDV)
  - Bottom: timestamp muted + action buttons (icon buttons)
- Add order: Floating + button, bottom-right
  - 52px circle, background var(--color-accent), box-shadow var(--shadow-island)
  - On tap → open BottomSheet with add form
- Keep all existing data fetching and form logic
- Migrate CSS variables to new token names

**Files to modify:**
- `src/app/dashboard/commandes/page.tsx`

---

## PHASE 9 — Configuration page (tab nav + all 5 tabs)

**Rebuild `src/app/dashboard/configuration/page.tsx`:**
- Wrap in PageTransition
- Tab navigation: horizontal scrollable pill tabs at top
  - 5 tabs: Entreprise / Bot / Horaires / Catalogue / Canaux
  - Same pattern as ChannelFilter (Framer Motion layoutId)
- Each tab content:
  - Section cards: background var(--color-surface), border-radius var(--radius-card), box-shadow var(--shadow-card)
  - Padding 20px, margin-bottom 12px
  - Form inputs: background var(--color-surface-2), border 1px solid var(--color-border), border-radius 10px
  - Height 44px, DM Sans 15px
  - Focus → border var(--color-accent) with box-shadow 0 0 0 3px var(--color-accent-soft)
  - Save button: full width, background var(--color-accent), white, Syne 600 15px, 48px height, border-radius 12px
- Keep all existing data fetching and form state logic
- Keep FacebookInstagramConnect as dynamic import
- Migrate CSS variables to new token names

**Files to modify:**
- `src/app/dashboard/configuration/page.tsx`

---

## PHASE 10 — Auth signin page UI rebuild

**Rebuild `src/app/auth/signin/page.tsx`:**
- Keep all signIn() and NextAuth logic
- Single centered card on all screen sizes (mobile-first)
  - Background: var(--color-surface)
  - Border-radius: var(--radius-card)
  - Box-shadow: var(--shadow-card)
  - Max-width: 400px, padding: 32px
  - Centered on var(--color-bg) background
- Logo/wordmark at top: Syne 800 26px "Répondly", color var(--color-accent)
- Subtitle: DM Sans 14px muted "Connectez-vous à votre espace"
- Inputs: same style as Configuration forms
- Login button: same style as Configuration save button
- Error state: red border on inputs + error message pill below (DM Sans 13px)
- Remove two-panel desktop layout
- Migrate CSS variables to new token names

**Files to modify:**
- `src/app/auth/signin/page.tsx`

---

## PHASE 11 — Service worker caching update + manifest update

**Update `/public/sw.js`:**
- Update cache version to v5
- Replace cache logic with new strategies:
  - `/_next/static/**` → CacheFirst (30 days)
  - `/api/chatwoot/conversations**` → NetworkFirst (5 min stale fallback)
  - `/api/chatwoot/messages/**` → NetworkFirst (no stale)
  - `/api/auth/**` → NetworkOnly (never cache)
  - `/api/sse` → NetworkOnly (streaming)
  - Navigation (HTML) → StaleWhileRevalidate
  - Images → CacheFirst (7 days)

**Update `/public/manifest.json`:**
- Keep all existing fields
- Update theme_color to "#007AFF"

**Files to modify:**
- `/public/sw.js`
- `/public/manifest.json`

---

## PHASE 12 — QA pass: safe-area on iOS, dark mode all screens, skeleton states, animation timing, touch targets 44px minimum

**QA Checklist:**
- Safe-area insets work correctly on iOS (notch, home indicator)
- Dark mode works on all screens (toggle persists, no flash)
- Skeleton states show on all pages during loading
- Animation timing feels natural (not too fast/slow)
- All touch targets are minimum 44px (buttons, taps)
- IslandNav hides correctly on ThreadView route
- Back button works in ThreadView
- URL updates correctly when opening conversation
- Browser back button works from ThreadView to list
- SSE real-time updates still work
- PWA installs and launches correctly
- Service worker caches properly
- Fonts load correctly (Syne, DM Sans)
- Noise texture visible on backgrounds
- Shadows are correct (not too dark/spread)
- Typography hierarchy is clear (weight/size differences)

**Fix any issues found during QA.**

---

## Summary of New Component Structure

```
src/components/
  shell/
    AppShell.tsx           (rebuilt)
    TopBar.tsx             (new)
    IslandNav.tsx          (new)
    ProfileSheet.tsx       (new)
    ThemeToggle.tsx        (new)
  messagerie/
    ConversationList.tsx   (new)
    ConversationItem.tsx   (new)
    ConversationTopBar.tsx (new)
    ThreadView.tsx         (new)
    MessageBubble.tsx      (new)
    SendBar.tsx            (new)
    ChannelFilter.tsx      (new)
    ConversationSkeleton.tsx (new)
  ui/
    LoadingScreen.tsx      (new)
    PageTransition.tsx     (new)
    SkeletonCard.tsx       (new)
    BottomSheet.tsx        (new)
  providers/
    Providers.tsx          (existing, add ThemeProvider)
    ThemeProvider.tsx      (new)
```

## Route Structure Changes

```
src/app/dashboard/messagerie/
  page.tsx                (ConversationList)
  [id]/page.tsx           (ThreadView - NEW)
```
