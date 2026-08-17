-- CreateEnum
CREATE TYPE "TouchStatus" AS ENUM ('PENDING', 'READY', 'TOUCHED');

-- AlterTable
ALTER TABLE "subscriptions"
ADD COLUMN "beneficiaryName" TEXT,
ADD COLUMN "beneficiaryPhone" TEXT,
ADD COLUMN "beneficiarySignature" TEXT,
ADD COLUMN "dossierNumber" TEXT,
ADD COLUMN "touchReference" TEXT,
ADD COLUMN "touchStatus" "TouchStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "touchedAt" TIMESTAMP(3),
ADD COLUMN "touchedBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_dossierNumber_key" ON "subscriptions"("dossierNumber");

-- CreateIndex
CREATE INDEX "subscriptions_touchStatus_idx" ON "subscriptions"("touchStatus");