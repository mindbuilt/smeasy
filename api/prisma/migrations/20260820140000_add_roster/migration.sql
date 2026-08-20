-- Migration: add_roster
-- Adds Roster model for tracking published/draft roster status per week

CREATE TABLE "Roster" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Roster_businessId_weekStart_key" ON "Roster"("businessId", "weekStart");

ALTER TABLE "Roster" ADD CONSTRAINT "Roster_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
