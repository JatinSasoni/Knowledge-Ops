import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { AppError } from "../util/AppError";
import {
  memberParams,
  type AddMemberInput,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from "../schemas/workspace";
import { asyncHandler } from "../util/asyncHandler";

const slugify = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${randomBytes(3).toString("hex")}`;

export const createWorkspace = asyncHandler(async (req, res) => {
  const { name } = req.body as CreateWorkspaceInput;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug: slugify(name),
      members: { create: { userId: req.user!.id, role: "ADMIN" } },
    },
  });

  res.status(201).json({ workspace: { ...workspace, role: "ADMIN" } });
});

export const listMyWorkspaces = asyncHandler(async (req, res) => {
  const memberships = await prisma.member.findMany({
    where: { userId: req.user!.id },
    include: { workspace: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })),
  });
});

// GET /api/workspaces/:workspaceId
export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: req.membership!.workspaceId },
    include: { _count: { select: { members: true, documents: true } } },
  });

  res.json({ workspace: { ...workspace, role: req.membership!.role } });
});

// GET /api/workspaces/:workspaceId/members
export const listMembers = asyncHandler(async (req, res) => {
  const members = await prisma.member.findMany({
    where: { workspaceId: req.membership!.workspaceId },
    select: { id: true, role: true, createdAt: true, user: { select: { id: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json({ members });
});

// POST /api/workspaces/:workspaceId/members (ADMIN only)
export const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body as AddMemberInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw AppError.notFound("No user with that email");

  const member = await prisma.member.create({
    data: { userId: user.id, workspaceId: req.membership!.workspaceId, role },
    select: { id: true, role: true, user: { select: { id: true, email: true } } },
  });

  res.status(201).json({ member });
});

// PATCH /api/v1/workspaces/:workspaceId (ADMIN only)
export const updateWorkspace = asyncHandler(async (req, res) => {
  const { name } = req.body as UpdateWorkspaceInput;

  const workspace = await prisma.workspace.update({
    where: { id: req.membership!.workspaceId },
    data: { name },
  });

  res.json({ workspace: { ...workspace, role: req.membership!.role } });
});

// DELETE /api/v1/workspaces/:workspaceId (ADMIN only)
export const deleteWorkspace = asyncHandler(async (req, res) => {
  await prisma.workspace.delete({
    where: { id: req.membership!.workspaceId },
  });

  res.status(204).end();
});

// DELETE /api/v1/workspaces/:workspaceId/members/:userId (ADMIN only)
export const removeMember = asyncHandler(async (req, res) => {
  const { workspaceId, userId } = memberParams.parse(req.params);

  await prisma.$transaction(async (tx) => {
    const target = await tx.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { id: true, role: true },
    });
    if (!target) throw AppError.notFound("Member not found");

    if (target.role === "ADMIN") {
      const adminCount = await tx.member.count({
        where: { workspaceId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw AppError.conflict("Cannot remove the last admin of a workspace");
      }
    }

    await tx.member.delete({ where: { id: target.id } });
  });

  res.status(204).end();
});
