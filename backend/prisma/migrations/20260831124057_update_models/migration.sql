-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'ABSENT';

-- AlterTable
ALTER TABLE "ProcurementBooking" ADD COLUMN     "vehicleNumber" TEXT,
ADD COLUMN     "vehicleType" TEXT;

-- AlterTable
ALTER TABLE "ProcurementCentre" ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "capacity" DOUBLE PRECISION,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "godownStorage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "maxStorage" DOUBLE PRECISION,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "panGstin" TEXT,
ADD COLUMN     "qualityTesting" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "staffCount" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tehsil" TEXT,
ADD COLUMN     "village" TEXT,
ADD COLUMN     "weighingFacility" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TrustScoreHistory" (
    "id" SERIAL NOT NULL,
    "farmerProfileId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrustScoreHistory" ADD CONSTRAINT "TrustScoreHistory_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "FarmerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
