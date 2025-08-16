/*
  Warnings:

  - The values [PAID,PARTIAL,OVERDUE,CANCELLED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `saleId` on the `DebtorTransaction` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "DebtorTransaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DebtorTransaction" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
ALTER TABLE "DebtorTransaction" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "FuelPrice" DROP CONSTRAINT "FuelPrice_fuelTypeId_fkey";

-- AlterTable
ALTER TABLE "DebtorTransaction" DROP COLUMN "saleId";

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "description" TEXT,
    "fuelPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftMeter" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "dispenserId" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "startMeter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endMeter" DOUBLE PRECISION,
    "soldVolume" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "testWithdraw" DOUBLE PRECISION DEFAULT 0,
    "useWithdraw" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTankCheck" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "firstMeasure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sold" DOUBLE PRECISION,
    "remaining" DOUBLE PRECISION,
    "lastMeasure" DOUBLE PRECISION,
    "diff" DOUBLE PRECISION,
    "diffPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTankCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSale" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "debtorId" TEXT,
    "customerCode" TEXT,
    "plateNumber" TEXT,
    "deliveryNote" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftMeter_shiftId_idx" ON "ShiftMeter"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftMeter_dispenserId_idx" ON "ShiftMeter"("dispenserId");

-- CreateIndex
CREATE INDEX "ShiftTankCheck_shiftId_idx" ON "ShiftTankCheck"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftTankCheck_tankId_idx" ON "ShiftTankCheck"("tankId");

-- CreateIndex
CREATE INDEX "ShiftSale_shiftId_idx" ON "ShiftSale"("shiftId");

-- CreateIndex
CREATE INDEX "ShiftSale_productId_idx" ON "ShiftSale"("productId");

-- AddForeignKey
ALTER TABLE "FuelPrice" ADD CONSTRAINT "FuelPrice_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftMeter" ADD CONSTRAINT "ShiftMeter_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftMeter" ADD CONSTRAINT "ShiftMeter_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "Dispenser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftMeter" ADD CONSTRAINT "ShiftMeter_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftMeter" ADD CONSTRAINT "ShiftMeter_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTankCheck" ADD CONSTRAINT "ShiftTankCheck_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTankCheck" ADD CONSTRAINT "ShiftTankCheck_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSale" ADD CONSTRAINT "ShiftSale_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSale" ADD CONSTRAINT "ShiftSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSale" ADD CONSTRAINT "ShiftSale_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "DebtorRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
