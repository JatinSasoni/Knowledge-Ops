/*
  Warnings:

  - The `role` column on the `Member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE INDEX "Document_workspaceId_idx" ON "Document"("workspaceId");
