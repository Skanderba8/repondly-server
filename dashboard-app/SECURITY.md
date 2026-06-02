# Répondly Dashboard Security Model

## Authentication

- **NextAuth v5** with Credentials provider (email + password).
- All dashboard pages under `/dashboard/:path*` and all API routes under `/api/*` are protected by `middleware.ts`.
- Unauthenticated requests to API routes receive **JSON 401**; unauthenticated page requests are redirected to `/auth/signin`.

## Tenant Isolation (IDOR Prevention)

- Every authenticated API route uses `requireAuth()` which returns the real `businessId` from the session (`session.user.id`).
- **Client-supplied `businessId` is never trusted.** Routes that previously accepted `businessId` from the body or query string now override it with the authenticated value.
- Resource update/delete routes (e.g., `/api/products/[id]`, `/api/services/[id]`, `/api/schedules/[id]`, `/api/schedule-exceptions/[id]`) verify that the requested resource belongs to the authenticated business before mutating it.

## Public API Routes (Intentionally Unprotected)

| Route | Why Public |
|-------|------------|
| `/api/auth/[...nextauth]` | NextAuth callbacks (sign-in, CSRF, session) |
| `/api/chatwoot/webhook` | Chatwoot pushes events; protected by HMAC signature |
| `/api/internal/*` | Bot-to-dashboard internal calls; protected by `x-internal-secret` header |
| `/api/health` (if added) | Standard health-check endpoint |
| `/api/bot/test-message` | Internal bot testing; excluded from middleware matcher |
| `/api/webhook/test` | Webhook connectivity testing; excluded from middleware matcher |

## Webhook Verification

- Both the **dashboard** (`/api/chatwoot/webhook`) and the **bot** (`/chatwoot-webhook`) verify incoming webhooks with **HMAC-SHA256**.
- The secret is `CHATWOOT_WEBHOOK_SECRET`.
- Dashboard supports `x-hub-signature-256` and falls back to `x-chatwoot-webhook-token`.
- Bot supports `x-hub-signature-256` and falls back to `x-chatwoot-webhook-signature`.
- `crypto.timingSafeEqual` is used to prevent timing attacks.

## Rate Limiting

- Sign-in attempts are rate-limited to **5 per IP per minute** using an in-memory `Map`.
- This is a basic protection; a Redis-backed limiter should be considered for multi-instance deployments.

## What Is Protected

| Layer | Protection |
|-------|------------|
| Pages | `/dashboard/*` requires session cookie |
| API (middleware) | `/api/*` requires session cookie, except public routes above |
| API (handler) | `requireAuth()` enforces session + extracts `businessId` |
| Data access | Prisma queries scoped to `businessId` from session |
| Webhooks | HMAC-SHA256 signature verification |
| Auth brute-force | 5 attempts / IP / minute |

## Notes

- The in-memory rate limiter does **not** share state across PM2 processes. For production scale, migrate to Redis (`@upstash/ratelimit` or similar).
- Internal routes rely on a shared `INTERNAL_SECRET` header. Ensure this secret is strong and rotated regularly.
