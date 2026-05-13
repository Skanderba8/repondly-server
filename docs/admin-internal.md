# Admin Panel Context
- **Purpose**: Internal tool for Repondly staff. Superuser access only.
- **Stack**: React (Vite), Tailwind, simple REST client.
- **Auth**: Requires `role === 'SUPERADMIN'`. Middleware enforces this on `/api/admin/*`.
- **Patterns**:
  - Favor data density over aesthetics. Use large data tables.
  - Direct database mutations are allowed here (e.g., force-deleting a tenant) but MUST be logged to the audit trail.