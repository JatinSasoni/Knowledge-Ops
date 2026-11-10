import type { RequestHandler } from "express";
import { AppError } from "../util/AppError.js";
import { verifyToken } from "../lib/jwt.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or malformed Authorization header");
  }

  const payload = verifyToken(header.slice(7));
  req.user = { id: payload.sub, email: payload.email };
  next();
};
