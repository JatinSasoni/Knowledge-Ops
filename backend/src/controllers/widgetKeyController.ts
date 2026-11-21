import { randomBytes } from "node:crypto";
import { getEntitlements } from "../lib/entitlements.js";
import { prisma } from "../lib/prisma.js";
import {
  widgetKeyParams,
  type CreateWidgetKeyInput,
  type UpdateWidgetKeyInput,
} from "../schemas/widgetKey.js";
import { AppError } from "../util/AppError.js";
import { asyncHandler } from "../util/asyncHandler.js";

const MAX_ACTIVE_KEYS = 5;

const keyFields = {
  id: true,
  name: true,
  key: true,
  allowedOrigins: true,
  revokedAt: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

// POST /api/v1/workspaces/:workspaceId/widget-keys (ADMIN only)
export const createWidgetKey = asyncHandler(async (req, res) => {
  const { name, allowedOrigins } = req.body as CreateWidgetKeyInput;
  const workspaceId = req.membership!.workspaceId;

  // The ONE place that decides what a workspace may do (visibility today, a plan later).
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
  if (!getEntitlements(workspace).widget) {
    throw AppError.forbidden("The widget is only available for public workspaces");
  }

  const active = await prisma.widgetKey.count({ where: { workspaceId, revokedAt: null } });
  if (active >= MAX_ACTIVE_KEYS) {
    throw AppError.conflict(`A workspace can have at most ${MAX_ACTIVE_KEYS} active widget keys`);
  }

  const widgetKey = await prisma.widgetKey.create({
    data: {
      workspaceId,
      name,
      allowedOrigins,
      key: `pk_${randomBytes(24).toString("base64url")}`, // 32 random characters
    },
    select: keyFields,
  });
  res.status(201).json({ widgetKey });
});

// GET /api/v1/workspaces/:workspaceId/widget-keys (ADMIN only)
export const listWidgetKeys = asyncHandler(async (req, res) => {
  const widgetKeys = await prisma.widgetKey.findMany({
    where: { workspaceId: req.membership!.workspaceId },
    orderBy: { createdAt: "desc" },
    select: keyFields,
  });
  res.json({ widgetKeys });
});

// PATCH /api/v1/workspaces/:workspaceId/widget-keys/:keyId (ADMIN only)
export const updateWidgetKey = asyncHandler(async (req, res) => {
  const { workspaceId, keyId } = widgetKeyParams.parse(req.params);
  const { name, allowedOrigins } = req.body as UpdateWidgetKeyInput;

  // updateMany with workspaceId in the filter: a key from ANOTHER workspace can't be touched,
  // even if someone guesses its id.
  const { count } = await prisma.widgetKey.updateMany({
    where: { id: keyId, workspaceId, revokedAt: null },
    data: { name, allowedOrigins },
  });
  if (count === 0) throw AppError.notFound("Widget key not found");

  const widgetKey = await prisma.widgetKey.findUniqueOrThrow({
    where: { id: keyId },
    select: keyFields,
  });
  res.json({ widgetKey });
});

// DELETE /api/v1/workspaces/:workspaceId/widget-keys/:keyId (ADMIN only): revoke
export const revokeWidgetKey = asyncHandler(async (req, res) => {
  const { workspaceId, keyId } = widgetKeyParams.parse(req.params);

  const { count } = await prisma.widgetKey.updateMany({
    where: { id: keyId, workspaceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw AppError.notFound("Widget key not found");

  res.status(204).end();
});
