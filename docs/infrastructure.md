# Infrastructure & PM2 Context
- **Runtime**: Node.js 20+.
- **Process Management**: PM2. Configuration in `ecosystem.config.js`.
- **Services**:
  - `api`: Main Express server.
  - `bot-worker`: Processes AI queues.
  - `cron`: Scheduled tasks (runs exactly 1 instance to avoid duplicate jobs).
- **Environment Variables**: Validated at startup using `zod` in `src/env.ts`. Server crashes immediately if env is invalid.