import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    res.locals.query = schema.parse(req.query);
    next();
  };
