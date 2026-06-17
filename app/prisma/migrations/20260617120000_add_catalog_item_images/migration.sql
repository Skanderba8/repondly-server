CREATE TYPE "CatalogItemType" AS ENUM ('PRODUCT', 'SERVICE');

ALTER TABLE "Product"
ADD COLUMN "type" "CatalogItemType" NOT NULL DEFAULT 'PRODUCT';

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "dataUrl" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_businessId_type_idx" ON "Product"("businessId", "type");
CREATE INDEX "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");

ALTER TABLE "ProductImage"
ADD CONSTRAINT "ProductImage_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
