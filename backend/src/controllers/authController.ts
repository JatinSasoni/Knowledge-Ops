import bcrypt from "bcryptjs";
import { asyncHandler } from "../util/asyncHandler.js";
import { AppError } from "../util/AppError.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.js";
import { prisma } from "../lib/prisma.js";
import { createRefreshToken, hashToken, signAccessToken } from "../lib/tokens.js";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "../lib/cookies.js";
import type { Response } from "express";

type SessionUser = { id: string; email: string; createdAt: Date };

const publicUser = (u: { id: string; email: string; createdAt: Date }) => ({
  id: u.id,
  email: u.email,
  createdAt: u.createdAt,
});

async function startSession(res: Response, user: SessionUser) {
  const refresh = await createRefreshToken(prisma, user.id);
  setRefreshCookie(res, refresh);
  return signAccessToken({ sub: user.id, email: user.email });
}

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body as RegisterInput;
  const user = await prisma.user.create({
    data: { email, password: await bcrypt.hash(password, 10) },
  });
  const accessToken = await startSession(res, user);
  res.status(201).json({ user: publicUser(user), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw AppError.unauthorized("Invalid email or password");
  }
  const accessToken = await startSession(res, user);
  res.json({ user: publicUser(user), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const raw: unknown = req.cookies?.[REFRESH_COOKIE];
  if (typeof raw !== "string") throw AppError.unauthorized("No session");

  const result = await prisma.$transaction(async (tx) => {
    const stored = await tx.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
    if (!stored) return { kind: "invalid" } as const;

    // Already used: someone replayed an old token, so revoke the whole family
    if (stored.revokedAt) {
      await tx.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { kind: "reused" } as const;
    }

    if (stored.expiresAt <= new Date()) return { kind: "invalid" } as const;

    // Claim it atomically: only one concurrent request can flip revokedAt from null
    const claimed = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) return { kind: "reused" } as const;

    const next = await createRefreshToken(tx, stored.userId, stored.familyId);
    return { kind: "ok", refresh: next, user: stored.user } as const;
  });

  if (result.kind !== "ok") {
    clearRefreshCookie(res);
    throw AppError.unauthorized("Session expired, please sign in again");
  }

  setRefreshCookie(res, result.refresh);
  res.json({
    accessToken: signAccessToken({ sub: result.user.id, email: result.user.email }),
  });
});

export const logout = asyncHandler(async (req, res) => {
  const raw: unknown = req.cookies?.[REFRESH_COOKIE];
  if (typeof raw === "string") {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearRefreshCookie(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw AppError.unauthorized("User no longer exists");
  res.json({ user: publicUser(user) });
});
