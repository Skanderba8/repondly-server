# Implementation Plan: Comprehensive Client Dashboard

## Overview

This implementation plan refactors the client detail page (`admin/clients/[id]/page.tsx`) and enhances the client overview page (`OverviewClient.tsx`) to create a unified, powerful control center. The dashboard displays all client data in a single-page view with Credentials, Bot AI Prompt, and Recent Chats sections. Implementation uses Next.js Server Actions for mutations, Prisma for PostgreSQL on port 5433, and Chatwoot API integration at http://127.0.0.1:3000.

## Tasks

- [x] 1. Set up project structure and Server Actions

  - Create in-page Server Actions for credentials and bot config mutations
  - Define TypeScript interfaces for Business, BusinessInfo, Conversation types
  - Set up parallel data fetching structure in page.tsx
  - _Requirements: 1.1, 1.2, 1.3, 4.7_

- [x] 2. Implement Credentials section with edit form

  - [x] 2.1 Create Chatwoot Account ID input field
    - Add form field for chatwootAccountId with number type
    - Wire to updateCredentials Server Action
    - _Requirements: 4.1, 8.1_

  - [x] 2.2 Create Chatwoot API Token input field
    - Add form field for chatwootApiToken with password masking
    - Wire to updateCredentials Server Action
    - _Requirements: 4.2, 8.1_

  - [x] 2.3 Add save button with loading/success states
    - Implement saving state with button disabled during save
    - Show success confirmation after save
    - _Requirements: 4.8_

- [x] 3. Implement Bot AI Prompt section with edit form

  - [x] 3.1 Create AI system prompt textarea
    - Add textarea for aiPrompt from businessInfo JSON
    - Wire to updateBotConfig Server Action
    - _Requirements: 4.3, 8.2_

  - [x] 3.2 Create bot tone configuration
    - Add dropdown for aiTone (professional/friendly/casual)
    - Wire to updateBotConfig Server Action
    - _Requirements: 4.4, 8.2_

  - [x] 3.3 Create FAQs configuration
    - Add dynamic FAQ items array editor (add/remove/edit)
    - Store in businessInfo.aiFaqs JSON field
    - Wire to updateBotConfig Server Action
    - _Requirements: 4.5, 8.2_

  - [x] 3.4 Create routing rules configuration
    - Add dynamic routing rules array editor (condition/action pairs)
    - Store in businessInfo.routingRules JSON field
    - Wire to updateBotConfig Server Action
    - _Requirements: 4.6, 8.2_

  - [x] 3.5 Add save button with loading/success states
    - Implement saving state with button disabled during save
    - Show success confirmation after save
    - _Requirements: 4.8, 8.2_

- [x] 4. Implement Recent Chats section with Chatwoot API

  - [x] 4.1 Create Chatwoot API client function
    - Implement fetchConversations function calling GET /api/v1/accounts/:id/conversations
    - Use client's Chatwoot Account ID and API Token for authorization
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Display conversation list
    - Show conversation status (open/closed), contact name, last message preview, timestamp
    - Handle missing or empty conversations gracefully
    - _Requirements: 3.4_

  - [x] 4.3 Add loading state for conversations
    - Show loading skeleton while fetching from Chatwoot API
    - Independent loading state per section
    - _Requirements: 5.4_

- [ ] 5. Implement graceful error handling per section

  - [ ] 5.1 Add error state for Credentials section
    - Display localized error message within section
    - Show retry control button
    - _Requirements: 5.1, 5.3_

  - [ ] 5.2 Add error state for Bot AI Prompt section
    - Display localized error message within section
    - Show retry control button
    - _Requirements: 5.2, 5.3_

  - [ ] 5.3 Add error state for Recent Chats section
    - Display non-blocking error message when Chatwoot API fails
    - Show "Configure credentials" prompt for invalid credentials
    - Show retry control button
    - _Requirements: 5.1, 5.3, 5.5_

  - [ ] 5.4 Implement retry logic with exponential backoff
    - Implement fetchWithRetry utility for failed API calls
    - Max 3 retries with increasing delay
    - _Requirements: 5.5_

- [ ] 6. Implement tab-based navigation

  - [ ] 6.1 Create Account tab content
    - Move existing profile info and credentials to Account tab
    - Add status management and plan display
    - _Requirements: 6.2_

  - [ ] 6.2 Create Bot Config tab content
    - Move AutoRules list and AI configuration to Bot Config tab
    - Add toggle controls for AutoRule activation
    - _Requirements: 6.3_

  - [ ] 6.3 Create Activity tab content
    - Display activity logs from ActivityLog table
    - Add timeline view with timestamps
    - _Requirements: 6.4_

  - [ ] 6.4 Create Notes tab content
    - Display admin notes from AdminNote table
    - Add form to create new notes
    - _Requirements: 6.5_

  - [ ] 6.5 Add tab navigation with visual indicator
    - Implement active tab state with underline indicator
    - Use existing Tab component structure
    - _Requirements: 6.1_

- [ ] 7. Checkpoint - Ensure all sections work independently

  - Ensure all tests pass, ask the user if questions arise.
  - Verify independent loading/error states per section
  - Test Chatwoot API failure doesn't block other sections

- [ ] 8. Implement Client Overview enhancements

  - [ ] 8.1 Enhance OverviewClient statistics
    - Add total clients, active clients, trial clients, MRR display
    - Add trials expiring and pending config counts
    - _Requirements: 7.1_

  - [ ] 8.2 Add service status indicators
    - Display status for Bot, App, n8n, Chatwoot, Marketing, Dashboard
    - Use online/offline indicators with appropriate colors
    - _Requirements: 7.2_

  - [ ] 8.3 Add recent activity display
    - Show activity log across all clients
    - Include business name, action, and time ago
    - _Requirements: 7.3_

  - [ ] 8.4 Add plan distribution breakdown
    - Display visual bar chart for plan distribution
    - Show percentage and count per plan
    - _Requirements: 7.4_

- [ ] 9. Implement data persistence

  - [ ] 9.1 Persist credentials to PostgreSQL
    - Implement updateCredentials Server Action
    - Save chatwootAccountId and chatwootApiToken to Business table
    - _Requirements: 8.1_

  - [ ] 9.2 Persist bot configuration to PostgreSQL
    - Implement updateBotConfig Server Action
    - Save aiPrompt, aiTone, aiFaqs, routingRules to businessInfo JSON
    - _Requirements: 8.2_

  - [ ] 9.3 Persist AutoRule changes
    - Ensure toggleAutoRule Server Action updates AutoRule.active
    - Connect to existing api/admin/auto-rules/[id] route
    - _Requirements: 8.3_

- [ ] 10. Final checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete dashboard functionality
  - Test all mutation paths

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Design uses TypeScript/React (Next.js 15 App Router)
- All code should remain in centralized large files per requirement 1.5
- Use Server Actions for mutations, Prisma for PostgreSQL on port 5433
- Chatwoot API base URL: http://127.0.0.1:3000