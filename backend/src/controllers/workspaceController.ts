import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { AppError } from "../util/AppError";
import type { AddMemberInput, CreateWorkspaceInput } from "../schemas/workspace";
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
