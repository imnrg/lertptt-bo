-- Drop fuelPrice column from "Shift" table
BEGIN;

ALTER TABLE "Shift" DROP COLUMN IF EXISTS "fuelPrice";

COMMIT;
