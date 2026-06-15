-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NOUVEAU', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE', 'LIVRE', 'ANNULE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAS_ENCORE', 'ACOMPTE', 'RECU');

-- DropIndex
DROP INDEX "BusinessChannelConnection_metaInstagramAccountId_key";

-- DropIndex
DROP INDEX "BusinessChannelConnection_metaPageId_key";

-- DropIndex
DROP INDEX "BusinessChannelConnection_metaPhoneNumberId_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "waAccessToken",
DROP COLUMN "waPhoneNumberId",
DROP COLUMN "waVerifyToken",
DROP COLUMN "wabaId";

-- AlterTable
ALTER TABLE "BusinessChannelConnection" DROP COLUMN "metaAppId",
DROP COLUMN "metaBusinessAccountId",
DROP COLUMN "metaBusinessName",
DROP COLUMN "metaInstagramAccountId",
DROP COLUMN "metaInstagramUsername",
DROP COLUMN "metaPageId",
DROP COLUMN "metaPageName",
DROP COLUMN "metaPhoneNumber",
DROP COLUMN "metaPhoneNumberId",
DROP COLUMN "metaUserId",
DROP COLUMN "tokenExpiresAt",
DROP COLUMN "webhookVerifyToken",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "unipileAccountId" TEXT,
ADD COLUMN     "unipileAccountType" TEXT;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "conversationId" TEXT,
    "orderNumber" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NOUVEAU',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAS_ENCORE',
    "deliveryMethod" TEXT,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_businessId_status_idx" ON "Order"("businessId", "status");

-- CreateIndex
CREATE INDEX "Order_businessId_createdAt_idx" ON "Order"("businessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_businessId_orderNumber_key" ON "Order"("businessId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessChannelConnection_unipileAccountId_key" ON "BusinessChannelConnection"("unipileAccountId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
