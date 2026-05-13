# Authentication Flow Context
- **System**: JWT-based custom auth.
- **Tokens**:
  - Access Token: 15m lifespan.
  - Refresh Token: 7d lifespan, stored in DB, sent as HttpOnly cookie.
- **Middleware**: `requireAuth` in `src/middleware/auth.ts`. Attaches `req.user` and `req.tenantId`.
- **Security**:
  - Passwords hashed with bcrypt (cost 12).
  - Rate limit login attempts (5 per 15 mins per IP).