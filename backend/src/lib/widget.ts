import { prisma } from "./prisma.js";
import { getEntitlements } from "./entitlements.js";

// "2026-11": the usage row for the current calendar month (UTC).
export const currentMonth = () => new Date().toISOString().slice(0, 7);

/*
 * Every widget request starts here. A key works only if:
 *   it exists, it isn't revoked, AND its workspace may use the widget right now
 *   (getEntitlements: today "is PUBLIC", later "has a paid plan").
 * Returns null otherwise. Callers must NOT say which check failed: an attacker
 * shouldn't learn whether a key exists, was revoked, or belongs to a private workspace.
 */

export async function findActiveWidget(key: string) {
  const widgetKey = await prisma.widgetKey.findUnique({
    where: { key },
    include: { workspace: true },
  });
  if (!widgetKey || widgetKey.revokedAt) return null;

  const entitlements = getEntitlements(widgetKey.workspace);
  if (!entitlements.widget) return null;

  return { widgetKey, workspace: widgetKey.workspace, entitlements };
}

export async function widgetAnswersThisMonth(workspaceId: string) {
  const usage = await prisma.widgetUsage.findUnique({
    where: { workspaceId_month: { workspaceId, month: currentMonth() } },
  });
  return usage?.answers ?? 0;
}

// Counts one answer. upsert = create this month's row on the first answer, then add 1.
export async function countWidgetAnswer(workspaceId: string) {
  await prisma.widgetUsage.upsert({
    where: { workspaceId_month: { workspaceId, month: currentMonth() } },
    create: { workspaceId, month: currentMonth(), answers: 1 },
    update: { answers: { increment: 1 } },
  });
}
