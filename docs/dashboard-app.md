# Dashboard App Context
- **Stack**: Next.js (App Router), Tailwind CSS, React Query, Zustand.
- **Routing**: All pages under `app/(dashboard)`.
- **Data Fetching**: Use React Query hooks in `src/hooks/api`. Do NOT use `fetch` directly in components.
- **State**: Zustand for global UI state (sidebar, active tenant). Local state via `useState`.
- **Forms**: `react-hook-form` + `zod`. Schemas live in `src/lib/validations`.
- **Invariants**: 
  - Every page must check `useAuth()` and redirect to `/login` if unauthenticated.
  - Never expose internal API keys in the frontend.