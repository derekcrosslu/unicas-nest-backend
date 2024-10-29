-- First, add the new phone column as nullable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Copy data from phone_number to phone
UPDATE "User" SET "phone" = "phone_number";

-- Now make phone required
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

-- Add all other new columns
ALTER TABLE "User" ADD COLUMN "additional_info" TEXT;
ALTER TABLE "User" ADD COLUMN "beneficiary_address" TEXT;
ALTER TABLE "User" ADD COLUMN "beneficiary_document_number" TEXT;
ALTER TABLE "User" ADD COLUMN "beneficiary_document_type" TEXT;
ALTER TABLE "User" ADD COLUMN "beneficiary_full_name" TEXT;
ALTER TABLE "User" ADD COLUMN "beneficiary_phone" TEXT;
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "join_date" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "member_role" TEXT;
ALTER TABLE "User" ADD COLUMN "productive_activity" TEXT;
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Activo';

-- Copy existing name data to full_name if it doesn't exist
UPDATE "User" 
SET "full_name" = CONCAT("first_name", ' ', "last_name")
WHERE "full_name" IS NULL AND "first_name" IS NOT NULL AND "last_name" IS NOT NULL;

-- Now drop the old columns
ALTER TABLE "User" DROP COLUMN "district";
ALTER TABLE "User" DROP COLUMN "first_name";
ALTER TABLE "User" DROP COLUMN "last_name";
ALTER TABLE "User" DROP COLUMN "province";
ALTER TABLE "User" DROP COLUMN "phone_number";
