-- Migration: upgrade_staff_auth
-- Adds Business, InviteToken, Swap models
-- Migrates Staff/Shift/TimeOff from userId to businessId
-- Converts Shift startHour/endHour to startTime/endTime strings

-- ============================================================
-- 1. Create Business table
-- ============================================================
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Business_userId_key" ON "Business"("userId");

ALTER TABLE "Business" ADD CONSTRAINT "Business_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 2. Seed Business from each User's businessName
-- ============================================================
INSERT INTO "Business" ("userId", "name", "createdAt")
SELECT "id", "businessName", "createdAt" FROM "User";

-- ============================================================
-- 3. Drop old relations from User (staff/shifts/timeOff were via userId)
-- ============================================================

-- ============================================================
-- 4. Upgrade Staff table: add businessId (nullable initially), passwordHash, phone
-- ============================================================
ALTER TABLE "Staff" ADD COLUMN "businessId" INTEGER;
ALTER TABLE "Staff" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Staff" ADD COLUMN "phone" TEXT;

-- Populate businessId from userId via Business table
UPDATE "Staff" s
SET "businessId" = b."id"
FROM "Business" b
WHERE b."userId" = s."userId";

-- Make businessId NOT NULL now that data is populated
ALTER TABLE "Staff" ALTER COLUMN "businessId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old userId column from Staff
ALTER TABLE "Staff" DROP COLUMN "userId";

-- ============================================================
-- 5. Upgrade Shift table: add businessId, startTime, endTime (nullable first)
-- ============================================================
ALTER TABLE "Shift" ADD COLUMN "businessId" INTEGER;
ALTER TABLE "Shift" ADD COLUMN "startTime" TEXT;
ALTER TABLE "Shift" ADD COLUMN "endTime" TEXT;

-- Populate businessId from userId via Business table
UPDATE "Shift" sh
SET "businessId" = b."id"
FROM "Business" b
WHERE b."userId" = sh."userId";

-- Convert startHour/endHour floats to "HH:MM" strings
UPDATE "Shift"
SET "startTime" = LPAD(FLOOR("startHour")::TEXT, 2, '0') || ':' || LPAD((ROUND(("startHour" - FLOOR("startHour")) * 60))::TEXT, 2, '0'),
    "endTime"   = LPAD(FLOOR("endHour")::TEXT, 2, '0') || ':' || LPAD((ROUND(("endHour" - FLOOR("endHour")) * 60))::TEXT, 2, '0');

-- Now make them NOT NULL
ALTER TABLE "Shift" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Shift" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "Shift" ALTER COLUMN "endTime" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old columns from Shift
ALTER TABLE "Shift" DROP COLUMN "userId";
ALTER TABLE "Shift" DROP COLUMN "startHour";
ALTER TABLE "Shift" DROP COLUMN "endHour";

-- ============================================================
-- 6. Upgrade TimeOff table: add businessId, type (nullable first)
-- ============================================================
ALTER TABLE "TimeOff" ADD COLUMN "businessId" INTEGER;
ALTER TABLE "TimeOff" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Day Off';

-- Populate businessId from userId via Business table
UPDATE "TimeOff" t
SET "businessId" = b."id"
FROM "Business" b
WHERE b."userId" = t."userId";

-- Make businessId NOT NULL
ALTER TABLE "TimeOff" ALTER COLUMN "businessId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "TimeOff" ADD CONSTRAINT "TimeOff_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old userId column from TimeOff
ALTER TABLE "TimeOff" DROP COLUMN "userId";

-- ============================================================
-- 7. Create InviteToken table
-- ============================================================
CREATE TABLE "InviteToken" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- 8. Create Swap table
-- ============================================================
CREATE TABLE "Swap" (
    "id" SERIAL NOT NULL,
    "fromStaffId" INTEGER NOT NULL,
    "toStaffId" INTEGER NOT NULL,
    "fromShiftId" INTEGER NOT NULL,
    "toShiftId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Swap" ADD CONSTRAINT "Swap_fromStaffId_fkey"
    FOREIGN KEY ("fromStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Swap" ADD CONSTRAINT "Swap_toStaffId_fkey"
    FOREIGN KEY ("toStaffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Swap" ADD CONSTRAINT "Swap_fromShiftId_fkey"
    FOREIGN KEY ("fromShiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Swap" ADD CONSTRAINT "Swap_toShiftId_fkey"
    FOREIGN KEY ("toShiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
