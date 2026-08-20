-- CreateTable
CREATE TABLE "Gym" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "fitPassEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSettings" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "openingTime" TEXT NOT NULL DEFAULT '06:00',
    "closingTime" TEXT NOT NULL DEFAULT '22:00',
    "peakHours" TEXT,
    "genderType" TEXT NOT NULL DEFAULT 'Unisex',
    "slotCapacity" INTEGER NOT NULL DEFAULT 30,
    "amenities" TEXT,
    "rules" TEXT,
    "announcement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "memberId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "description" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "sessions" INTEGER,
    "dailyLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "planId" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sessionsRemaining" INTEGER,
    "sessionsTotal" INTEGER,
    "currentSessionGymId" TEXT,
    "currentSessionEndsAt" TIMESTAMP(3),
    "cooldownEndsAt" TIMESTAMP(3),
    "freezeHistory" TEXT,
    "frozenAt" TIMESTAMP(3),
    "resumeDate" TIMESTAMP(3),
    "freezeDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "maxFreezeDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCheckIn" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cooldownUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitPassAuditLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberName" TEXT NOT NULL,
    "gymIdVisited" TEXT NOT NULL,
    "gymName" TEXT NOT NULL,
    "branchIdVisited" TEXT,
    "branchNameVisited" TEXT,
    "checkInTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionsUsedBefore" INTEGER NOT NULL,
    "sessionsDeducted" INTEGER NOT NULL,
    "remainingSessionsAfter" INTEGER NOT NULL,
    "accessStatus" TEXT NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitPassAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "bookings" TEXT NOT NULL DEFAULT '[]',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'Walk-in',
    "status" TEXT NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "fitPassEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'member',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberTrainerAssignment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "description" TEXT,
    "exercises" TEXT NOT NULL DEFAULT '[]',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "notes" TEXT,
    "schedule" TEXT NOT NULL DEFAULT '[]',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "dailyCalories" INTEGER,
    "notes" TEXT,
    "meals" TEXT NOT NULL DEFAULT '[]',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "description" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PtPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtSession" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PtSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyAssessment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bodyFatPercentage" DOUBLE PRECISION,
    "muscleMassKg" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipsCm" DOUBLE PRECISION,
    "bicepsCm" DOUBLE PRECISION,
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerAttendance" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT,
    "workingHours" DOUBLE PRECISION,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainerAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerSalary" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionPerPtSession" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PtCommission" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "sessionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PtCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Functional',
    "purchaseDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "vendor" TEXT,
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "cost" DOUBLE PRECISION,
    "loggedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "memberId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymProfile" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "heroImages" TEXT NOT NULL DEFAULT '[]',
    "galleryImages" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "amenities" TEXT NOT NULL DEFAULT '[]',
    "operatingHours" TEXT,
    "rules" TEXT NOT NULL DEFAULT '[]',
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Approved',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymPost" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "branchId" TEXT,
    "caption" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'Published',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdByName" TEXT NOT NULL DEFAULT 'Gym Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymProfileViewLog" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'explore',
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymProfileViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gym_status_idx" ON "Gym"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GymSettings_gymId_key" ON "GymSettings"("gymId");

-- CreateIndex
CREATE INDEX "GymSettings_gymId_idx" ON "GymSettings"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_gymId_idx" ON "User"("gymId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_gymId_role_idx" ON "User"("gymId", "role");

-- CreateIndex
CREATE INDEX "Plan_gymId_idx" ON "Plan"("gymId");

-- CreateIndex
CREATE INDEX "Member_gymId_idx" ON "Member"("gymId");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_gymId_status_idx" ON "Member"("gymId", "status");

-- CreateIndex
CREATE INDEX "Member_gymId_branchId_status_idx" ON "Member"("gymId", "branchId", "status");

-- CreateIndex
CREATE INDEX "Member_expiryDate_idx" ON "Member"("expiryDate");

-- CreateIndex
CREATE INDEX "Member_phone_idx" ON "Member"("phone");

-- CreateIndex
CREATE INDEX "Member_planId_idx" ON "Member"("planId");

-- CreateIndex
CREATE INDEX "Attendance_gymId_date_idx" ON "Attendance"("gymId", "date");

-- CreateIndex
CREATE INDEX "Attendance_gymId_branchId_date_idx" ON "Attendance"("gymId", "branchId", "date");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

-- CreateIndex
CREATE INDEX "SessionCheckIn_gymId_status_idx" ON "SessionCheckIn"("gymId", "status");

-- CreateIndex
CREATE INDEX "SessionCheckIn_gymId_startedAt_idx" ON "SessionCheckIn"("gymId", "startedAt");

-- CreateIndex
CREATE INDEX "SessionCheckIn_gymId_branchId_memberId_idx" ON "SessionCheckIn"("gymId", "branchId", "memberId");

-- CreateIndex
CREATE INDEX "SessionCheckIn_memberId_idx" ON "SessionCheckIn"("memberId");

-- CreateIndex
CREATE INDEX "FitPassAuditLog_memberId_idx" ON "FitPassAuditLog"("memberId");

-- CreateIndex
CREATE INDEX "FitPassAuditLog_gymIdVisited_idx" ON "FitPassAuditLog"("gymIdVisited");

-- CreateIndex
CREATE INDEX "FitPassAuditLog_accessStatus_idx" ON "FitPassAuditLog"("accessStatus");

-- CreateIndex
CREATE INDEX "FitPassAuditLog_createdAt_idx" ON "FitPassAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_gymId_date_idx" ON "Payment"("gymId", "date");

-- CreateIndex
CREATE INDEX "Payment_gymId_branchId_date_idx" ON "Payment"("gymId", "branchId", "date");

