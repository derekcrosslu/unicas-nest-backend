/*
  Warnings:

  - You are about to drop the column `date` on the `AgendaItem` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleId` on the `AgendaItem` table. All the data in the column will be lost.
  - You are about to drop the `Asistencia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklySchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgendaItem" DROP CONSTRAINT "AgendaItem_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "Asistencia" DROP CONSTRAINT "Asistencia_agendaItemId_fkey";

-- DropForeignKey
ALTER TABLE "Asistencia" DROP CONSTRAINT "Asistencia_userId_fkey";

-- DropForeignKey
ALTER TABLE "DailyAttendance" DROP CONSTRAINT "DailyAttendance_agendaItemId_fkey";

-- DropForeignKey
ALTER TABLE "DailyAttendance" DROP CONSTRAINT "DailyAttendance_dayScheduleId_fkey";

-- DropForeignKey
ALTER TABLE "DailyAttendance" DROP CONSTRAINT "DailyAttendance_userId_fkey";

-- DropForeignKey
ALTER TABLE "DaySchedule" DROP CONSTRAINT "DaySchedule_agendaItemId_fkey";

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT "Schedule_juntaId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklySchedule" DROP CONSTRAINT "WeeklySchedule_scheduleId_fkey";

-- DropIndex
DROP INDEX "AgendaItem_scheduleId_idx";

-- AlterTable
ALTER TABLE "AgendaItem" DROP COLUMN "date",
DROP COLUMN "scheduleId";

-- DropTable
DROP TABLE "Asistencia";

-- DropTable
DROP TABLE "Schedule";

-- DropTable
DROP TABLE "WeeklySchedule";

-- AddForeignKey
ALTER TABLE "DaySchedule" ADD CONSTRAINT "DaySchedule_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_dayScheduleId_fkey" FOREIGN KEY ("dayScheduleId") REFERENCES "DaySchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
