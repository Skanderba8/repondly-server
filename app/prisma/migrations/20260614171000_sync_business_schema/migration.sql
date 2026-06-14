-- Align production database with the current Prisma schema.
ALTER TABLE "Business" DROP COLUMN IF EXISTS "passwordHash";

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "authUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Business_authUserId_key" ON "Business"("authUserId");
