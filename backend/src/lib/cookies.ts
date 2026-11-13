import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE = "refresh_token";

const base: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
};

export const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...base,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });

export const clearRefreshCookie = (res: Response) => res.clearCookie(REFRESH_COOKIE, base);
