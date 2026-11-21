-- CreateTable
CREATE TABLE "WidgetUsage" (
    "workspaceId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "answer" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WidgetUsage_pkey" PRIMARY KEY ("workspaceId","month")
);

-- AddForeignKey
ALTER TABLE "WidgetUsage" ADD CONSTRAINT "WidgetUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
