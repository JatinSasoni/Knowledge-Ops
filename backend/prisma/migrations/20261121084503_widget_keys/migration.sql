-- CreateTable
CREATE TABLE "WidgetKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "allowedOrigins" TEXT[],
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetKey_key_key" ON "WidgetKey"("key");

-- CreateIndex
CREATE INDEX "WidgetKey_workspaceId_idx" ON "WidgetKey"("workspaceId");

-- AddForeignKey
ALTER TABLE "WidgetKey" ADD CONSTRAINT "WidgetKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
