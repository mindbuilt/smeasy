-- CreateTable: RosterToken
CREATE TABLE "RosterToken" (
  "id" SERIAL NOT NULL,
  "rosterId" INTEGER NOT NULL,
  "staffId" INTEGER NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RosterToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RosterToken_token_key" ON "RosterToken"("token");
ALTER TABLE "RosterToken" ADD CONSTRAINT "RosterToken_rosterId_fkey"
  FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RosterToken" ADD CONSTRAINT "RosterToken_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add dateTo to TimeOff
ALTER TABLE "TimeOff" ADD COLUMN "dateTo" DATE;

-- Drop unique constraint on TimeOff to allow multiple requests per date
DROP INDEX IF EXISTS "TimeOff_staffId_date_key";
