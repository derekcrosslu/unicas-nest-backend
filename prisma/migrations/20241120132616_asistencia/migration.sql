-- Add the new columns as nullable
ALTER TABLE "AgendaItem" ADD COLUMN IF NOT EXISTS "weekStartDate" TIMESTAMP(3);
ALTER TABLE "AgendaItem" ADD COLUMN IF NOT EXISTS "weekEndDate" TIMESTAMP(3);

-- Update existing rows with calculated dates
UPDATE "AgendaItem"
SET 
    "weekStartDate" = date_trunc('week', "date"),
    "weekEndDate" = date_trunc('week', "date") + interval '6 days';

-- Make the columns required
ALTER TABLE "AgendaItem" 
    ALTER COLUMN "weekStartDate" SET NOT NULL,
    ALTER COLUMN "weekEndDate" SET NOT NULL;

-- Create the DaySchedule table
CREATE TABLE IF NOT EXISTS "DaySchedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "agendaItemId" TEXT NOT NULL,

    CONSTRAINT "DaySchedule_pkey" PRIMARY KEY ("id")
);

-- Create the DailyAttendance table
CREATE TABLE IF NOT EXISTS "DailyAttendance" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayScheduleId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAttendance_pkey" PRIMARY KEY ("id")
);

-- Create indices
CREATE UNIQUE INDEX IF NOT EXISTS "DaySchedule_agendaItemId_dayOfWeek_key" ON "DaySchedule"("agendaItemId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "DaySchedule_agendaItemId_idx" ON "DaySchedule"("agendaItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "DailyAttendance_userId_agendaItemId_dayScheduleId_key" ON "DailyAttendance"("userId", "agendaItemId", "dayScheduleId");
CREATE INDEX IF NOT EXISTS "DailyAttendance_agendaItemId_idx" ON "DailyAttendance"("agendaItemId");
CREATE INDEX IF NOT EXISTS "DailyAttendance_userId_idx" ON "DailyAttendance"("userId");
CREATE INDEX IF NOT EXISTS "DailyAttendance_dayScheduleId_idx" ON "DailyAttendance"("dayScheduleId");

-- Migrate existing attendance data
INSERT INTO "DaySchedule" ("id", "dayOfWeek", "startTime", "endTime", "agendaItemId")
SELECT 
    gen_random_uuid(), -- Generate UUID for id
    CASE EXTRACT(DOW FROM "date")
        WHEN 1 THEN 'MONDAY'
        WHEN 2 THEN 'TUESDAY'
        WHEN 3 THEN 'WEDNESDAY'
        WHEN 4 THEN 'THURSDAY'
        WHEN 5 THEN 'FRIDAY'
        WHEN 6 THEN 'SATURDAY'
        WHEN 0 THEN 'SUNDAY'
    END,
    "date", -- startTime
    "date" + interval '1 hour', -- endTime, assuming 1-hour meetings
    "id"
FROM "AgendaItem";

-- Migrate existing attendance data to DailyAttendance
INSERT INTO "DailyAttendance" ("id", "agendaItemId", "userId", "dayScheduleId", "attended", "date", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    a."agendaItemId",
    a."userId",
    ds."id",
    a."asistio",
    a."fecha",
    a."createdAt",
    a."updatedAt"
FROM "Asistencia" a
JOIN "DaySchedule" ds ON ds."agendaItemId" = a."agendaItemId"
WHERE EXTRACT(DOW FROM a."fecha") = CASE ds."dayOfWeek"
    WHEN 'MONDAY' THEN 1
    WHEN 'TUESDAY' THEN 2
    WHEN 'WEDNESDAY' THEN 3
    WHEN 'THURSDAY' THEN 4
    WHEN 'FRIDAY' THEN 5
    WHEN 'SATURDAY' THEN 6
    WHEN 'SUNDAY' THEN 0
END;

-- Add foreign key constraints
ALTER TABLE "DaySchedule" ADD CONSTRAINT "DaySchedule_agendaItemId_fkey" 
    FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_agendaItemId_fkey" 
    FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyAttendance" ADD CONSTRAINT "DailyAttendance_dayScheduleId_fkey" 
    FOREIGN KEY ("dayScheduleId") REFERENCES "DaySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;