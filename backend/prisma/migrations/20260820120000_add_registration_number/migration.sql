-- AlterTable User
ALTER TABLE "User" ADD COLUMN "registrationNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_registrationNumber_key" ON "User"("registrationNumber");

-- CreateIndex
CREATE INDEX "User_registrationNumber_idx" ON "User"("registrationNumber");

-- AlterTable Member
ALTER TABLE "Member" ADD COLUMN "registrationNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Member_registrationNumber_key" ON "Member"("registrationNumber");

-- CreateIndex
CREATE INDEX "Member_registrationNumber_idx" ON "Member"("registrationNumber");

-- CreateSequence for atomic collision-safe registration number generation
CREATE SEQUENCE IF NOT EXISTS registration_number_seq START 100001 INCREMENT 1;
