# Bugfix Requirements Document

## Introduction

The admin dashboard at `app.repondly.com/admin` is broken in production. The browser console shows multiple 404 errors for Next.js JavaScript chunk files (e.g. `main-app-b321c798a7e901f4.js`, `layout-d0540a692c2b066a.js`, `619-ba102abea3e3d0e4.js`, and others). As a consequence, the React application never hydrates, leaving the sidebar in a partially-rendered state where only icons are visible with no text labels.

**Root cause:** The nginx reverse proxy configuration routes `location /admin` to `admin-internal` on port 3006, but does not route `/_next/static/*` or `/_next/data/*` to that same service. Those asset requests fall through to the catch-all `location /` block, which proxies to `dashboard-app` on port 3004 — a different Next.js application that does not contain those chunk files. The result is systematic 404s for every JavaScript chunk that the admin app needs to boot.

The sidebar icons-only symptom is a direct consequence: without the client-side JS chunks, React cannot hydrate the `AdminSidebar` component, so the `AnimatePresence`-controlled text labels (which require client-side rendering) never appear.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a browser requests `/_next/static/chunks/main-app-b321c798a7e901f4.js` after loading an `/admin` page THEN the system returns HTTP 404 because nginx routes the `/_next/` path to `dashboard-app:3004` instead of `admin-internal:3006`

1.2 WHEN a browser requests any `/_next/static/chunks/*.js` file required by the admin dashboard THEN the system returns HTTP 404 for all such chunk files (e.g. `layout-d0540a692c2b066a.js`, `619-ba102abea3e3d0e4.js`, `316-bbf916da746d70a1.js`, `733-00fb76974a5a335a.js`, `735-9382867c1dff786c.js`, `page-9ff3e50d67343205.js`, `layout-9614b4ca49198a0f.js`)

1.3 WHEN the JavaScript chunks fail to load with 404 errors THEN the system leaves the React application in a non-hydrated state, rendering only the server-side HTML skeleton

1.4 WHEN the React application fails to hydrate on an `/admin` page THEN the system displays the `AdminSidebar` with icons only and no text labels, because the `AnimatePresence`-controlled `<motion.span>` elements for nav labels require client-side JS to render

### Expected Behavior (Correct)

2.1 WHEN a browser requests `/_next/static/chunks/*.js` while on an `/admin` page THEN the system SHALL proxy those requests to `admin-internal:3006` and return the correct JavaScript chunk files with HTTP 200

2.2 WHEN a browser requests `/_next/data/*` or `/_next/image/*` paths while on an `/admin` page THEN the system SHALL proxy those requests to `admin-internal:3006` so that all Next.js runtime assets are served correctly

2.3 WHEN all JavaScript chunks load successfully THEN the system SHALL fully hydrate the React application on `/admin` pages

2.4 WHEN the React application hydrates successfully on an `/admin` page THEN the system SHALL display the `AdminSidebar` with both icons and text labels visible for all navigation items

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a browser requests any path under `dashboard-app` (i.e. paths not under `/admin`, `/bot/`, `/chatwoot-webhook`) THEN the system SHALL CONTINUE TO proxy those requests to `dashboard-app:3004` without interference

3.2 WHEN a browser requests `/_next/static/*` or `/_next/data/*` while on a `dashboard-app` page (non-admin route) THEN the system SHALL CONTINUE TO serve those assets from `dashboard-app:3004`

3.3 WHEN a browser requests `/bot/*` or `/chatwoot-webhook` THEN the system SHALL CONTINUE TO proxy those requests to the bot service on port 3001

3.4 WHEN an authenticated admin user navigates between admin pages THEN the system SHALL CONTINUE TO enforce authentication and role-based access control as implemented in `AdminLayout`

3.5 WHEN the `AdminSidebar` is in collapsed state THEN the system SHALL CONTINUE TO show only icons (no text) as the intended collapsed UI behavior
