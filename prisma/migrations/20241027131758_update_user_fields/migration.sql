/*
  Warnings:

  - Made the column `phone_number` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "phone_number" SET NOT NULL;
