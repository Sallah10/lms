-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."deletion_audits" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "leadName" TEXT NOT NULL,
    "leadEmail" TEXT NOT NULL,
    "deletedById" TEXT NOT NULL,
    "deletedByName" TEXT NOT NULL,
    "deleteReason" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "deletion_audits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
