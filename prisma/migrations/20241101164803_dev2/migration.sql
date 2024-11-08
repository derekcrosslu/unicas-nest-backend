/*
  Warnings:

  - You are about to drop the column `loan_type` on the `PrestamoNew` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[juntaId,loan_number]` on the table `PrestamoNew` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `capital_at_time` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guarantee_type` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loan_code` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loan_number` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_type` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `PrestamoNew` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Accion" ADD COLUMN     "affects_capital" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Junta" ADD COLUMN     "available_capital" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "base_capital" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "current_capital" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Multa" ADD COLUMN     "affects_capital" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PagoPrestamoNew" ADD COLUMN     "affects_capital" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PrestamoNew" DROP COLUMN "loan_type",
ADD COLUMN     "affects_capital" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "avalId" TEXT,
ADD COLUMN     "capital_at_time" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "capital_snapshot" JSONB,
ADD COLUMN     "form_cost" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
ADD COLUMN     "form_purchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guarantee_detail" TEXT,
ADD COLUMN     "guarantee_type" TEXT NOT NULL,
ADD COLUMN     "loan_code" TEXT NOT NULL,
ADD COLUMN     "loan_number" INTEGER NOT NULL,
ADD COLUMN     "payment_type" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "CapitalMovement" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "juntaId" TEXT NOT NULL,
    "prestamoId" TEXT,
    "multaId" TEXT,
    "accionId" TEXT,
    "pagoId" TEXT,

    CONSTRAINT "CapitalMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CapitalMovement_juntaId_createdAt_idx" ON "CapitalMovement"("juntaId", "createdAt");

-- CreateIndex
CREATE INDEX "CapitalMovement_type_direction_idx" ON "CapitalMovement"("type", "direction");

-- CreateIndex
CREATE INDEX "Accion_juntaId_createdAt_idx" ON "Accion"("juntaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrestamoNew_juntaId_loan_number_key" ON "PrestamoNew"("juntaId", "loan_number");

-- AddForeignKey
ALTER TABLE "PrestamoNew" ADD CONSTRAINT "PrestamoNew_avalId_fkey" FOREIGN KEY ("avalId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalMovement" ADD CONSTRAINT "CapitalMovement_juntaId_fkey" FOREIGN KEY ("juntaId") REFERENCES "Junta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalMovement" ADD CONSTRAINT "CapitalMovement_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "PrestamoNew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalMovement" ADD CONSTRAINT "CapitalMovement_multaId_fkey" FOREIGN KEY ("multaId") REFERENCES "Multa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalMovement" ADD CONSTRAINT "CapitalMovement_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "Accion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalMovement" ADD CONSTRAINT "CapitalMovement_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoPrestamoNew"("id") ON DELETE SET NULL ON UPDATE CASCADE;
