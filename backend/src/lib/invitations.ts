import { randomBytes } from "node:crypto";
import type { Role } from "../generated/prisma/client.js";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { hashToken } from "./tokens.js";
import { queueEmail } from "./email.js";
import { invitationEmail } from "./emailTemplates.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create (or replace) the pending invitation for this email in this workspace, and email it.
export async function inviteByEmail(input: {
  workspaceId: string;
  email: string;
  role: Role;
  inviter: { id: string; email: string };
}) {
  const raw = randomBytes(32).toString("base64url");

  const invitation = await prisma.$transaction(async (tx) => {
    // Inviting the same address again replaces the old link (only the newest works).
    await tx.invitation.deleteMany({
      where: { workspaceId: input.workspaceId, email: input.email, acceptedAt: null },
    });
    return tx.invitation.create({
      data: {
        workspaceId: input.workspaceId,
        email: input.email,
        role: input.role,
        invitedById: input.inviter.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        workspace: { select: { name: true } },
      },
    });
  });

  try {
    await queueEmail({
      to: input.email,
      subject: `${input.inviter.email} invited you to ${invitation.workspace.name} on Citely`,
      ...invitationEmail({
        inviter: input.inviter.email,
        workspace: invitation.workspace.name,
        role: input.role,
        link: `${env.APP_URL}/invite?token=${raw}`,
      }),
    });
  } catch (error) {
    console.error("[invites] couldn't queue the invitation email", error);
  }

  const { id, email, role, expiresAt, createdAt } = invitation;
  return { id, email, role, expiresAt, createdAt };
}

// A pending invitation for this token (valid = not used, not expired), with its workspace.
export async function findValidInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { email: true } },
    },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) return null;
  return invitation;
}
