import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Prisma } from "../generated/prisma/client.js";

export type JwtPayload = { sub: string; email: string };

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

// Works with `prisma` or a transaction client `tx`
type Db = Prisma.TransactionClient;

export async function createRefreshToken(db: Db, userId: string, familyId: string = randomUUID()) {
  const raw = randomBytes(32).toString("base64url");
  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(raw),
      familyId,
      userId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return raw;
}
