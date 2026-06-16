-- AlterTable
ALTER TABLE "Business" ADD COLUMN "botEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "botName" TEXT,
ADD COLUMN "botLanguage" TEXT,
ADD COLUMN "botMode" TEXT,
ADD COLUMN "botWorkingHoursStart" TEXT,
ADD COLUMN "botWorkingHoursEnd" TEXT,
ADD COLUMN "botKnowledge" TEXT,
ADD COLUMN "botHandoffKeywords" TEXT;

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER,
    "fournisseur" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_businessId_isActive_idx" ON "Product"("businessId", "isActive");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