-- CreateIndex
CREATE INDEX "Payment_gymId_branchId_idx" ON "Payment"("gymId", "branchId");

-- CreateIndex
CREATE INDEX "Payment_branchId_idx" ON "Payment"("branchId");

-- CreateIndex
CREATE INDEX "Payment_memberId_idx" ON "Payment"("memberId");

-- CreateIndex
CREATE INDEX "Expense_gymId_date_idx" ON "Expense"("gymId", "date");

-- CreateIndex
CREATE INDEX "GymClass_gymId_scheduleDate_idx" ON "GymClass"("gymId", "scheduleDate");

-- CreateIndex
CREATE INDEX "Lead_gymId_status_idx" ON "Lead"("gymId", "status");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "AuditLog_gymId_action_idx" ON "AuditLog"("gymId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Branch_gymId_idx" ON "Branch"("gymId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_read_idx" ON "Notification"("recipientId", "read");

-- CreateIndex
CREATE INDEX "Notification_gymId_idx" ON "Notification"("gymId");

-- CreateIndex
CREATE UNIQUE INDEX "OTP_email_key" ON "OTP"("email");

-- CreateIndex
CREATE INDEX "MemberTrainerAssignment_gymId_idx" ON "MemberTrainerAssignment"("gymId");

-- CreateIndex
CREATE INDEX "MemberTrainerAssignment_memberId_idx" ON "MemberTrainerAssignment"("memberId");

-- CreateIndex
CREATE INDEX "MemberTrainerAssignment_trainerId_idx" ON "MemberTrainerAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_gymId_branchId_idx" ON "WorkoutTemplate"("gymId", "branchId");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_gymId_name_idx" ON "WorkoutTemplate"("gymId", "name");

-- CreateIndex
CREATE INDEX "WorkoutPlan_gymId_createdAt_idx" ON "WorkoutPlan"("gymId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "WorkoutPlan_memberId_idx" ON "WorkoutPlan"("memberId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_trainerId_idx" ON "WorkoutPlan"("trainerId");

-- CreateIndex
CREATE INDEX "DietPlan_gymId_createdAt_idx" ON "DietPlan"("gymId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DietPlan_memberId_idx" ON "DietPlan"("memberId");

-- CreateIndex
CREATE INDEX "DietPlan_trainerId_idx" ON "DietPlan"("trainerId");

-- CreateIndex
CREATE INDEX "PtPackage_gymId_idx" ON "PtPackage"("gymId");

-- CreateIndex
CREATE INDEX "PtSession_gymId_sessionDate_idx" ON "PtSession"("gymId", "sessionDate" DESC);

-- CreateIndex
CREATE INDEX "PtSession_memberId_idx" ON "PtSession"("memberId");

-- CreateIndex
CREATE INDEX "PtSession_trainerId_idx" ON "PtSession"("trainerId");

-- CreateIndex
CREATE INDEX "BodyAssessment_gymId_assessmentDate_idx" ON "BodyAssessment"("gymId", "assessmentDate" DESC);

-- CreateIndex
CREATE INDEX "BodyAssessment_memberId_idx" ON "BodyAssessment"("memberId");

-- CreateIndex
CREATE INDEX "BodyAssessment_trainerId_idx" ON "BodyAssessment"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerAttendance_gymId_date_idx" ON "TrainerAttendance"("gymId", "date" DESC);

-- CreateIndex
CREATE INDEX "TrainerAttendance_trainerId_idx" ON "TrainerAttendance"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerSalary_trainerId_key" ON "TrainerSalary"("trainerId");

-- CreateIndex
CREATE INDEX "TrainerSalary_gymId_trainerId_idx" ON "TrainerSalary"("gymId", "trainerId");

-- CreateIndex
CREATE INDEX "PtCommission_gymId_date_idx" ON "PtCommission"("gymId", "date" DESC);

-- CreateIndex
CREATE INDEX "PtCommission_trainerId_idx" ON "PtCommission"("trainerId");

-- CreateIndex
CREATE INDEX "Payroll_gymId_year_month_idx" ON "Payroll"("gymId", "year", "month");

-- CreateIndex
CREATE INDEX "Payroll_trainerId_idx" ON "Payroll"("trainerId");

-- CreateIndex
CREATE INDEX "Equipment_gymId_status_idx" ON "Equipment"("gymId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_gymId_loggedDate_idx" ON "MaintenanceLog"("gymId", "loggedDate");

-- CreateIndex
CREATE INDEX "Review_gymId_idx" ON "Review"("gymId");

-- CreateIndex
CREATE INDEX "Review_memberId_idx" ON "Review"("memberId");

-- CreateIndex
CREATE INDEX "Review_gymId_memberId_idx" ON "Review"("gymId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "GymProfile_gymId_key" ON "GymProfile"("gymId");

-- CreateIndex
CREATE INDEX "GymProfile_city_idx" ON "GymProfile"("city");

-- CreateIndex
CREATE INDEX "GymProfile_status_idx" ON "GymProfile"("status");

-- CreateIndex
CREATE INDEX "GymProfile_gymId_idx" ON "GymProfile"("gymId");

-- CreateIndex
CREATE INDEX "GymPost_gymId_status_idx" ON "GymPost"("gymId", "status");

-- CreateIndex
CREATE INDEX "GymPost_createdAt_idx" ON "GymPost"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "GymProfileViewLog_gymId_viewedAt_idx" ON "GymProfileViewLog"("gymId", "viewedAt");

-- AddForeignKey
ALTER TABLE "GymSettings" ADD CONSTRAINT "GymSettings_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymProfile" ADD CONSTRAINT "GymProfile_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymPost" ADD CONSTRAINT "GymPost_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
