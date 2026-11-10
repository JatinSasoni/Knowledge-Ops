import type { Role } from "../generated/prisma/client.js";
import type { RequestHandler } from "express";
import { asyncHandler } from "../util/asyncHandler.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../util/AppError.js";
import { workspaceParams } from "../schemas/workspace.js";

export const requireMembership = (...allowedRoles: Role[]): RequestHandler =>
  asyncHandler(async (req, _res, next) => {
    const { workspaceId } = workspaceParams.parse(req.params);
    const userId = req.user!.id;

    const member = await prisma.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      select: {
        role: true,
      },
    });

    if (!member) throw AppError.notFound("Workspace not found");
    if (allowedRoles.length && !allowedRoles.includes(member.role)) {
      throw AppError.forbidden("Insufficient permissions");
    }

    req.membership = { workspaceId, role: member.role };
    next();
  });
