import { prisma } from "../lib/prisma.js";
import { findValidInvitation } from "../lib/invitations.js";
import type { InvitationTokenInput } from "../schemas/invitation.js";
import { AppError } from "../util/AppError.js";
import { asyncHandler } from "../util/asyncHandler.js";

const INVALID = "This invitation is invalid or has expired. Ask for a new one.";

// POST /api/v1/invitations/preview (public): what the invite page shows before signing in.
// POST with the token in the body (not in the URL) so it never lands in server or proxy logs.
export const previewInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body as InvitationTokenInput;
  const invitation = await findValidInvitation(token);
  if (!invitation) throw AppError.notFound(INVALID);

  res.json({
    invitation: {
      email: invitation.email,
      role: invitation.role,
      workspaceName: invitation.workspace.name,
      invitedBy: invitation.invitedBy.email,
    },
  });
});

// POST /api/v1/invitations/accept (signed in)
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token } = req.body as InvitationTokenInput;
  const invitation = await findValidInvitation(token);
  if (!invitation) throw AppError.notFound(INVALID);

  // The invite is for one address: a forwarded link can't be used by another account.
  if (invitation.email !== req.user!.email.toLowerCase()) {
    throw AppError.forbidden(
      `This invitation is for ${invitation.email}. Sign in with that email to accept it.`,
    );
  }

  await prisma.$transaction(async (tx) => {
    // Claim it: only the first request succeeds (same trick as password reset).
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (count === 0) throw AppError.notFound(INVALID);

    // Already a member (e.g. added directly meanwhile)? Keep their membership as it is.
    await tx.member.upsert({
      where: { userId_workspaceId: { userId: req.user!.id, workspaceId: invitation.workspaceId } },
      create: { userId: req.user!.id, workspaceId: invitation.workspaceId, role: invitation.role },
      update: {},
    });
  });

  res.json({ workspaceId: invitation.workspaceId });
});
