-- CreateEnum
CREATE TYPE "StoreStatusMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "store_status" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "mode" "StoreStatusMode" NOT NULL DEFAULT 'AUTO',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_status_pkey" PRIMARY KEY ("id")
);
