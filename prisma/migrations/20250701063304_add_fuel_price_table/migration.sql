-- CreateTable
CREATE TABLE "FuelPrice" (
    "id" TEXT NOT NULL,
    "fuelTypeId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuelPrice_fuelTypeId_effectiveDate_idx" ON "FuelPrice"("fuelTypeId", "effectiveDate");

-- CreateIndex
CREATE INDEX "FuelPrice_effectiveDate_isActive_idx" ON "FuelPrice"("effectiveDate", "isActive");

-- AddForeignKey
ALTER TABLE "FuelPrice" ADD CONSTRAINT "FuelPrice_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
