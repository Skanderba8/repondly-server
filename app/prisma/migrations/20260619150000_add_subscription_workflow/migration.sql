ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'TRIALING';
ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'TRIAL_EXPIRED';
ALTER TYPE "PlanStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';

CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT');
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

ALTER TABLE "Business"
  ADD COLUMN "trialStartedAt" TIMESTAMP(3),
  ADD COLUMN "trialExpiredAt" TIMESTAMP(3),
  ADD COLUMN "dataDeletionScheduledAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
  ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

CREATE TABLE "MonthlyUsage" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "aiReplies" INTEGER NOT NULL DEFAULT 0,
  "conversations" INTEGER NOT NULL DEFAULT 0,
  "orders" INTEGER NOT NULL DEFAULT 0,
  "appointments" INTEGER NOT NULL DEFAULT 0,
  "broadcasts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrialClaim" (
  "id" TEXT NOT NULL,
  "businessId" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "channel" "ChannelType",
  "externalAccountId" TEXT,
  "ipAddress" TEXT,
  "deviceFingerprint" TEXT,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrialClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessMember" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "authUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "MemberRole" NOT NULL DEFAULT 'AGENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BroadcastCampaign" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "channel" "ChannelType" NOT NULL,
  "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scheduledAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "BroadcastCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MonthlyUsage_businessId_periodStart_key" ON "MonthlyUsage"("businessId", "periodStart");
CREATE INDEX "MonthlyUsage_businessId_periodStart_periodEnd_idx" ON "MonthlyUsage"("businessId", "periodStart", "periodEnd");
CREATE INDEX "TrialClaim_email_idx" ON "TrialClaim"("email");
CREATE INDEX "TrialClaim_phone_idx" ON "TrialClaim"("phone");
CREATE INDEX "TrialClaim_channel_externalAccountId_idx" ON "TrialClaim"("channel", "externalAccountId");
CREATE UNIQUE INDEX "BusinessMember_businessId_authUserId_key" ON "BusinessMember"("businessId", "authUserId");
CREATE INDEX "BusinessMember_businessId_idx" ON "BusinessMember"("businessId");
CREATE INDEX "BroadcastCampaign_businessId_createdAt_idx" ON "BroadcastCampaign"("businessId", "createdAt");

ALTER TABLE "MonthlyUsage" ADD CONSTRAINT "MonthlyUsage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BroadcastCampaign" ADD CONSTRAINT "BroadcastCampaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Business"
SET "planStatus" = 'ACTIVE'
WHERE "isPaid" = true;

UPDATE "Business"
SET
  "planStatus" = 'TRIALING',
  "trialStartedAt" = COALESCE("trialStartedAt", "createdAt")
WHERE "isPaid" = false
  AND "trialEndsAt" IS NOT NULL
  AND "trialEndsAt" > CURRENT_TIMESTAMP;

UPDATE "Business"
SET
  "planStatus" = 'TRIAL_EXPIRED',
  "trialExpiredAt" = COALESCE("trialExpiredAt", CURRENT_TIMESTAMP),
  "dataDeletionScheduledAt" = COALESCE("dataDeletionScheduledAt", CURRENT_TIMESTAMP + INTERVAL '15 days'),
  "botEnabled" = false
WHERE "isPaid" = false
  AND "trialEndsAt" IS NOT NULL
  AND "trialEndsAt" <= CURRENT_TIMESTAMP;

-- Businesses without trialEndsAt are left unchanged for manual admin review.
