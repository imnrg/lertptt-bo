/*
  Warnings:

  - You are about to drop the column `amount` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `DebtorRecord` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DebtorRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerCode]` on the table `DebtorRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerCode` to the `DebtorRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "DebtorRecord" DROP CONSTRAINT "DebtorRecord_createdById_fkey";

-- AlterTable
ALTER TABLE "DebtorRecord" DROP COLUMN "amount",
DROP COLUMN "createdById",
DROP COLUMN "customerEmail",
DROP COLUMN "customerPhone",
DROP COLUMN "description",
DROP COLUMN "dueDate",
DROP COLUMN "status",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "creditLimit" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "creditTerm" INTEGER DEFAULT 30,
ADD COLUMN     "customerCode" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxId" TEXT;

-- CreateTable
CREATE TABLE "DebtorFuelDiscount" (
    "id" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'AMOUNT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtorFuelDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtorTransaction" (
    "id" TEXT NOT NULL,
    "debtorId" TEXT NOT NULL,
    "saleId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtorTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebtorFuelDiscount_debtorId_fuelTypeId_key" ON "DebtorFuelDiscount"("debtorId", "fuelTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "DebtorRecord_customerCode_key" ON "DebtorRecord"("customerCode");

-- AddForeignKey
ALTER TABLE "DebtorFuelDiscount" ADD CONSTRAINT "DebtorFuelDiscount_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "DebtorRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtorFuelDiscount" ADD CONSTRAINT "DebtorFuelDiscount_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtorTransaction" ADD CONSTRAINT "DebtorTransaction_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "DebtorRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Removed foreign key constraint to "Sale"("id") from this migration because the "Sale" table is not present in the migration set. If "Sale" is required, create its migration before applying this one.
