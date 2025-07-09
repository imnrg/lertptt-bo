-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CREDIT');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "cashSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "creditSales" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShiftFuelPrice" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftFuelPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "dispenserId" TEXT NOT NULL,
    "startReading" DOUBLE PRECISION NOT NULL,
    "endReading" DOUBLE PRECISION,
    "testLiters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageLiters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiters" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TankReading" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "startLevel" DOUBLE PRECISION NOT NULL,
    "calculatedLevel" DOUBLE PRECISION,
    "actualLevel" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "differencePercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TankReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TankRefill" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "tankId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TankRefill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "licensePlate" TEXT,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'CASH',
    "debtorId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftFuelPrice_shiftId_fuelTypeId_key" ON "ShiftFuelPrice"("shiftId", "fuelTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_shiftId_dispenserId_key" ON "MeterReading"("shiftId", "dispenserId");

-- CreateIndex
CREATE UNIQUE INDEX "TankReading_shiftId_tankId_key" ON "TankReading"("shiftId", "tankId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_billNumber_key" ON "Sale"("billNumber");

-- AddForeignKey
ALTER TABLE "ShiftFuelPrice" ADD CONSTRAINT "ShiftFuelPrice_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftFuelPrice" ADD CONSTRAINT "ShiftFuelPrice_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_dispenserId_fkey" FOREIGN KEY ("dispenserId") REFERENCES "Dispenser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankReading" ADD CONSTRAINT "TankReading_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankReading" ADD CONSTRAINT "TankReading_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankRefill" ADD CONSTRAINT "TankRefill_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TankRefill" ADD CONSTRAINT "TankRefill_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_debtorId_fkey" FOREIGN KEY ("debtorId") REFERENCES "DebtorRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
