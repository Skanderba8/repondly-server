-- Create ExceptionType enum
CREATE TYPE "ExceptionType" AS ENUM ('CLOSURE', 'PROMO', 'HOLIDAY', 'OTHER');

-- Add type column to ScheduleException
ALTER TABLE "ScheduleException" ADD COLUMN "type" "ExceptionType" NOT NULL DEFAULT 'OTHER';

-- Create MessageLog table
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "chatwootConversationId" INTEGER NOT NULL,
    "content" TEXT,
    "senderType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- Add indexes to MessageLog
CREATE INDEX "MessageLog_businessId_createdAt_idx" ON "MessageLog"("businessId", "createdAt");
CREATE INDEX "MessageLog_businessId_chatwootConversationId_idx" ON "MessageLog"("businessId", "chatwootConversationId");

-- Add foreign key to MessageLog
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
