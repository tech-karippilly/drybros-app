-- CreateEnum
CREATE TYPE "TripOfferStatus" AS ENUM ('OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DistanceScopeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('MANUAL', 'AUTOMATIC', 'PREMIUM_CARS', 'LUXURY_CARS', 'SPORTY_CARS');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DriverEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT');

-- CreateEnum
CREATE TYPE "DriverTripStatus" AS ENUM ('AVAILABLE', 'ON_TRIP');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('UPI', 'IN_HAND', 'CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'PAID', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "RelieveReason" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_ENDED', 'PERFORMANCE_ISSUES', 'MISCONDUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'FIRED', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TripPatternStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TripTypeConfigStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('NOT_ASSIGNED', 'ASSIGNED', 'TRIP_STARTED', 'TRIP_PROGRESS', 'TRIP_ENDED', 'COMPLETED', 'PAYMENT_DONE', 'REQUESTED', 'DRIVER_ON_THE_WAY', 'IN_PROGRESS', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_OFFICE', 'REJECTED_BY_DRIVER', 'DRIVER_ACCEPTED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('CITY_ROUND', 'CITY_DROPOFF', 'LONG_ROUND', 'LONG_DROPOFF');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OFFICE_STAFF', 'DRIVER', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "FranchiseStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'TEMPORARILY_CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ComplaintSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintResolutionAction" AS ENUM ('WARNING', 'FIRE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'EMERGENCY_LEAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('TRIP_CREATED', 'TRIP_ASSIGNED', 'TRIP_ACCEPTED', 'TRIP_REJECTED', 'TRIP_STARTED', 'TRIP_ENDED', 'TRIP_CANCELLED', 'TRIP_STATUS_CHANGED', 'TRIP_UPDATED', 'DRIVER_CREATED', 'DRIVER_UPDATED', 'DRIVER_STATUS_CHANGED', 'DRIVER_CLOCK_IN', 'DRIVER_CLOCK_OUT', 'STAFF_CREATED', 'STAFF_UPDATED', 'STAFF_STATUS_CHANGED', 'STAFF_CLOCK_IN', 'STAFF_CLOCK_OUT', 'COMPLAINT_CREATED', 'COMPLAINT_RESOLVED', 'COMPLAINT_STATUS_CHANGED', 'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'RATING_SUBMITTED', 'ATTENDANCE_RECORDED', 'LOGIN', 'LOGOUT', 'CHECK_IN', 'CHECK_OUT', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'FRANCHISE_CREATED', 'FRANCHISE_UPDATED', 'FRANCHISE_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('TRIP', 'DRIVER', 'STAFF', 'CUSTOMER', 'FRANCHISE', 'COMPLAINT', 'LEAVE_REQUEST', 'RATING', 'ATTENDANCE', 'OTHER', 'USER');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('PENALTY', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('ARRIVED_ON_LOCATION', 'TRIP_INITIATED', 'TRIP_STARTED', 'TRIP_LOCATION_REACHED', 'TRIP_DESTINATION_REACHED', 'TRIP_END_INITIATED', 'TRIP_ENDED', 'TRIP_AMOUNT_COLLECTED', 'PAYMENT_COLLECTED', 'PAYMENT_SUBMITTED_TO_BRANCH', 'STATUS_CHANGED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "franchiseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistanceScope" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DistanceScopeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistanceScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "altPhone" TEXT,
    "driverCode" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "emergencyContactRelation" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpDate" TIMESTAMP(3) NOT NULL,
    "licenseType" TEXT,
    "employmentType" "DriverEmploymentType",
    "bankAccountName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankIfscCode" TEXT NOT NULL,
    "aadharCard" BOOLEAN NOT NULL DEFAULT false,
    "license" BOOLEAN NOT NULL DEFAULT false,
    "educationCert" BOOLEAN NOT NULL DEFAULT false,
    "previousExp" BOOLEAN NOT NULL DEFAULT false,
    "carTypes" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
    "driverTripStatus" "DriverTripStatus" NOT NULL DEFAULT 'AVAILABLE',
    "complaintCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "bannedGlobally" BOOLEAN NOT NULL DEFAULT false,
    "dailyTargetAmount" INTEGER,
    "remainingDailyLimit" DECIMAL(10,2),
    "cashInHand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "incentive" DECIMAL(10,2),
    "bonus" DECIMAL(10,2),
    "currentRating" DOUBLE PRECISION,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "locationAccuracyM" DOUBLE PRECISION,
    "locationUpdatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Franchise" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "averageRating" DOUBLE PRECISION,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "inchargeName" TEXT,
    "storeImage" TEXT,
    "legalDocumentsCollected" BOOLEAN NOT NULL DEFAULT false,
    "status" "FranchiseStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Franchise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "franchiseId" UUID NOT NULL,
    "monthlySalary" DECIMAL(10,2) NOT NULL,
    "address" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL,
    "emergencyContactRelation" TEXT NOT NULL,
    "profilePic" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "govtId" BOOLEAN NOT NULL DEFAULT false,
    "addressProof" BOOLEAN NOT NULL DEFAULT false,
    "certificates" BOOLEAN NOT NULL DEFAULT false,
    "previousExperienceCert" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "suspendedUntil" TIMESTAMP(3),
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relieveDate" TIMESTAMP(3),
    "relieveReason" "RelieveReason",

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffHistory" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "changedBy" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "franchiseId" UUID NOT NULL,
    "driverId" UUID,
    "customerId" UUID,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'NOT_ASSIGNED',
    "pickupLocation" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropLocation" TEXT,
    "dropLat" DOUBLE PRECISION,
    "dropLng" DOUBLE PRECISION,
    "destinationLat" DOUBLE PRECISION,
    "destinationLng" DOUBLE PRECISION,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "startOtp" TEXT,
    "endOtp" TEXT,
    "baseAmount" INTEGER NOT NULL,
    "extraAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "finalAmount" INTEGER NOT NULL,
    "isAmountOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMode" "PaymentMode",
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "alternativePhone" TEXT,
    "carType" TEXT,
    "carGearType" TEXT,
    "customerEmail" TEXT,
    "dropLocationNote" TEXT,
    "isDetailsReconfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isFareDiscussed" BOOLEAN NOT NULL DEFAULT false,
    "isPriceAccepted" BOOLEAN NOT NULL DEFAULT false,
    "pickupLocationNote" TEXT,
    "id" UUID NOT NULL,
    "tripPlacedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "dropAddress" TEXT,
    "pickupAddress" TEXT,
    "startOdometer" DOUBLE PRECISION,
    "endOdometer" DOUBLE PRECISION,
    "carImageFront" TEXT,
    "carImageBack" TEXT,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripOffer" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "status" "TripOfferStatus" NOT NULL DEFAULT 'OFFERED',
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPattern" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TripPatternStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "TripPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTypeConfig" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "distanceScopeId" UUID NOT NULL,
    "tripPatternId" UUID NOT NULL,
    "specialPrice" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" DOUBLE PRECISION,
    "basePricePerHour" DOUBLE PRECISION,
    "baseDuration" DOUBLE PRECISION,
    "baseDistance" DOUBLE PRECISION,
    "extraPerHour" DOUBLE PRECISION,
    "extraPerHalfHour" DOUBLE PRECISION,
    "extraPerKm" DOUBLE PRECISION,
    "premiumCarMultiplier" DOUBLE PRECISION,
    "forPremiumCars" JSONB,
    "distanceSlabs" JSONB,
    "status" "TripTypeConfigStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTypeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "id" UUID NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "franchiseId" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverEarningsConfig" (
    "id" UUID NOT NULL,
    "franchiseId" UUID,
    "driverId" UUID,
    "dailyTargetDefault" INTEGER NOT NULL DEFAULT 1250,
    "incentiveTier1Min" INTEGER NOT NULL DEFAULT 1250,
    "incentiveTier1Max" INTEGER NOT NULL DEFAULT 1550,
    "incentiveTier1Type" TEXT NOT NULL DEFAULT 'full_extra',
    "incentiveTier2Min" INTEGER NOT NULL DEFAULT 1550,
    "incentiveTier2Percent" INTEGER NOT NULL DEFAULT 20,
    "monthlyBonusTiers" JSONB,
    "monthlyDeductionTiers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,

    CONSTRAINT "DriverEarningsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" UUID NOT NULL,
    "driverId" UUID,
    "staffId" UUID,
    "customerId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedBy" UUID,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "ComplaintSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "resolution" TEXT,
    "resolutionAction" "ComplaintResolutionAction",
    "resolutionReason" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "driverId" UUID,
    "staffId" UUID,
    "userId" UUID,
    "date" DATE NOT NULL,
    "loginTime" TIMESTAMP(3),
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" UUID NOT NULL,
    "attendanceId" UUID NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOut" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" UUID NOT NULL,
    "driverId" UUID,
    "staffId" UUID,
    "userId" UUID,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverRating" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "tripId" UUID,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "overallRating" DOUBLE PRECISION NOT NULL,
    "experience" TEXT,
    "drivingSafety" DOUBLE PRECISION NOT NULL,
    "drivingSmoothness" DOUBLE PRECISION NOT NULL,
    "behaviorPoliteness" DOUBLE PRECISION NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripReview" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "franchiseId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "tripRating" INTEGER NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "driverRating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT,
    "franchiseId" UUID,
    "driverId" UUID,
    "staffId" UUID,
    "tripId" UUID,
    "userId" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "type" "PenaltyType" NOT NULL DEFAULT 'PENALTY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPenalty" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "penaltyId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "violationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDailyMetrics" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "numberOfTrips" INTEGER NOT NULL DEFAULT 0,
    "numberOfComplaints" INTEGER NOT NULL DEFAULT 0,
    "distanceTraveled" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tripAverageRating" DOUBLE PRECISION,
    "overallRating" DOUBLE PRECISION,
    "dailyLimit" DECIMAL(10,2),
    "remainingLimit" DECIMAL(10,2),
    "incentive" DECIMAL(10,2),
    "bonus" DECIMAL(10,2),
    "cashInHand" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashSubmittedOnDate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStatusHistory" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "driverId" UUID,
    "eventType" "TripEventType" NOT NULL,
    "status" "TripStatus",
    "description" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,

    CONSTRAINT "TripStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driverCode_key" ON "Driver"("driverCode");

-- CreateIndex
CREATE UNIQUE INDEX "Franchise_code_key" ON "Franchise"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_phone_key" ON "Staff"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_franchiseId_isActive_idx" ON "Staff"("franchiseId", "isActive");

-- CreateIndex
CREATE INDEX "Staff_franchiseId_status_idx" ON "Staff"("franchiseId", "status");

-- CreateIndex
CREATE INDEX "StaffHistory_createdAt_idx" ON "StaffHistory"("createdAt");

-- CreateIndex
CREATE INDEX "StaffHistory_staffId_idx" ON "StaffHistory"("staffId");

-- CreateIndex
CREATE INDEX "TripOffer_driverId_status_expiresAt_idx" ON "TripOffer"("driverId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "TripOffer_tripId_status_idx" ON "TripOffer"("tripId", "status");

-- CreateIndex
CREATE INDEX "TripOffer_expiresAt_idx" ON "TripOffer"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TripOffer_tripId_driverId_key" ON "TripOffer"("tripId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_lockedUntil_idx" ON "User"("lockedUntil");

-- CreateIndex
CREATE INDEX "User_franchiseId_idx" ON "User"("franchiseId");

-- CreateIndex
CREATE INDEX "User_role_franchiseId_idx" ON "User"("role", "franchiseId");

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_franchiseId_idx" ON "DriverEarningsConfig"("franchiseId");

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_driverId_idx" ON "DriverEarningsConfig"("driverId");

-- CreateIndex
CREATE INDEX "DriverEarningsConfig_franchiseId_driverId_idx" ON "DriverEarningsConfig"("franchiseId", "driverId");

-- CreateIndex
CREATE INDEX "Complaint_driverId_idx" ON "Complaint"("driverId");

-- CreateIndex
CREATE INDEX "Complaint_staffId_idx" ON "Complaint"("staffId");

-- CreateIndex
CREATE INDEX "Complaint_customerId_idx" ON "Complaint"("customerId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_driverId_date_idx" ON "Attendance"("driverId", "date");

-- CreateIndex
CREATE INDEX "Attendance_staffId_date_idx" ON "Attendance"("staffId", "date");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_custom_idx" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_driverId_date_key" ON "Attendance"("driverId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_staffId_date_key" ON "Attendance"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "AttendanceSession_attendanceId_clockIn_idx" ON "AttendanceSession"("attendanceId", "clockIn");

-- CreateIndex
CREATE INDEX "AttendanceSession_attendanceId_clockOut_idx" ON "AttendanceSession"("attendanceId", "clockOut");

-- CreateIndex
CREATE INDEX "LeaveRequest_driverId_idx" ON "LeaveRequest"("driverId");

-- CreateIndex
CREATE INDEX "LeaveRequest_staffId_idx" ON "LeaveRequest"("staffId");

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "DriverRating_driverId_idx" ON "DriverRating"("driverId");

-- CreateIndex
CREATE INDEX "DriverRating_tripId_idx" ON "DriverRating"("tripId");

-- CreateIndex
CREATE INDEX "DriverRating_createdAt_idx" ON "DriverRating"("createdAt");

-- CreateIndex
CREATE INDEX "TripReview_tripId_idx" ON "TripReview"("tripId");

-- CreateIndex
CREATE INDEX "TripReview_driverId_idx" ON "TripReview"("driverId");

-- CreateIndex
CREATE INDEX "TripReview_customerId_idx" ON "TripReview"("customerId");

-- CreateIndex
CREATE INDEX "TripReview_franchiseId_idx" ON "TripReview"("franchiseId");

-- CreateIndex
CREATE INDEX "ActivityLog_franchiseId_createdAt_idx" ON "ActivityLog"("franchiseId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_driverId_createdAt_idx" ON "ActivityLog"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_staffId_createdAt_idx" ON "ActivityLog"("staffId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_tripId_createdAt_idx" ON "ActivityLog"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Penalty_isActive_idx" ON "Penalty"("isActive");

-- CreateIndex
CREATE INDEX "Penalty_type_idx" ON "Penalty"("type");

-- CreateIndex
CREATE INDEX "DriverPenalty_driverId_appliedAt_idx" ON "DriverPenalty"("driverId", "appliedAt");

-- CreateIndex
CREATE INDEX "DriverPenalty_penaltyId_idx" ON "DriverPenalty"("penaltyId");

-- CreateIndex
CREATE INDEX "DriverPenalty_appliedAt_idx" ON "DriverPenalty"("appliedAt");

-- CreateIndex
CREATE INDEX "DriverPenalty_violationDate_idx" ON "DriverPenalty"("violationDate");

-- CreateIndex
CREATE INDEX "DriverDailyMetrics_driverId_date_idx" ON "DriverDailyMetrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "DriverDailyMetrics_date_idx" ON "DriverDailyMetrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDailyMetrics_driverId_date_key" ON "DriverDailyMetrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "TripStatusHistory_tripId_occurredAt_idx" ON "TripStatusHistory"("tripId", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_driverId_occurredAt_idx" ON "TripStatusHistory"("driverId", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_eventType_occurredAt_idx" ON "TripStatusHistory"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "TripStatusHistory_occurredAt_idx" ON "TripStatusHistory"("occurredAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffHistory" ADD CONSTRAINT "StaffHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripOffer" ADD CONSTRAINT "TripOffer_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripOffer" ADD CONSTRAINT "TripOffer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTypeConfig" ADD CONSTRAINT "TripTypeConfig_distanceScopeId_fkey" FOREIGN KEY ("distanceScopeId") REFERENCES "DistanceScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTypeConfig" ADD CONSTRAINT "TripTypeConfig_tripPatternId_fkey" FOREIGN KEY ("tripPatternId") REFERENCES "TripPattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverRating" ADD CONSTRAINT "DriverRating_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_penaltyId_fkey" FOREIGN KEY ("penaltyId") REFERENCES "Penalty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPenalty" ADD CONSTRAINT "DriverPenalty_appliedBy_fkey" FOREIGN KEY ("appliedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDailyMetrics" ADD CONSTRAINT "DriverDailyMetrics_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStatusHistory" ADD CONSTRAINT "TripStatusHistory_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
