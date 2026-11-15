/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Document` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "fileUrl",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "status" "DocStatus" NOT NULL DEFAULT 'UPLOADED';
