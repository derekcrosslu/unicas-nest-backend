/*
  Warnings:

  - Made the column `loan_type` on table `PrestamoNew` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "PrestamoNew_original_prestamo_id_idx";

-- AlterTable
ALTER TABLE "PrestamoNew" ALTER COLUMN "loan_type" SET NOT NULL;
