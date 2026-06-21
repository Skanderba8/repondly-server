# Repondly Bot Architecture

This document is the working context for future bot edits. The bot should behave like a Tunisian business assistant, not like a generic prompt wrapper.

## Runtime Pipeline

1. Receive inbound customer message from the channel webhook.
2. Load recent conversation history and trusted business data.
3. Detect customer language style: Tunisian Arabizi, Tunisian Arabic script, French, mixed, or English.
4. Route intent and extract explicit entities such as product, quantity, size, phone, and customer name.
5. Merge extracted data into conversation order state.
6. Answer deterministic intents with templates when possible.
7. Use the fallback LLM only for cases that need natural language reasoning.
8. Execute validated actions before sending final confirmation replies.
9. Store usage, order state, handoff summaries, and outbound messages.

The model may interpret and phrase replies. The app owns state, validation, prices, delivery rules, order creation, and handoff.

## Tunisian Dialect Policy

The bot mirrors the customer's style:

- Tunisian Arabizi input gets short, natural Tunisian Arabizi.
- Arabic-script Tunisian input gets simple Tunisian Arabic or clear Arabic.
- French input gets professional French with a light Tunisian business tone.
- Mixed French/Tunisian input gets a mixed answer without exaggerated dialect.
- English input gets simple English.

Never force Arabizi customers into French. Never rely on corrupted Arabic strings. Keep templates ASCII-safe unless a file is intentionally written and verified as UTF-8.

Common Tunisian signals:

- `nheb ncommandi`, `n7eb ne5ou`, `9adeh`, `ch7al`, `fama`, `mawjoud`
- `tawsil`, `tou9sel`, `tnajmou touslou`, `souma`, `soum`
- `behi`, `ey`, `sahha`, `bellehi`, `wa9tech`, `win`

## Intent And State

The router classifies the latest message into one intent and explicit slots. Business requests beat greetings when both appear.

Core intents:

- greeting
- product inquiry
- product details
- price inquiry
- size or variant inquiry
- delivery inquiry
- payment inquiry
- order start
- order name
- order phone
- negotiation
- complaint
- human request
- unknown

Order state lives on the conversation and should move through:

- browsing
- collecting
- confirming
- done

Current required fields are product, variant when required, customer name, and phone. Delivery address is tracked but not yet enforced by the deterministic state machine.

## Business Knowledge And RAG Direction

Current v1 context comes from:

- active products and variants
- product images
- business hours
- delivery zones and fees
- payment methods
- policies
- FAQ
- custom business instructions

The current implementation formats this into prompt context and deterministic templates. The next RAG step should split `Business.botKnowledge` into indexed sources and chunks:

- `BusinessKnowledgeSource`
- `BusinessKnowledgeChunk`
- optional pgvector embeddings after a text-search MVP

Retrieval should return only relevant facts for the latest intent. The model must not invent data when retrieval finds no answer.

## Tool And Action Rules

Actions are app-owned side effects. The model can request an action, but the app validates and executes it.

Supported actions:

- human handoff
- order complete
- appointment complete, currently treated as manual handoff

Order confirmations must be sent only after order creation succeeds. If order creation fails, the customer receives a manual verification reply instead of a fake confirmation.

## Files To Edit Carefully

- `src/lib/ai/groq.ts`: orchestration, routing, slot merge, fallback LLM call.
- `src/lib/ai/templates.ts`: deterministic customer-facing replies.
- `src/lib/ai/slots.ts`: order state extraction and confirmation detection.
- `src/lib/ai/actions.ts`: validated side effects.
- `src/app/api/unipile/webhooks/route.ts`: live channel ordering and outbound sends.
- `src/app/api/bot/test/route.ts`: bot playground behavior.

Keep edits scoped. Do not put new business rules only in prompts if they affect orders, pricing, delivery, or handoff.

## Evaluation Scenarios

Future evals should cover:

- `nheb ncommandi`
- `fama livraison l Ariana?`
- `9adeh soumha?`
- `mawjoud taille L?`
- `ena Ahmed`
- Tunisian phone number extraction
- product variant selection
- explicit `oui` or `ey` confirmation
- complaint handoff after repeated complaints
- unknown price or delivery data handoff

Acceptance rules:

- no invented price
- no invented delivery zone
- no order creation before explicit confirmation
- no customer confirmation before order creation succeeds
- reply language mirrors the customer's style
