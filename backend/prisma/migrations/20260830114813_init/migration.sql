-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'CENTRE_STAFF', 'CENTRE_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'ARRIVED', 'WEIGHING', 'QUALITY_CHECK', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('WAITING', 'CALLED', 'ARRIVED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CounterStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "QualityResult" AS ENUM ('PASSED', 'FAILED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "aadhaarMasked" TEXT NOT NULL,
    "aadhaarHash" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "tehsil" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "khasraNumber" TEXT NOT NULL,
    "landOwnerName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "accountNumberHash" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerVerificationHistory" (
    "id" SERIAL NOT NULL,
    "farmerProfileId" INTEGER NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "remarks" TEXT,
    "verifiedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerVerificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementCentre" (
    "id" SERIAL NOT NULL,
    "centreId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementCentre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" SERIAL NOT NULL,
    "centreId" INTEGER NOT NULL,
    "counterNumber" INTEGER NOT NULL,
    "status" "CounterStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" SERIAL NOT NULL,
    "staffProfileId" INTEGER NOT NULL,
    "centreId" INTEGER NOT NULL,
    "counterId" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Crop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '₹/Qtl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementSeason" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerCropRegistration" (
    "id" SERIAL NOT NULL,
    "farmerProfileId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "estimatedYield" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerCropRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotConfig" (
    "id" SERIAL NOT NULL,
    "centreId" INTEGER,
    "slotTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "SlotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementBooking" (
    "id" TEXT NOT NULL,
    "farmerProfileId" INTEGER NOT NULL,
    "centreId" INTEGER NOT NULL,
    "cropId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "slotTime" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "isTatkaal" BOOLEAN NOT NULL DEFAULT false,
    "tatkaalFeePaid" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueToken" (
    "id" SERIAL NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tokenNumber" INTEGER NOT NULL,
    "centreId" INTEGER NOT NULL,
    "counterId" INTEGER,
    "status" "TokenStatus" NOT NULL DEFAULT 'WAITING',
    "queuePosition" INTEGER NOT NULL,
    "calledAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenStatusHistory" (
    "id" SERIAL NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "status" "TokenStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementTransaction" (
    "id" SERIAL NOT NULL,
    "bookingId" TEXT NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "rateUsed" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeighingRecord" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "tareWeight" DOUBLE PRECISION NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceMetadata" TEXT,

    CONSTRAINT "WeighingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropGrade" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "priceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "CropGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropPrice" (
    "id" SERIAL NOT NULL,
    "cropId" INTEGER NOT NULL,
    "centreId" INTEGER,
    "mspPrice" DOUBLE PRECISION NOT NULL,
    "marketPrice" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "moisture" DOUBLE PRECISION NOT NULL,
    "foreignMatter" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "result" "QualityResult" NOT NULL,
    "rejectionReason" TEXT,
    "inspectorId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_userId_key" ON "FarmerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_aadhaarHash_key" ON "FarmerProfile"("aadhaarHash");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementCentre_centreId_key" ON "ProcurementCentre"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_name_key" ON "Crop"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Crop_code_key" ON "Crop"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "QueueToken_bookingId_key" ON "QueueToken"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementTransaction_bookingId_key" ON "ProcurementTransaction"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "WeighingRecord_transactionId_key" ON "WeighingRecord"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_transactionId_key" ON "QualityInspection"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionNumber_key" ON "Payment"("transactionNumber");

-- AddForeignKey
ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerVerificationHistory" ADD CONSTRAINT "FarmerVerificationHistory_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerVerificationHistory" ADD CONSTRAINT "FarmerVerificationHistory_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerCropRegistration" ADD CONSTRAINT "FarmerCropRegistration_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerCropRegistration" ADD CONSTRAINT "FarmerCropRegistration_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotConfig" ADD CONSTRAINT "SlotConfig_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementBooking" ADD CONSTRAINT "ProcurementBooking_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementBooking" ADD CONSTRAINT "ProcurementBooking_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementBooking" ADD CONSTRAINT "ProcurementBooking_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementBooking" ADD CONSTRAINT "ProcurementBooking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ProcurementSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueToken" ADD CONSTRAINT "QueueToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProcurementBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueToken" ADD CONSTRAINT "QueueToken_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueToken" ADD CONSTRAINT "QueueToken_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenStatusHistory" ADD CONSTRAINT "TokenStatusHistory_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "QueueToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementTransaction" ADD CONSTRAINT "ProcurementTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ProcurementBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ProcurementTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeighingRecord" ADD CONSTRAINT "WeighingRecord_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropGrade" ADD CONSTRAINT "CropGrade_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPrice" ADD CONSTRAINT "CropPrice_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropPrice" ADD CONSTRAINT "CropPrice_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "ProcurementCentre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ProcurementTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ProcurementTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
