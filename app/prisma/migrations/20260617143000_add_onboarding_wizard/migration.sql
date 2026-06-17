CREATE TYPE "Plan_new" AS ENUM ('ESSENTIEL', 'BUSINESS', 'BUSINESS_PLUS', 'GROWTH');

ALTER TABLE "Business" ALTER COLUMN "plan" DROP DEFAULT;

ALTER TABLE "Business"
ALTER COLUMN "plan" TYPE "Plan_new"
USING (
  CASE "plan"::text
    WHEN 'AGENCY' THEN 'GROWTH'
    WHEN 'PRO' THEN 'BUSINESS_PLUS'
    WHEN 'STARTER' THEN 'ESSENTIEL'
    ELSE 'ESSENTIEL'
  END
)::"Plan_new";

ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "Plan_old";

ALTER TABLE "Business" ALTER COLUMN "plan" SET DEFAULT 'ESSENTIEL';
ALTER TABLE "Business" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

CREATE TABLE "BusinessImage" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "dataUrl" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessImage_businessId_category_position_idx" ON "BusinessImage"("businessId", "category", "position");

ALTER TABLE "BusinessImage"
ADD CONSTRAINT "BusinessImage_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
