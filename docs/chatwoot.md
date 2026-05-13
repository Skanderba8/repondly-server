# Chatwoot Integration Context
- **Purpose**: Two-way sync between Repondly and Chatwoot.
- **Inbound**: Webhooks from Chatwoot hit `/api/webhooks/chatwoot`. 
  - Validate webhook signature using `CHATWOOT_WEBHOOK_SECRET`.
  - Parse `message_created` events. Ignore internal notes.
- **Outbound**: API calls to Chatwoot use the Chatwoot Client utility (`src/lib/chatwoot`).
  - Always use the tenant's specific Chatwoot API token.
- **Invariants**:
  - Prevent infinite loops: Always check `sender.type !== 'bot'` before replying.