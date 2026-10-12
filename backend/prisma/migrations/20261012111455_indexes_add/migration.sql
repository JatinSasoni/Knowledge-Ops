-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Member_workspaceId_idx" ON "Member"("workspaceId");
