# Requirements Document

## Introduction

This document specifies requirements for the comprehensive client dashboard refactor. The feature rebuilds the client management views (`admin/clients/[id]/page.tsx` and `OverviewClient.tsx`) into a unified, powerful control center for the admin-internal app. The dashboard provides a single-page view where all client data and configurations are immediately visible and editable.

## Glossary

- **Dashboard**: The comprehensive client control center page that displays all client information in a unified view.
- **Business**: The company/client entity stored in PostgreSQL, accessed via Prisma.
- **Chatwoot**: External messaging platform API (http://127.0.0.1:3000) used for conversation management.
- **AutoRule**: Automated bot rules configured for a client's WhatsApp channel.
- **AI System Prompts**: Configuration for the AI bot including tone, FAQs, and routing rules.
- **Credentials Section**: UI section displaying Chatwoot Account ID and API Token.
- **Bot AI Prompt Section**: UI section displaying and editing AI system prompts and bot configurations.
- **Recent Chats Section**: UI section displaying recent conversations fetched from Chatwoot API.
- **Prisma**: ORM for PostgreSQL database access on port 5433.
- **Server Actions**: Next.js server actions for data mutation.
- **Graceful Degradation**: The dashboard continues functioning when partial data sources fail.

## Requirements

### Requirement 1: Unified Client Dashboard Display

**User Story:** As an admin, I want to view all client data on a single page, so that I can manage the client without navigating between multiple views.

#### Acceptance Criteria

1. THE Dashboard SHALL display the client credentials section containing Chatwoot Account ID and API Token.
2. THE Dashboard SHALL display the Bot AI Prompt section containing active AI system prompts, tone configuration, FAQs, and routing rules.
3. THE Dashboard SHALL display the Recent Chats section containing a list of recent conversations fetched from Chatwoot REST API.
4. THE Dashboard SHALL divide the page into three distinct visual sections using Tailwind CSS: Credentials, Bot AI Prompt, and Recent Chats.
5. THE Dashboard SHALL use large centralized files containing all UI, data-fetching, and layout code without breaking into smaller reusable components.

### Requirement 2: Real Data Fetching from PostgreSQL

**User Story:** As an admin, I want to see real client data from the database, so that I can work with accurate information.

#### Acceptance Criteria

1. WHEN a client page loads, THE Dashboard SHALL fetch the Business record from PostgreSQL via Prisma on port 5433.
2. THE Dashboard SHALL fetch Chatwoot Account ID from the Business.chatwootAccountId field.
3. THE Dashboard SHALL fetch Chatwoot API Token from the Business.chatwootApiToken field.
4. THE Dashboard SHALL fetch AutoRule records associated with the business from the AutoRule table.
5. THE Dashboard SHALL fetch bot configuration data from the Business.businessInfo JSON field.
6. THE Dashboard SHALL fetch admin notes from the Business.adminNotes relation.

### Requirement 3: Real Data Fetching from Chatwoot API

**User Story:** As an admin, I want to see real conversation data from Chatwoot, so that I can monitor client interactions.

#### Acceptance Criteria

1. WHEN the Recent Chats section loads, THE Dashboard SHALL fetch conversations from Chatwoot REST API endpoint GET /api/v1/accounts/:id/conversations.
2. THE Dashboard SHALL use the client's Chatwoot Account ID for the API request.
3. THE Dashboard SHALL include the client's Chatwoot API Token in the request authorization header.
4. THE Dashboard SHALL display the conversation status, last message preview, and timestamp for each conversation.

### Requirement 4: Unified Mutations for Client Configuration

**User Story:** As an admin, I want to edit AI prompts and save configurations directly from the dashboard, so that I can manage bot settings efficiently.

#### Acceptance Criteria

1. THE Credentials section SHALL include an editable form for Chatwoot Account ID.
2. THE Credentials section SHALL include an editable form for Chatwoot API Token.
3. THE Bot AI Prompt section SHALL include an editable form for AI system prompts.
4. THE Bot AI Prompt section SHALL include editable fields for bot tone configuration.
5. THE Bot AI Prompt section SHALL include editable FAQs configuration.
6. THE Bot AI Prompt section SHALL include editable routing rules configuration.
7. THE Dashboard SHALL save all configuration changes via Server Actions or api/admin/... routes.
8. THE Dashboard SHALL display a success confirmation after saving configuration changes.

### Requirement 5: Graceful Error Handling

**User Story:** As an admin, I want the dashboard to remain functional even if some data sources fail, so that I can continue working with available data.

#### Acceptance Criteria

1. IF the Chatwoot API request fails, THEN THE Dashboard SHALL display the Credentials and Bot AI Prompt sections with a non-blocking error message in the Recent Chats section.
2. IF the PostgreSQL query fails, THEN THE Dashboard SHALL display a visible error state for the failed section while preserving access to other functional sections.
3. IF any individual section fails to load, THEN THE Dashboard SHALL display a localized error message within that section without affecting other sections.
4. THE Dashboard SHALL display loading states for each section independently during data fetching.
5. THE Dashboard SHALL include retry controls for failed data fetches.

### Requirement 6: Tab-Based Navigation (Optional Feature)

**User Story:** As an admin, I want to organize client information into logical tabs, so that I can quickly access different aspects of client management.

#### Acceptance Criteria

1. WHERE the user prefers tab-based navigation, THE Dashboard SHALL provide tabs for: Account, Bot Config, Activity, and Notes.
2. THE Account tab SHALL display client profile information and credentials.
3. THE Bot Config tab SHALL display AutoRules and AI configuration.
4. THE Activity tab SHALL display the activity log for the client.
5. THE Notes tab SHALL display and allow adding admin notes.

### Requirement 7: Client Overview List

**User Story:** As an admin, I want to see a list of all clients with key metrics, so that I can quickly assess the client base.

#### Acceptance Criteria

1. THE OverviewClient SHALL display statistics including total clients, active clients, trial clients, and MRR.
2. THE OverviewClient SHALL display service status indicators for Bot, App, n8n, Chatwoot, Marketing, and Dashboard.
3. THE OverviewClient SHALL display recent activity across all clients.
4. THE OverviewClient SHALL display plan distribution breakdown.

### Requirement 8: Data Persistence

**User Story:** As an admin, I want my configuration changes to persist, so that the bot behaves according to my settings.

#### Acceptance Criteria

1. WHEN admin saves Chatwoot credentials, THE System SHALL persist the values to the Business record in PostgreSQL.
2. WHEN admin saves AI prompt configuration, THE System SHALL persist the values to the Business.businessInfo JSON field in PostgreSQL.
3. WHEN admin modifies AutoRules, THE System SHALL persist the changes to the AutoRule table via api/admin/auto-rules/[id] route.