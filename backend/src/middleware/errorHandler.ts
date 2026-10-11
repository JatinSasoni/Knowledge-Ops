import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../util/AppError";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";

import { Prisma } from "../../generated/prisma/client";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "Resource already exists",
            details: err.meta?.target,
          },
        });
      case "P2025":
        return res
          .status(404)
          .json({ error: { code: "NOT_FOUND", message: "Resource not found" } });
      case "P2003":
        return res.status(400).json({
          error: { code: "INVALID_REFERENCE", message: "Related resource does not exist" },
        });
    }
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: { code: "TOKEN_EXPIRED", message: "Token expired" } });
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Invalid token" } });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res
      .status(400)
      .json({ error: { code: "INVALID_JSON", message: "Malformed JSON body" } });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
