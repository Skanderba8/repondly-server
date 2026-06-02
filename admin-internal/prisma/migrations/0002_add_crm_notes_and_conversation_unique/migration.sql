-- Add chatwootUserPassword to Business
ALTER TABLE "Business" ADD COLUMN "chatwootUserPassword" TEXT;

-- Create ConversationCRMNote table
CREATE TABLE "ConversationCRMNote" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "chatwootConversationId" INTEGER NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "customerLocation" TEXT,
    "preferredLanguage" TEXT,
    "serviceOfInterest" TEXT,
    "budget" TEXT,
    "orderIntent" TEXT,
    "urgency" TEXT,
    "purchaseStage" TEXT,
    "objections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "needsSummary" TEXT,
    "importantContext" TEXT,
    "painPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customRequests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" TEXT,
    "frustrationLevel" INTEGER,
    "appointmentRequested" BOOLEAN NOT NULL DEFAULT false,
    "quoteRequested" BOOLEAN NOT NULL DEFAULT false,
    "orderRequested" BOOLEAN NOT NULL DEFAULT false,
    "supportRequested" BOOLEAN NOT NULL DEFAULT false,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "humanHandoverStatus" TEXT,
    "lastExtractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationCRMNote_pkey" PRIMARY KEY ("id")
);

-- Create unique index on ConversationCRMNote
CREATE UNIQUE INDEX "ConversationCRMNote_businessId_chatwootConversationId_key" ON "ConversationCRMNote"("businessId", "chatwootConversationId");

-- Create index on ConversationCRMNote
CREATE INDEX "ConversationCRMNote_businessId_chatwootConversationId_idx" ON "ConversationCRMNote"("businessId", "chatwootConversationId");

-- Add foreign key to ConversationCRMNote
ALTER TABLE "ConversationCRMNote" ADD CONSTRAINT "ConversationCRMNote_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique index to ConversationLog
CREATE UNIQUE INDEX "ConversationLog_businessId_chatwootConversationId_key" ON "ConversationLog"("businessId", "chatwootConversationId");
