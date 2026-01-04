-- AlterTable
ALTER TABLE "OrderAdmin" ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "originHost" TEXT;
