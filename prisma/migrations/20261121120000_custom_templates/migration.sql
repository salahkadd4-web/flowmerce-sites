-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "aiTrainingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiTrainingConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CustomTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Autre',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomTemplate_tenantId_idx" ON "CustomTemplate"("tenantId");

-- AddForeignKey
ALTER TABLE "CustomTemplate" ADD CONSTRAINT "CustomTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

