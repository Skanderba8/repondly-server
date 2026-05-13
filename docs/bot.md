# Bot Engine Context
- **Purpose**: Processes incoming messages, queries AI, and sends auto-replies.
- **Execution**: Runs as a background worker via PM2 (`pm2 start ecosystem.config.js --only bot`).
- **Logic Flow**:
  1. Receive message from Redis queue.
  2. Check tenant rate limits.
  3. Retrieve tenant's AI context (RAG).
  4. Generate response via LLM provider.
  5. Push response to Chatwoot service queue.
- **Constraints**:
  - MUST be stateless. Any instance can be killed at any time.
  - Always implement exponential backoff for LLM API calls.
  - Timeout after 15 seconds. Fallback to human routing.