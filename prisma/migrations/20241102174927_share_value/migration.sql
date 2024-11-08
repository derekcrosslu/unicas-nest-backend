/*
  Warnings:

  - Added the required column `shareValue` to the `Accion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Accion" ADD COLUMN     "shareValue" DOUBLE PRECISION NOT NULL;
